// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  createSupabaseAdmin,
  getOpenAIClient,
  createSupabaseUserClient,
} from '../_shared/clients.ts';
import {
  analyzeProjects,
  analyzeDuplicates,
  aiMergeContacts,
  articleWriter,
  generateCaption,
  generateMoodInsight,
  suggestIcon,
  generateInsight,
  aiSelectCalendarEvents,
} from '../_shared/features.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    if (!feature) {
      throw new Error("A 'feature' property is required in the request body.");
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    const userSupabase = createSupabaseUserClient(req);
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const context = {
      supabaseAdmin,
      openai,
      userSupabase,
      user,
      feature,
    };

    let result;
    switch (feature) {
      case 'analyze-projects':
        result = await analyzeProjects(payload, context);
        break;
      case 'analyze-duplicates':
        result = await analyzeDuplicates(payload, context);
        break;
      case 'merge-contacts':
        result = await aiMergeContacts(payload, context);
        break;
      case 'generate-article-from-title':
      case 'expand-article-text':
      case 'improve-article-content':
      case 'summarize-article-content':
        result = await articleWriter(payload, context);
        break;
      case 'generate-caption':
        result = await generateCaption(payload, context);
        break;
      case 'generate-mood-insight':
        result = await generateMoodInsight(payload, context);
        break;
      case 'suggest-icon':
        result = await suggestIcon(payload, context);
        break;
      case 'generate-insight':
        result = await generateInsight(payload, context);
        break;
      case 'select-calendar-events':
        result = await aiSelectCalendarEvents(payload, context);
        break;
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }

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