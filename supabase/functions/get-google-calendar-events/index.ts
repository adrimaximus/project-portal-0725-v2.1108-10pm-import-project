// @ts-nocheck
/// <reference types="https://unpkg.com/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { google } from "https://esm.sh/googleapis@140.0.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get user's tokens
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single();
    if (tokenError || !tokenData) {
      throw new Error("Google Calendar not connected or token not found.");
    }

    // 2. Get user's selected calendars
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_calendar_settings')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const selectedCalendarIds = profile?.google_calendar_settings?.selected_calendars;
    if (!selectedCalendarIds || selectedCalendarIds.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Get already imported event IDs
    const { data: existingProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('origin_event_id')
      .not('origin_event_id', 'is', null);
    if (projectsError) throw projectsError;
    const existingEventIds = new Set(existingProjects.map(p => p.origin_event_id));

    // 4. Setup Google API client
    const oauth2Client = new google.auth.OAuth2(
        Deno.env.get("VITE_GOOGLE_CLIENT_ID"), 
        Deno.env.get("GOOGLE_CLIENT_SECRET")
    );
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date ? new Date(tokenData.expiry_date).getTime() : null,
    });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 5. Fetch calendar list to map IDs to names
    const calendarListRes = await calendar.calendarList.list();
    const calendarList = calendarListRes.data.items || [];
    const calendarMap = new Map(calendarList.map(cal => [cal.id, cal.summary]));

    // 6. Fetch events from each selected calendar
    const allEvents = [];
    for (const calendarId of selectedCalendarIds) {
      const res = await calendar.events.list({
        calendarId,
        timeMin: (new Date()).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });
      if (res.data.items) {
        const events = res.data.items
          .filter(event => event.status !== 'cancelled' && !existingEventIds.has(event.id))
          .map(event => ({ 
            ...event, 
            calendar: {
              id: calendarId,
              summary: calendarMap.get(calendarId) || calendarId
            }
          }));
        allEvents.push(...events);
      }
    }

    return new Response(JSON.stringify(allEvents), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});