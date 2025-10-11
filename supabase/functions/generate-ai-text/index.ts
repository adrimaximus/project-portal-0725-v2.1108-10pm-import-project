import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getOpenAIClient = async (supabaseAdmin) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  return new OpenAI({ apiKey: config.value });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // 2. Get request body
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("A prompt is required.");
    }

    // 3. Get OpenAI client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const openai = await getOpenAIClient(supabaseAdmin);

    // 4. Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that completes or generates text based on a user's prompt. Respond with only the generated text, without any introductory phrases." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const generatedText = response.choices[0].message.content;

    // 5. Return success response
    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});