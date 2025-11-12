import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { google } from "https://esm.sh/googleapis";

serve(async (req) => {
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

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseAdmin.from('google_calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope,
    });

    if (error) throw error;

    return Response.redirect(`${origin}${redirectPath}?success=true`, 302);

  } catch (err) {
    console.error("Google Calendar callback error:", err.message);
    const errorRedirectUrl = `${origin}${redirectPath}?error=${encodeURIComponent(err.message)}`;
    return Response.redirect(errorRedirectUrl, 302);
  }
});