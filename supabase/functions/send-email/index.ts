// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json();
    if (!to || !subject || (!html && !text)) {
        throw new Error("Missing required fields: to, subject, and html or text.");
    }

    const emailitApiKey = Deno.env.get("EMAILIT_API_KEY");
    if (!emailitApiKey) {
        throw new Error("Emailit API key is not configured on the server.");
    }

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") ?? "Betterworks <no-reply@mail.betterworks.id>",
        to, subject, html, text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    
    return new Response(JSON.stringify({ ok: response.ok, data }), { 
      status: response.status, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});