// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from './_utils/cors.ts';
import { createSupabaseUserClient, createSupabaseAdmin, getOpenAIClient } from './_clients/index.ts';
import { FeatureHandlers } from './_features/index.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const userSupabase = createSupabaseUserClient(req);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated.");

    const body = await req.json();
    const { feature, payload } = body;
    const handler = FeatureHandlers[feature];
    if (!handler) throw new Error(`Unknown feature: ${feature}`);

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    
    const context = { req, openai, supabaseAdmin, feature, user, userSupabase };
    const responseData = await handler(payload, context);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('!!! TOP LEVEL CATCH IN AI-HANDLER !!!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    let status = 500;
    let message = error.message;
    if (error.status === 401) {
      status = 401;
      message = "OpenAI API key is invalid or has been revoked. Please check your key in the settings.";
    } else if (error.status === 429) {
      status = 429;
      message = "You've exceeded your OpenAI quota or have a billing issue. Please check your OpenAI account.";
    }
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});