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

  try {
    // 1. Autentikasi pengguna untuk memastikan hanya pengguna yang login yang dapat mengirim email
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");

    // 2. Ambil data dari body request
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      throw new Error("Kolom yang diperlukan tidak ada: to, subject, dan html wajib diisi.");
    }

    // 3. Ambil kredensial dari environment variables
    const apiKey = Deno.env.get("EMAILIT_API_KEY");
    const senderEmail = Deno.env.get("EMAILIT_SENDER");
    const fromName = Deno.env.get("EMAILIT_FROM_NAME");

    if (!apiKey || !senderEmail || !fromName) {
        throw new Error("Layanan email tidak dikonfigurasi di server.");
    }

    // 4. Panggil API EmailIt
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
    
    // 5. Kembalikan respons
    return new Response(JSON.stringify({ ok: res.ok, data }), { 
      status: res.status, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});