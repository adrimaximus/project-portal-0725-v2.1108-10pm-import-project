// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { google } from 'npm:googleapis@140';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: tokens, error: tokenError } = await supabaseClient
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokens) {
      return new Response(JSON.stringify({ error: 'Google Calendar not connected.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : null,
    });

    if (!tokens.expiry_date || new Date() > new Date(tokens.expiry_date)) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await supabaseClient.from('google_calendar_tokens').update({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            expiry_date: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        }).eq('user_id', user.id);
        oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(today.getFullYear(), today.getMonth() + 5, 0, 23, 59, 59).toISOString();
    
    const { data: { items: events } } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (!events) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const eventIds = events.map(e => e.id);
    const { data: existingProjects, error: projectError } = await supabaseClient
      .from('projects')
      .select('origin_event_id')
      .in('origin_event_id', eventIds);

    if (projectError) throw projectError;

    const existingEventIds = new Set(existingProjects.map(p => p.origin_event_id));
    const newEvents = events.filter(event => !existingEventIds.has(event.id));

    return new Response(JSON.stringify(newEvents), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});