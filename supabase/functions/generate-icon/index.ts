import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Fungsi utama yang akan dijalankan
serve(async (req) => {
  // Menangani permintaan preflight CORS dari browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ekstrak prompt dan API key dari permintaan
    const { prompt } = await req.json()
    const openAiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

    // Validasi input
    if (!openAiKey) {
      throw new Error('Missing OpenAI API key in request headers.')
    }
    if (!prompt) {
      throw new Error('Missing prompt in request body.')
    }

    // Panggil API OpenAI DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt: `a simple, minimalist, vector-style icon for a goal: ${prompt}`,
        n: 1,
        size: '256x256',
      }),
    })

    // Tangani jika panggilan ke OpenAI gagal
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error:', errorBody);
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const { data } = await response.json()
    const imageUrl = data[0].url

    // Kirim URL gambar kembali ke frontend
    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})