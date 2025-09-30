import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@118';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Supabase user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // 2. Get user's tokens from DB using admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single();
    
    if (tokenError) throw new Error("Google Calendar not connected or tokens not found.");

    // 3. Set up OAuth client and credentials
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('VITE_GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET')
    );
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : null,
    });

    // 4. Handle token refresh if needed
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : 0;
    if (Date.now() >= expiryDate - 60000) { // Refresh if expiring in the next minute
      const { credentials } = await oauth2Client.refreshAccessToken();
      await supabaseAdmin
        .from('google_calendar_tokens')
        .update({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokens.refresh_token, // Keep old refresh token if new one isn't provided
          expiry_date: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        })
        .eq('user_id', user.id);
      oauth2Client.setCredentials(credentials);
    }

    // 5. Call Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const res = await calendar.calendarList.list();

    return new Response(JSON.stringify(res.data.items || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-google-calendars function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});