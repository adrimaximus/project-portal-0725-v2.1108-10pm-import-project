// @ts-nocheck
/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectName, venue, services, description, existingTasks } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets.");
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const serviceList = Array.isArray(services) && services.length > 0 ? services.join(', ') : 'Tidak ditentukan';
    const existingTasksList = Array.isArray(existingTasks) && existingTasks.length > 0 ? `Tugas-tugas berikut sudah ada, jadi jangan buat lagi: ${existingTasks.join(', ')}.` : '';

    const prompt = `Anda adalah asisten manajemen proyek yang ahli dalam strategi aktivasi merek dan pelaksanaan acara. Berdasarkan detail proyek berikut, buatlah sebuah JSON array berisi 5 judul tugas yang ringkas, dapat ditindaklanjuti, relevan, dan belum dibuat. Gunakan Bahasa Indonesia.

      **Detail Proyek:**
      - **Judul:** ${projectName}
      - **Lokasi:** ${venue || 'lokasi tidak ditentukan'}
      - **Layanan:** ${serviceList}
      - **Gambaran Umum:** ${description || 'Tidak ada gambaran umum.'}

      ${existingTasksList}

      Hanya kembalikan JSON array yang valid berisi 5 string unik, di mana setiap string adalah judul tugas baru dalam Bahasa Indonesia. Contoh: ["Siapkan materi promosi", "Koordinasi dengan vendor sound system", "Buat jadwal acara", "Rancang tata letak booth", "Lakukan gladi bersih"]. Jangan sertakan teks lain, markdown, atau penjelasan.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = msg.content[0].text;
    
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("Raw AI response:", responseText);
      throw new Error("Respons AI tidak berisi JSON array yang valid.");
    }

    const tasks = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("AI menghasilkan daftar tugas yang kosong atau tidak valid.");
    }

    return new Response(
      JSON.stringify(tasks),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})