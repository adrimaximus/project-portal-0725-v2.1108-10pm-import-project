// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const sanitizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return `https://${url.replace(/^ttps?:\/\//, '')}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      email,
      password,
      mode = "create",
      email_confirm = true,
      user_metadata = {},
      app_metadata = {},
      redirectTo: providedRedirectTo,
    } = await req.json();

    if (!email) {
      throw new Error("email is required");
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!, 
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, 
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (mode === "invite") {
      const appUrl = Deno.env.get('VITE_APP_URL') || Deno.env.get('SUPABASE_URL');
      const redirectTo = providedRedirectTo || `${sanitizeUrl(appUrl)}/reset-password`;
      
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo,
        data: app_metadata,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, mode, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const pwd = password ?? crypto.randomUUID() + "Aa1!";
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pwd,
      email_confirm,
      user_metadata,
      app_metadata,
    });
    if (error) {
        if (error.message.includes('User already registered')) {
            return new Response(JSON.stringify({ ok: false, error: `A user with the email ${email} already exists.` }), {
              status: 409,
              headers: corsHeaders,
            });
        }
        throw error;
    }

    return new Response(JSON.stringify({ ok: true, mode, user: data.user, default_password: password ? undefined : pwd }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e.message || e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});