// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      email,
      password,
      mode = "create",
      email_confirm = true,
      user_metadata = {},
      app_metadata = {}, // Ditambahkan untuk menangani peran
      redirectTo,
    } = body ?? {};

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "email is required" }),
        { status: 400, headers: corsHeaders });
    }

    if (mode === "invite") {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: app_metadata, // Invite menggunakan 'data' untuk app_metadata
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, mode, data }), { headers: corsHeaders });
    }

    // mode === "create"
    const pwd = password ?? crypto.randomUUID() + "Aa1!";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: pwd,
      email_confirm,
      user_metadata,
      app_metadata, // Ditambahkan untuk peran
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, mode, user: data.user, default_password: password ? undefined : pwd }),
      { headers: corsHeaders });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});