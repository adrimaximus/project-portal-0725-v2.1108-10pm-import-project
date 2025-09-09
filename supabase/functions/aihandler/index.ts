// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createSupabaseUserClient, createSupabaseAdmin, getOpenAIClient } from './clients.ts';
import { featureHandlers } from './features.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    let body;
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch (e) {
        throw new Error("Invalid JSON body.");
      }
    } else {
        throw new Error("Request must have Content-Type: application/json");
    }

    const { feature, payload } = body;
    if (!feature || typeof feature !== 'string') {
        throw new Error("Request body must include a 'feature' string.");
    }

    const userSupabase = createSupabaseUserClient(req);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated.");

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
        user,
        userSupabase,
    };

    const responseData = await handler(payload, context);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    let status = 400;
    let message = error.message;

    if (error.status === 401) {
      status = 401;
      message = "OpenAI API key is invalid or has been revoked. Please check your key in the settings.";
    } else if (error.status === 429) {
      status = 429;
      message = "You've exceeded your OpenAI quota or have a billing issue. Please check your OpenAI account.";
    } else if (error.message.includes("User not authenticated")) {
      status = 401;
    }

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});