/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, startDate, dueDate, venue, services } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Project title is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Belum ditentukan';
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Belum ditentukan';

    const prompt = `
      Anda adalah seorang manajer proyek ahli. Tugas Anda adalah membuat brief proyek yang profesional dan komprehensif dalam format HTML berdasarkan detail berikut. Brief harus terstruktur dengan baik, jelas, dan siap digunakan dalam alat manajemen proyek.

      **Detail Proyek:**
      - **Judul:** ${title}
      - **Tanggal Mulai:** ${formattedStartDate}
      - **Tanggal Selesai:** ${formattedDueDate}
      - **Lokasi:** ${venue || 'Belum ditentukan'}
      - **Layanan yang Dibutuhkan:** ${services && services.length > 0 ? services.join(', ') : 'Belum ditentukan'}

      **Instruksi:**
      1.  Mulai dengan bagian **Ringkasan Proyek** (menggunakan tag <h2>). Jelaskan secara singkat tujuan dan sasaran proyek.
      2.  Buat bagian **Lingkup Pekerjaan** (menggunakan tag <h2>). Rincikan layanan yang akan diberikan menggunakan daftar berpoin (tag <ul> dan <li>).
      3.  Sertakan bagian **Detail Utama** (menggunakan tag <h2>). Cantumkan linimasa dan lokasi menggunakan daftar berpoin.
      4.  Akhiri dengan bagian **Langkah Selanjutnya** (menggunakan tag <h2>) yang menyarankan tindakan awal seperti rapat kickoff atau penyelarasan tim.
      5.  Seluruh output harus dalam format HTML yang valid. Jangan sertakan \`\`\`html atau format markdown apa pun. Kembalikan hanya konten HTML mentah.
    `;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const brief = msg.content[0].text;

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating brief:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});