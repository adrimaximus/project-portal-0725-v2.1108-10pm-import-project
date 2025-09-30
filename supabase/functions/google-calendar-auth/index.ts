// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@118';
import * as djwt from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fungsi ini sekarang akan dipanggil di dalam handler
async function getDjwtKey() {
  const JWT_SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!JWT_SECRET) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
  }
  return await djwt.createSecretKey(new TextEncoder().encode(JWT_SECRET));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:32100';
  const finalRedirectUrl = `${appUrl}/settings/integrations/google-calendar`;

  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      url.origin + url.pathname // Redirect URI adalah fungsi itu sendiri
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Bagian 2: Menangani callback dari Google
    if (code && state) {
      let userId: string;
      try {
        const key = await getDjwtKey(); // Panggil fungsi async di sini
        const payload = await djwt.verify(state, key);
        userId = payload.sub as string;
        if (!userId) throw new Error("Invalid state token: missing user ID");
      } catch (err) {
        console.error("State verification failed:", err);
        return Response.redirect(`${finalRedirectUrl}?error=state_mismatch`, 302);
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const { error: upsertError } = await supabaseAdmin
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          scope: tokens.scope,
        });

      if (upsertError) throw upsertError;

      return Response.redirect(`${finalRedirectUrl}?success=true`, 302);
    }

    // Bagian 1: Menghasilkan URL otorisasi untuk frontend
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const key = await getDjwtKey(); // Panggil fungsi async di sini
    const stateToken = await djwt.create({ alg: 'HS256', typ: 'JWT' }, { sub: user.id, exp: djwt.getNumericDate(60 * 5) }, key);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      state: stateToken,
    });

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Google Calendar auth function:', error);
    return Response.redirect(`${finalRedirectUrl}?error=${encodeURIComponent(error.message)}`, 302);
  }
});