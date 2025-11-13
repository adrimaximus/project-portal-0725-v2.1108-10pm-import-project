import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  let origin = Deno.env.get('VITE_APP_URL');
  if (state) {
    try {
      const parsedState = JSON.parse(state);
      if (parsedState.origin) {
        origin = parsedState.origin;
      }
    } catch (e) { /* ignore parsing error */ }
  }
  const redirectPath = '/settings/integrations/google-calendar';

  try {
    if (!code || !state) throw new Error("Missing code or state from Google callback.");
    
    const { userId } = JSON.parse(state);
    if (!userId) throw new Error("User ID not found in state parameter.");

    const clientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google credentials in Supabase secrets.");
    }

    // Exchange authorization code for tokens using a direct fetch call
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || tokens.error) {
      throw new Error(tokens.error_description || 'Failed to exchange authorization code for tokens.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Preserve existing refresh token if a new one isn't provided
    const { data: existingToken } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .maybeSingle();

    const expiry_date = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null;

    const { error } = await supabaseAdmin.from('google_calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existingToken?.refresh_token || null,
      expiry_date: expiry_date,
      scope: tokens.scope,
    }, { onConflict: 'user_id' });

    if (error) throw error;

    return Response.redirect(`${origin}${redirectPath}?success=true`, 302);

  } catch (err) {
    console.error("Google Calendar callback error:", err.message);
    const errorRedirectUrl = `${origin}${redirectPath}?error=${encodeURIComponent(err.message)}`;
    return Response.redirect(errorRedirectUrl, 302);
  }
});