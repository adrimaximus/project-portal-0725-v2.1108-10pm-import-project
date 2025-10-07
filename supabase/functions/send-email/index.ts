// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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
    console.log("API_KEY:", Deno.env.get("EMAILIT_API_KEY"));
    console.log("SENDER:", Deno.env.get("EMAILIT_SENDER"));
    console.log("FROM_NAME:", Deno.env.get("EMAILIT_FROM_NAME"));

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing fields: to, subject, and html are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const apiKey = Deno.env.get("EMAILIT_API_KEY");
    const senderEmail = Deno.env.get("EMAILIT_SENDER");
    const fromName = Deno.env.get("EMAILIT_FROM_NAME");

    if (!apiKey || !senderEmail || !fromName) {
        throw new Error("Email service is not configured on the server.");
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