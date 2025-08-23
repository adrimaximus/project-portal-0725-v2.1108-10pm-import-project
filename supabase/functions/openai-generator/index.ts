// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { featureHandlers } from './features/index.ts';
import { createSupabaseAdmin, createSupabaseUserClient, getOpenAIClient } from './lib/clients.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    const handler = featureHandlers[feature];

    if (!handler) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    
    const context = {
        req,
        openai,
        supabaseAdmin,
        feature,
    };

    const responseData = await handler(payload, context);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});