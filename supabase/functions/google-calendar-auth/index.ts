// @ts-nocheck
/// <reference types="https://unpkg.com/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { google } from "https://esm.sh/googleapis";

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
    const state = url.searchParams.get("state");

    const clientId = Deno.env.get("VITE_GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = `https://quuecudndfztjlxbrvyb.supabase.co/functions/v1/google-calendar-auth`;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google credentials in Supabase secrets.");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    if (code) { // Handle callback from Google
      if (!state) throw new Error("Missing user information in state parameter.");
      
      let userId, origin;
      try {
        const parsedState = JSON.parse(state);
        userId = parsedState.userId;
        origin = parsedState.origin;
      } catch (e) {
        // Fallback for old state format
        userId = state;
        origin = Deno.env.get('VITE_APP_URL');
      }

      if (!userId) throw new Error("User ID not found in state parameter.");
      if (!origin) throw new Error("Origin not found in state parameter or VITE_APP_URL secret.");

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

      if (error) {
        console.error('Error saving tokens:', error);
        throw error;
      }

      const appRedirectUrl = `${origin}/settings/integrations/google-calendar?success=true`;
      return Response.redirect(appRedirectUrl, 302);
    }

    // Handle initial request from the frontend
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Invalid JWT.");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: 'consent',
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      state: JSON.stringify({ userId: user.id, origin: req.headers.get('origin') || Deno.env.get('VITE_APP_URL') }),
    });

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err.message);
    
    let origin = Deno.env.get('VITE_APP_URL');
    try {
      const url = new URL(req.url);
      const state = url.searchParams.get("state");
      if (state) {
        const parsedState = JSON.parse(state);
        if (parsedState.origin) {
          origin = parsedState.origin;
        }
      }
    } catch (e) {
      // Ignore parsing errors, use default origin
    }

    const appRedirectUrl = `${origin}/settings/integrations/google-calendar?error=${encodeURIComponent(err.message)}`;
    
    if (new URL(req.url).searchParams.has('code')) {
        return Response.redirect(appRedirectUrl, 302);
    }

    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});