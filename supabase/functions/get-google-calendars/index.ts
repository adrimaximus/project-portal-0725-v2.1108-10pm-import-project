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

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Google Calendar not connected or token not found.");
    }

    let { access_token, refresh_token, expiry_date } = tokenData;

    // Check if token is expired and refresh if necessary
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

    // Fetch calendar list using the (potentially refreshed) access token
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!calendarsResponse.ok) {
      const errorData = await calendarsResponse.json();
      throw new Error(`Failed to fetch calendar list: ${errorData.error.message}`);
    }
    
    const calendarsData = await calendarsResponse.json();

    return new Response(JSON.stringify(calendarsData.items), {
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