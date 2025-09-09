// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Anthropic from 'npm:@anthropic-ai/sdk@^0.24.2';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert writer and content creator. Your task is to generate a high-quality, insightful, and useful article based on the user's prompt. The response should be in Indonesian.

The article must be structured as follows:
1.  **Title**: A compelling and relevant title for the article in Indonesian.
2.  **Content**: The body of the article, written in HTML format. The content should include:
    *   An engaging introduction.
    *   Key insights and valuable information.
    *   Actionable steps, presented as a numbered or bulleted list (e.g., using <ol> or <ul>).
    *   A concluding summary.
3.  **Unsplash Keywords**: An array of exactly two English keywords that are most contextual and powerful for finding a header image for this article on Unsplash.

Your final output MUST be a single, valid JSON object containing three keys: "title", "content", and "unsplash_keywords". Do not include any other text or explanations outside of the JSON object.

Example output format:
{
  "title": "Judul Artikel Contoh",
  "content": "<h1>Judul Artikel Contoh</h1><p>Ini adalah pendahuluan.</p><h2>Wawasan Utama</h2><ul><li>Wawasan 1</li><li>Wawasan 2</li></ul><h2>Langkah-langkah yang Dapat Dilakukan</h2><ol><li>Langkah 1</li><li>Langkah 2</li></ol><p>Ini adalah kesimpulan.</p>",
  "unsplash_keywords": ["example", "concept"]
}
`;

    const msg = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate an article about: ${prompt}`,
        },
      ],
    });

    const responseContent = msg.content[0].text;
    
    // Clean potential markdown code block
    const jsonString = responseContent.replace(/```json\n|```/g, '').trim();

    const articleData = JSON.parse(jsonString);

    return new Response(JSON.stringify(articleData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate article', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});