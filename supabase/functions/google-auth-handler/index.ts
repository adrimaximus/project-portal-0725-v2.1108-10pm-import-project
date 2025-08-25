// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'
import { OAuth2Client } from 'https://esm.sh/google-auth-library@9.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

const checkMasterAdmin = async (supabase, userId) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !profile || profile.role !== 'master admin') {
    throw new Error("Permission denied. Only master admins can manage this integration.");
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Required environment variables are not set on the server.");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body = {};
    let action = null;
    if (req.method === 'POST') {
      const bodyText = await req.text();
      if (bodyText) {
        try {
          body = JSON.parse(bodyText);
          action = body.method;
        } catch (e) {
          throw new Error(`Invalid JSON body: ${e.message}`);
        }
      }
    }

    if (!action) {
      throw new Error("A 'method' property is required in the request body for POST requests.");
    }
    
    const { ...payload } = body;
    delete payload.method;

    let result;

    switch (action) {
      case 'health-check':
        result = { status: 'ok' };
        break;
      
      case 'exchange-code': {
        await checkMasterAdmin(supabase, user.id);
        const { tokens } = await oAuth2Client.getToken({
          code: payload.code,
          redirect_uri: 'postmessage'
        });
        const { refresh_token } = tokens;
        if (!refresh_token) throw new Error("Failed to get refresh token from Google.");

        const { error } = await supabaseAdmin.from('app_config').upsert({ key: 'GOOGLE_REFRESH_TOKEN', value: refresh_token });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get-status': {
        const { data, error } = await supabaseAdmin.from('app_config').select('value').eq('key', 'GOOGLE_REFRESH_TOKEN').maybeSingle();
        if (error) throw error;
        result = { connected: !!data?.value };
        break;
      }

      case 'disconnect': {
        await checkMasterAdmin(supabase, user.id);
        await supabaseAdmin.from('app_config').delete().eq('key', 'GOOGLE_CALENDAR_SELECTIONS');
        await supabaseAdmin.from('app_config').delete().eq('key', 'GOOGLE_REFRESH_TOKEN');
        result = { success: true };
        break;
      }

      case 'list-calendars':
      case 'list-events': {
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('app_config')
          .select('value')
          .eq('key', 'GOOGLE_REFRESH_TOKEN')
          .single();
        if (tokenError || !tokenData?.value) {
          throw new Error("Google Calendar is not connected for this workspace.");
        }

        oAuth2Client.setCredentials({ refresh_token: tokenData.value });
        const { token: accessToken } = await oAuth2Client.getAccessToken();
        if (!accessToken) throw new Error("Failed to refresh access token.");

        if (action === 'list-calendars') {
          const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Google API Error: ${errorBody.error.message}`);
          }
          const calendarData = await response.json();
          result = calendarData.items || [];
        } else { // list-events
          const calendarIds = payload.calendarIds || [];
          const { timeMin, timeMax } = payload;
          if (calendarIds.length === 0 || !timeMin || !timeMax) {
            result = [];
            break;
          }

          const allEvents = [];
          for (const calendarId of calendarIds) {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) {
              console.warn(`Could not fetch events for calendar ${calendarId}. Status: ${response.status}`);
              continue;
            }
            const data = await response.json();
            if (data.items) allEvents.push(...data.items);
          }

          allEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date);
            const dateB = new Date(b.start.dateTime || b.start.date);
            return dateA.getTime() - dateB.getTime();
          });
          result = allEvents;
        }
        break;
      }

      default:
        throw new Error(`Invalid method specified: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});