// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from './_lib/supabase.ts';
import { getOpenAIClient } from './_lib/openai.ts';

// Import feature handlers
import analyzeDuplicates from './_features/analyze-duplicates.ts';
import articleWriter from './_features/article-writer.ts';
import generateCaption from './_features/generate-caption.ts';
import generateMoodInsight from './_features/generate-mood-insight.ts';
import suggestIcon from './_features/suggest-icon.ts';
import analyzeProjects from './_features/analyze-projects.ts';
import generateInsight from './_features/generate-insight.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const featureHandlers = {
  'analyze-duplicates': analyzeDuplicates,
  'generate-article-from-title': articleWriter,
  'expand-article-text': articleWriter,
  'improve-article-content': articleWriter,
  'summarize-article-content': articleWriter,
  'generate-caption': generateCaption,
  'generate-mood-insight': generateMoodInsight,
  'suggest-icon': suggestIcon,
  'analyze-projects': analyzeProjects,
  'generate-insight': generateInsight,
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
        feature, // Pass feature name to context for handlers that need it
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