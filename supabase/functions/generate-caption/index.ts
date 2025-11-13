// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { altText } = await req.json();
    if (!altText) {
      throw new Error("altText is required for generating a caption.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openai = await getOpenAIClient(supabaseAdmin);
    const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

    if (!openai && !anthropic) {
      throw new Error("No AI provider is configured.");
    }

    const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;
    const userPrompt = `Generate a caption for an image described as: "${altText}"`;

    let caption;
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
        temperature: 0.7,
        max_tokens: 30,
      });
      caption = response.content[0].text;
    } else if (openai) {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 30,
      });
      caption = response.choices[0].message.content;
    } else {
      throw new Error("No AI provider configured.");
    }

    return new Response(JSON.stringify({ caption: caption?.trim().replace(/"/g, '') }), {
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