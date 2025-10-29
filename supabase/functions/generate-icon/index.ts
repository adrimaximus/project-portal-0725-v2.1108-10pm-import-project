// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.54.0';
import OpenAI from 'npm:openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const createSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getOpenAIClient = async (supabaseAdmin: any) => {
  // 1. Try to get the key from environment variables first.
  const apiKeyFromEnv = Deno.env.get('OPENAI_API_KEY');
  if (apiKeyFromEnv) {
    return new OpenAI({ apiKey: apiKeyFromEnv });
  }

  // 2. If not in env, fall back to the database.
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    // 3. If not found in either place, throw an error.
    throw new Error("OpenAI API key is not configured. Please set it in your application settings or as a Supabase secret.");
  }
  
  return new OpenAI({ apiKey: config.value });
};

const systemPrompt = `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, icons } = await req.json();
    if (!title || !icons || !Array.isArray(icons)) {
      throw new Error("Title and a list of icons are required.");
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);

    const userPrompt = `Title: "${title}"\n\nIcons: [${icons.join(', ')}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 20,
    });

    return new Response(JSON.stringify({ result: response.choices[0].message.content?.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});