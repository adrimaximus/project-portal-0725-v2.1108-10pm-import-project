// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  createSupabaseAdmin,
  getOpenAIClient,
  createSupabaseUserClient,
} from '../_shared/clients.ts';
import * as features from '../_shared/features.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const featureMap: { [key: string]: (payload: any, context: any) => Promise<any> } = {
  'analyze-projects': features.analyzeProjects,
  'analyze-duplicates': features.analyzeDuplicates,
  'ai-merge-contacts': features.aiMergeContacts,
  'generate-article-from-title': features.articleWriter,
  'expand-article-text': features.articleWriter,
  'improve-article-content': features.articleWriter,
  'summarize-article-content': features.articleWriter,
  'generate-caption': features.generateCaption,
  'generate-mood-insight': features.generateMoodInsight,
  'suggest-icon': features.suggestIcon,
  'generate-insight': features.generateInsight,
  'ai-select-calendar-events': features.aiSelectCalendarEvents,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    if (!feature || !featureMap[feature]) {
      throw new Error(`Unknown or missing feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    const userSupabase = createSupabaseUserClient(req);
    
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const context = {
      openai,
      user,
      userSupabase,
      supabaseAdmin,
      feature, // Pass feature for functions that handle multiple sub-features
    };

    const result = await featureMap[feature](payload, context);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`Error in ai-handler for feature:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});