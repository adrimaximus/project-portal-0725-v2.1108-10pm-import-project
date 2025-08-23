// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/pexels@1.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const pexelsApiKey = Deno.env.get('VITE_PEXELS_API_KEY')
    if (!pexelsApiKey) {
      throw new Error('Pexels API key is not configured.')
    }

    const pexelsClient = createClient(pexelsApiKey)
    const { endpoint, query, per_page = 1 } = await req.json()

    let response;
    switch (endpoint) {
      case 'curated':
        response = await pexelsClient.photos.curated({ per_page });
        break;
      case 'search':
        if (!query) throw new Error('Query is required for search endpoint.');
        response = await pexelsClient.photos.search({ query, per_page });
        break;
      default:
        throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    if ('error' in response) {
      throw new Error(response.error);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})