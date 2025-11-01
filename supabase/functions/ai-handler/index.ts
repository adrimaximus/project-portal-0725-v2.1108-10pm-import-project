// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient as createSupabaseClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.22.0';
import { featureMap, corsHeaders } from './logic.ts';

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const createSupabaseAdmin = () => {
  return createSupabaseClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getOpenAIClient = async (supabaseAdmin: any) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    return null;
  }
  return new OpenAI({ apiKey: config.value });
};

const createSupabaseUserClient = (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    return createSupabaseClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let feature = 'unknown';
  try {
    const body = await req.json();
    feature = body.feature;
    const { payload } = body;

    if (!feature || !featureMap[feature]) {
      throw new Error(`Unknown or missing feature: ${feature}`);
    }
    console.log(`[ai-handler] INFO: Received feature: ${feature}`);

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

    console.log(`[ai-handler] DIAGNOSTIC: Anthropic Key available: ${!!ANTHROPIC_API_KEY}`);
    console.log(`[ai-handler] DIAGNOSTIC: OpenAI Client configured: ${!!openai}`);

    if (!openai && !anthropic) {
      console.error("[ai-handler] CRITICAL: No AI provider is configured. Check ANTHROPIC_API_KEY env var and OpenAI key in app_config table.");
      throw new Error("No AI provider is configured. Please set up OpenAI or Anthropic API keys.");
    }
    
    const userSupabase = createSupabaseUserClient(req);
    
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const context = {
      openai,
      anthropic,
      user,
      userSupabase,
      supabaseAdmin,
      feature,
    };

    console.log(`[ai-handler] INFO: Executing feature '${feature}'...`);
    const result = await featureMap[feature](payload, context);
    console.log(`[ai-handler] INFO: Feature '${feature}' executed successfully.`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[ai-handler] ERROR: Error in ai-handler for feature '${feature}':`, error.stack || error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});