import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tokenData, error: tokenError } = await serviceClient
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      console.error('No Google Calendar tokens found for user:', user.id, tokenError);
      return new Response(JSON.stringify({ error: 'Google Calendar not connected. Please connect it in your settings.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    let { access_token, refresh_token, expiry_date } = tokenData;

    if (new Date(expiry_date) < new Date()) {
      console.log('Access token expired, refreshing...');
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const newTokens = await response.json()
      if (newTokens.error) {
        console.error('Error refreshing token:', newTokens.error_description);
        await serviceClient.from('google_calendar_tokens').delete().eq('user_id', user.id);
        return new Response(JSON.stringify({ error: 'Failed to refresh token. Please reconnect your Google Calendar.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      access_token = newTokens.access_token;
      const newExpiryDate = new Date(new Date().getTime() + newTokens.expires_in * 1000);

      await serviceClient
        .from('google_calendar_tokens')
        .update({
          access_token: access_token,
          expiry_date: newExpiryDate.toISOString(),
        })
        .eq('user_id', user.id)
    }

    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!calendarsResponse.ok) {
        throw new Error(`Failed to fetch calendar list: ${await calendarsResponse.text()}`);
    }
    const calendarsData = await calendarsResponse.json();
    const calendarIds = calendarsData.items.map((cal: any) => cal.id);

    const timeMin = new Date().toISOString();
    const timeMax = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const eventPromises = calendarIds.map((calendarId: string) =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(res => res.json())
    );

    const eventResults = await Promise.all(eventPromises);

    const { data: existingProjects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('origin_event_id')
      .not('origin_event_id', 'is', null);

    if (projectsError) {
      console.error("Error fetching existing projects:", projectsError);
    }
    const existingEventIds = new Set(existingProjects?.map(p => p.origin_event_id) || []);

    let allEvents = [];
    for (let i = 0; i < eventResults.length; i++) {
        const calendar = calendarsData.items[i];
        if (eventResults[i].items) {
            const eventsWithCalendarInfo = eventResults[i].items
              .filter((event: any) => !existingEventIds.has(event.id))
              .map((event: any) => ({
                ...event,
                calendar: {
                    id: calendar.id,
                    summary: calendar.summary,
                    backgroundColor: calendar.backgroundColor,
                },
            }));
            allEvents.push(...eventsWithCalendarInfo);
        }
    }

    allEvents.sort((a, b) => {
      const aTime = new Date(a.start.dateTime || a.start.date).getTime();
      const bTime = new Date(b.start.dateTime || b.start.date).getTime();
      return aTime - bTime;
    });

    return new Response(JSON.stringify(allEvents), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})