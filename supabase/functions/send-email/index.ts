// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Memeriksa apakah pengguna terautentikasi
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Mendapatkan body permintaan
    const { to, subject, html, text } = await req.json();
    if (!to || !subject || (!html && !text)) {
        throw new Error("Missing required fields: to, subject, and html or text.");
    }

    // Mendapatkan variabel lingkungan
    const emailFrom = Deno.env.get('EMAIL_FROM') || "Betterworks <no-reply@mail.betterworks.id>";
    const emailitApiKey = Deno.env.get('EMAILIT_API_KEY');

    if (!emailitApiKey) {
        throw new Error("Emailit API key is not configured on the server.");
    }

    const payload = {
      from: emailFrom,
      to,
      subject,
      html,
      text,
    };

    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // Meneruskan status dan galat dari Emailit
      return new Response(JSON.stringify({ ok: false, error: data?.error || `HTTP ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})