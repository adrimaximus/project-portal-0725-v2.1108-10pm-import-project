import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // 1. Get user's token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      throw new Error("Google Calendar not connected or token not found.");
    }

    let { access_token, refresh_token, expiry_date } = tokenData;

    // 2. Refresh token if expired
    if (new Date(expiry_date) < new Date()) {
      console.log('Access token expired, refreshing...');
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
        console.error('Error refreshing token:', newTokens.error_description);
        await supabaseAdmin.from('google_calendar_tokens').delete().eq('user_id', user.id);
        throw new Error('Failed to refresh token. Please reconnect your Google Calendar.');
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

    // 3. Get user's selected calendars from their profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_calendar_settings')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const selectedCalendarIds = profile?.google_calendar_settings?.selected_calendars;
    if (!selectedCalendarIds || selectedCalendarIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch events from each selected calendar
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days

    const eventPromises = selectedCalendarIds.map(async (calendarId: string) => {
      try {
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error(`Failed to fetch events for calendar ${calendarId}:`, errorData);
          return []; // Return empty array for this calendar on failure
        }
        const data = await res.json();
        // Add calendar info to each event
        return (data.items || []).map((event: any) => ({ ...event, calendar: { id: calendarId, summary: event.organizer?.displayName || calendarId } }));
      } catch (e) {
        console.error(`Error fetching events for calendar ${calendarId}:`, e.message);
        return [];
      }
    });

    const eventsByCalendar = await Promise.all(eventPromises);
    const allEvents = eventsByCalendar.flat();

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