import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getOpenAIClient = async (supabaseAdmin: any) => {
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

const systemPrompt = `You are an AI assistant integrated into an Editor.js-based text editor. Your task is to generate content based on the user's prompt and format it as a valid Editor.js block structure. The user may provide context from their current block to expand upon.

You can generate the following block types:
- 'header': For titles. Use levels 2 or 3.
- 'paragraph': For plain text.
- 'list': For bulleted ('unordered') or numbered ('ordered') lists.

Your response MUST be a single, valid JSON object containing a "blocks" key. The value of "blocks" must be an array of Editor.js block objects. Do not include any other text, explanations, or markdown formatting.

Example of a valid response for the prompt "Write a title and a short paragraph about React":
{
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "What is React?",
        "level": 2
      }
    },
    {
      "type": "paragraph",
      "data": {
        "text": "React is a popular JavaScript library for building user interfaces, particularly for single-page applications. It allows developers to create reusable UI components."
      }
    }
  ]
}`;

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
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const generatedContent = response.choices[0].message.content;
    if (!generatedContent) {
        throw new Error("AI did not return any content.");
    }

    const parsedContent = JSON.parse(generatedContent);

    // 5. Return success response
    return new Response(JSON.stringify(parsedContent), {
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