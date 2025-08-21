// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, createSupabaseAdmin, createOpenAIClient } from './shared/index.ts';
import { handleAnalyzeProjects } from './handlers/analyzeProjectsHandler.ts';
import { handleGenerateInsight } from './handlers/generateInsightHandler.ts';
import { handleGenerateMoodInsight } from './handlers/generateMoodInsightHandler.ts';

const handlers = {
  'analyze-projects': handleAnalyzeProjects,
  'generate-insight': handleGenerateInsight,
  'generate-mood-insight': handleGenerateMoodInsight,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    
    if (!handlers[feature]) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await createOpenAIClient(supabaseAdmin);

    const responseData = await handlers[feature](req, supabaseAdmin, openai, payload);

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