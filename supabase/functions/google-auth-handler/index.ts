// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OAuth2Client } from 'https://esm.sh/google-auth-library@9.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (!googleClientId || !googleClientSecret) {
      throw new Error("Kredensial Google tidak dikonfigurasi di server. Seorang administrator perlu mengatur secret GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET untuk Edge Function.");
    }

    const { method, ...payload } = await req.json();

    if (method === 'health-check') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const oAuth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret
    );

    switch (method) {
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
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'get-status': {
        const { data, error } = await supabaseAdmin.from('user_google_tokens').select('user_id').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        return new Response(JSON.stringify({ connected: !!data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'disconnect': {
        await supabaseAdmin.from('user_calendar_selections').delete().eq('user_id', user.id);
        await supabaseAdmin.from('user_google_tokens').delete().eq('user_id', user.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'get-selections': {
        const { data, error } = await supabase.from('user_calendar_selections').select('calendar_id');
        if (error) throw error;
        return new Response(JSON.stringify({ selections: data.map(s => s.calendar_id) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      case 'list-calendars': {
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

        const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(`Google API Error: ${errorBody.error.message}`);
        }
        
        const calendarData = await response.json();
        return new Response(JSON.stringify(calendarData.items || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      default:
        throw new Error("Invalid method");
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});