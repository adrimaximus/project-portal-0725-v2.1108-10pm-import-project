// @ts-nocheck
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase-clients.ts';
import { getOpenAIClient } from '../_shared/openai-client.ts';

const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { altText } = await req.json();
    if (!altText) {
      throw new Error("altText is required for generating a caption.");
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);

    const userPrompt = `Generate a caption for an image described as: "${altText}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 30,
    });

    const caption = response.choices[0].message.content?.trim().replace(/"/g, '');

    return new Response(JSON.stringify({ caption }), {
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