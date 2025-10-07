// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    // Authenticate user making the request
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing fields: to, subject, and html are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Use admin client to get credentials
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credentials, error: credsError } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['EMAILIT_API_KEY', 'EMAILIT_SENDER', 'EMAILIT_FROM_NAME']);

    if (credsError) throw credsError;

    const config = credentials.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});

    const apiKey = config.EMAILIT_API_KEY;
    const senderEmail = config.EMAILIT_SENDER;
    const fromName = config.EMAILIT_FROM_NAME;

    if (!apiKey || !senderEmail || !fromName) {
        throw new Error("Email service is not configured in settings.");
    }

    const res = await fetch("https://api.emailit.io/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: senderEmail,
          name: fromName,
        },
        to: [{ email: to }],
        subject,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));

    return new Response(JSON.stringify({ ok: res.ok, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});