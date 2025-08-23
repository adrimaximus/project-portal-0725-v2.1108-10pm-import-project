// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin, getOpenAIClient } from './lib/clients.ts';
import { HandlerContext } from './lib/types.ts';

// Import feature handlers
import analyzeDuplicates from './features/analyzeDuplicates.ts';
import aiMergeContacts from './features/aiMergeContacts.ts';
import articleWriter from './features/articleWriter.ts';
import generateCaption from './features/generateCaption.ts';
import generateMoodInsight from './features/generateMoodInsight.ts';
import suggestIcon from './features/suggestIcon.ts';
import analyzeProjects from './features/analyzeProjects.ts';
import generateInsight from './features/generateInsight.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const featureHandlers: { [key: string]: (payload: any, context: HandlerContext) => Promise<any> } = {
  'analyze-duplicates': analyzeDuplicates,
  'ai-merge-contacts': aiMergeContacts,
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
    if (!feature || !payload) {
      throw new Error("400: 'feature' and 'payload' are required in the request body.");
    }
    
    const handler = featureHandlers[feature];
    if (!handler) {
      throw new Error(`404: Unknown feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    
    const context: HandlerContext = {
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
    console.error("Edge function error:", error.message);
    const message = error.message;
    const statusCodeMatch = message.match(/^(\d{3}):/);
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 500;
    const cleanMessage = message.replace(/^\d{3}:\s*/, '');

    return new Response(JSON.stringify({ error: cleanMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});