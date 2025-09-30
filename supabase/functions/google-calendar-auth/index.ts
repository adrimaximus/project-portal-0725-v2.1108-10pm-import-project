import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from "npm:googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    // Gunakan VITE_GOOGLE_CLIENT_ID agar konsisten dengan frontend jika diperlukan
    const clientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // Redirect URI harus menunjuk ke fungsi ini sendiri
    const redirectUri = `https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/google-calendar-auth`;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google credentials in Supabase secrets.");
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Jika ada 'code', berarti ini adalah callback dari Google
    if (code) {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Di sini Anda harus menyimpan token ke database
      // Contoh: (Anda perlu user ID, yang bisa didapat dari 'state' parameter)
      // const { data: { user } } = await supabase.auth.getUser(tokens.access_token);
      // await supabaseAdmin.from('google_calendar_tokens').upsert({ ... });
      
      console.log("Tokens received:", tokens);

      // Redirect kembali ke aplikasi Anda dengan status sukses
      const appRedirectUrl = `${Deno.env.get('VITE_APP_URL')}/settings/integrations/google-calendar?success=true`;
      return Response.redirect(appRedirectUrl, 302);
    }

    // Jika tidak ada 'code', berarti ini permintaan awal dari aplikasi Anda
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: 'consent', // Penting untuk mendapatkan refresh_token
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly"
      ],
    });

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err);
    const appRedirectUrl = `${Deno.env.get('VITE_APP_URL')}/settings/integrations/google-calendar?error=${encodeURIComponent(err.message)}`;
    
    // Jika error terjadi saat callback, redirect dengan pesan error
    if (new URL(req.url).searchParams.has('code')) {
        return Response.redirect(appRedirectUrl, 302);
    }

    // Jika error terjadi saat permintaan awal, kirim respons JSON
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});