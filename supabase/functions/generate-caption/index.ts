// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API keys from app_config
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('key, value')
      .in('key', ['OPENAI_API_KEY']);
    
    const openaiKey = config?.find(c => c.key === 'OPENAI_API_KEY')?.value;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!openaiKey && !anthropicKey) {
      throw new Error("No AI provider configured (OpenAI or Anthropic).");
    }

    const { altText } = await req.json();
    if (!altText) {
      throw new Error("altText is required.");
    }

    const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;
    const userPrompt = `Generate a caption for an image described as: "${altText}"`;

    let caption = "";

    if (anthropicKey) {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
        temperature: 0.7,
        max_tokens: 50,
      });
      caption = response.content[0].text;
    } else if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 50,
      });
      caption = response.choices[0].message.content;
    }

    const cleanCaption = caption?.trim().replace(/^"|"$/g, '');

    return new Response(JSON.stringify({ caption: cleanCaption }), {
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