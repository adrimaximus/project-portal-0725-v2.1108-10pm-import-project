// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { global: { headers: { 'Accept': 'application/json' } } }
);

Deno.serve(async (req) => {
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
      .select('*, user:profiles!user_id(id, email, google_calendar_settings)');

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

      let { access_token, refresh_token, expiry_date } = token;

      if (new Date(expiry_date) < new Date()) {
        console.log(`Access token for ${user.email} expired, refreshing...`);
        const clientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await response.json();
        if (newTokens.error) {
          console.error(`Error refreshing token for ${user.email}:`, newTokens.error_description);
          await supabaseAdmin.from('google_calendar_tokens').delete().eq('user_id', user.id);
          continue; // Skip this user
        }

        access_token = newTokens.access_token;
        const newExpiryDate = new Date(new Date().getTime() + newTokens.expires_in * 1000);

        await supabaseAdmin
          .from('google_calendar_tokens')
          .update({
            access_token: access_token,
            expiry_date: newExpiryDate.toISOString(),
          })
          .eq('user_id', user.id);
      }

      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const eventsToImport = [];

      for (const calendarId of user.google_calendar_settings.selected_calendars) {
        try {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`, {
            headers: { Authorization: `Bearer ${access_token}` },
          }).then(res => res.json());

          if (res.items) {
            const newEvents = res.items.filter((event: any) =>
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
          created_by: user.id,
          status: 'On Track',
          payment_status: 'Unpaid',
          category: 'Event',
        }));

        const { data: createdProjects, error: projectInsertError } = await supabaseAdmin
          .from('projects')
          .insert(newProjectsPayload)
          .select('id, created_by, origin_event_id');
        
        if (projectInsertError) {
          console.error(`Failed to import projects for user ${user.id}:`, projectInsertError.message);
          continue;
        }

        const allAttendeeEmails = [...new Set(eventsToImport.flatMap(event => event.attendees?.map((att: any) => att.email) || []).filter(Boolean))];
        const emailToIdMap = new Map<string, string>();

        if (allAttendeeEmails.length > 0) {
          const { data: attendeeProfiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .in('email', allAttendeeEmails);
          if (profileError) {
            console.warn(`Could not fetch attendee profiles:`, profileError.message);
          } else if (attendeeProfiles) {
            attendeeProfiles.forEach(p => {
              if (p.email) emailToIdMap.set(p.email, p.id);
            });
          }
        }

        const projectMemberships: { project_id: string; user_id: string; role: string }[] = [];
        if (createdProjects) {
          createdProjects.forEach(project => {
            if (project.created_by !== user.id) {
              projectMemberships.push({
                project_id: project.id,
                user_id: user.id,
                role: 'admin'
              });
            }

            const originalEvent = eventsToImport.find(e => e.id === project.origin_event_id);
            if (originalEvent && originalEvent.attendees) {
              originalEvent.attendees.forEach((attendee: any) => {
                if (attendee.email && emailToIdMap.has(attendee.email)) {
                  const attendeeUserId = emailToIdMap.get(attendee.email)!;
                  if (attendeeUserId !== project.created_by && attendeeUserId !== user.id) {
                    if (!projectMemberships.some(m => m.project_id === project.id && m.user_id === attendeeUserId)) {
                      projectMemberships.push({
                        project_id: project.id,
                        user_id: attendeeUserId,
                        role: 'member'
                      });
                    }
                  }
                }
              });
            }
          });
        }

        if (projectMemberships.length > 0) {
          const { error: memberInsertError } = await supabaseAdmin
            .from('project_members')
            .insert(projectMemberships);
          if (memberInsertError) {
            console.warn("Failed to add some members to projects:", memberInsertError.message);
          }
        }

        totalImported += newProjectsPayload.length;
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