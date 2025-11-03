import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from "npm:googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent');
    const cronHeader = req.headers.get('X-Cron-Secret');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (userAgent !== 'pg_net/0.19.5' && cronHeader !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // 1. Get all users with Google Calendar tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('*, user:profiles(id, email, google_calendar_settings)');

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No users with Google Calendar integration." }), { headers: corsHeaders });
    }

    let totalImported = 0;

    // 2. Get all existing event IDs from projects
    const { data: existingProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('origin_event_id')
      .not('origin_event_id', 'is', null);
    if (projectsError) throw projectsError;
    const existingEventIds = new Set(existingProjects.map(p => p.origin_event_id));

    for (const token of tokens) {
      const user = token.user;
      if (!user || !user.google_calendar_settings?.selected_calendars) {
        continue;
      }

      const oauth2Client = new google.auth.OAuth2(
        Deno.env.get("VITE_GOOGLE_CLIENT_ID"),
        Deno.env.get("GOOGLE_CLIENT_SECRET"),
        `https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/google-calendar-auth` // FIX: Added redirectUri
      );
      oauth2Client.setCredentials({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expiry_date: token.expiry_date ? new Date(token.expiry_date).getTime() : null,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const eventsToImport = [];

      for (const calendarId of user.google_calendar_settings.selected_calendars) {
        try {
          const res = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
          });

          if (res.data.items) {
            const newEvents = res.data.items.filter(event =>
              event.id && !existingEventIds.has(event.id) && event.status !== 'cancelled'
            );
            eventsToImport.push(...newEvents);
          }
        } catch (e) {
          console.error(`Failed to fetch events for user ${user.id} and calendar ${calendarId}:`, e.message);
        }
      }

      if (eventsToImport.length > 0) {
        const newProjectsPayload = eventsToImport.map(event => ({
          name: event.summary || 'Untitled Event',
          description: event.description,
          start_date: event.start?.dateTime || event.start?.date,
          due_date: event.end?.dateTime || event.end?.date,
          origin_event_id: event.id,
          venue: event.location,
          created_by: user.id, // The user who owns the calendar connection
          status: 'On Track',
          payment_status: 'Unpaid',
          category: 'Event',
        }));

        const { error: insertError } = await supabaseAdmin
          .from('projects')
          .insert(newProjectsPayload);

        if (insertError) {
          console.error(`Failed to import projects for user ${user.id}:`, insertError.message);
        } else {
          totalImported += newProjectsPayload.length;
        }
      }
    }

    return new Response(JSON.stringify({ message: `Daily import complete. Imported ${totalImported} new events as projects.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Daily GCal Import Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});