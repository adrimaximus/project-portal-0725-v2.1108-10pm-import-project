// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OAuth2Client } from 'https://esm.sh/google-auth-library@9.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: usersWithTokens, error: usersError } = await supabaseAdmin
      .from('user_google_tokens')
      .select('user_id, refresh_token');

    if (usersError) throw usersError;

    const oAuth2Client = new OAuth2Client(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET')
    );

    for (const user of usersWithTokens) {
      if (!user.refresh_token) continue;

      oAuth2Client.setCredentials({ refresh_token: user.refresh_token });
      const { token: accessToken } = await oAuth2Client.getAccessToken();
      if (!accessToken) continue;

      const { data: selections, error: selectionsError } = await supabaseAdmin
        .from('user_calendar_selections')
        .select('calendar_id')
        .eq('user_id', user.user_id);
      
      if (selectionsError || !selections) continue;

      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Next 24 hours

      for (const selection of selections) {
        const calendarId = selection.calendar_id;
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (res.ok) {
          const { items: events } = await res.json();
          for (const event of events) {
            if (event.status === 'cancelled') continue;
            
            const { error: rpcError } = await supabaseAdmin.rpc('upsert_project_from_gcal_event', {
              event_id: event.id,
              summary: event.summary,
              description: event.description,
              start_time: event.start.dateTime || event.start.date,
              end_time: event.end.dateTime || event.end.date,
              event_location: event.location,
              creator_email: event.creator.email,
            });
            if (rpcError) console.error(`Failed to import event ${event.id} for user ${user.user_id}:`, rpcError.message);
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: "Daily import completed." }), {
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