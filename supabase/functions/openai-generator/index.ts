// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseUserClient } from './lib/clients.ts';
import { handleAnalyzeProjects } from './features/analyze-projects.ts';
import { handleGenerateInsight } from './features/generate-insight.ts';

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

    const userSupabase = createSupabaseUserClient(req);
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated.");

    let result;
    switch (feature) {
      case 'analyze-projects':
        result = await handleAnalyzeProjects(payload, { userSupabase, user });
        break;
      case 'generate-insight':
        result = await handleGenerateInsight(payload);
        break;
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }

    return new Response(JSON.stringify({ result }), {
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