// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'
import { OAuth2Client } from 'https://esm.sh/google-auth-library@9.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    // --- Environment Variable Validation ---
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Required environment variables are not set on the server.");
    }

    // --- Client Initialization ---
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

    // --- User Authentication ---
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated.");

    // --- Request Body Parsing ---
    let body = {};
    if (req.body) {
      try {
        const raw = await req.text();
        if (raw) body = JSON.parse(raw);
      } catch (e) {
        throw new Error("Invalid JSON body");
      }
    }
    const { method, ...payload } = body;

    let result;

    // --- Method Routing ---
    switch (method) {
      case 'health-check':
        result = { status: 'ok' };
        break;
      
      case 'exchange-code': {
        const { tokens } = await oAuth2Client.getToken({
          code: payload.code,
          redirect_uri: 'postmessage'
        });
        const { access_token, refresh_token, expiry_date, scope } = tokens;
        if (!access_token) throw new Error("Failed to get access token.");

        const { error } = await supabaseAdmin.from('user_google_tokens').upsert({
          user_id: user.id,
          access_token,
          refresh_token,
          expires_at: new Date(expiry_date).toISOString(),
          scope,
        });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get-status': {
        const { data, error } = await supabaseAdmin.from('user_google_tokens').select('user_id').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        result = { connected: !!data };
        break;
      }

      case 'disconnect': {
        await supabaseAdmin.from('user_calendar_selections').delete().eq('user_id', user.id);
        await supabaseAdmin.from('user_google_tokens').delete().eq('user_id', user.id);
        result = { success: true };
        break;
      }

      case 'get-selections': {
        const { data, error } = await supabase.from('user_calendar_selections').select('calendar_id').eq('user_id', user.id);
        if (error) throw error;
        result = { selections: data.map(s => s.calendar_id) };
        break;
      }

      case 'save-selections': {
        await supabaseAdmin.from('user_calendar_selections').delete().eq('user_id', user.id);
        if (payload.selections && payload.selections.length > 0) {
          const toInsert = payload.selections.map(s => ({
            user_id: user.id,
            calendar_id: s.id,
            calendar_summary: s.summary,
          }));
          const { error } = await supabaseAdmin.from('user_calendar_selections').insert(toInsert);
          if (error) throw error;
        }
        result = { success: true };
        break;
      }

      case 'list-calendars':
      case 'list-events': {
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('user_google_tokens')
          .select('refresh_token')
          .eq('user_id', user.id)
          .single();
        if (tokenError || !tokenData?.refresh_token) {
          throw new Error("No refresh token found for user. Please reconnect.");
        }

        oAuth2Client.setCredentials({ refresh_token: tokenData.refresh_token });
        const { token: accessToken } = await oAuth2Client.getAccessToken();
        if (!accessToken) throw new Error("Failed to refresh access token.");

        if (method === 'list-calendars') {
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
          const { calendarIds, timeMin, timeMax } = payload;
          if (!calendarIds || !Array.isArray(calendarIds) || !timeMin || !timeMax) {
            throw new Error("calendarIds array, timeMin, and timeMax are required.");
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
        throw new Error("Invalid method specified.");
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