// @ts-nocheck
import { corsHeaders } from 'shared/cors.ts';
import { createSupabaseAdmin } from 'shared/supabase-clients.ts';
import { getOpenAIClient } from 'shared/openai-client.ts';

const systemPrompt = `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { duplicates } = await req.json();
    if (!duplicates) {
      throw new Error("Duplicates data is required for analysis.");
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);

    const userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(duplicates, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 250,
    });

    const result = response.choices[0].message.content;

    return new Response(JSON.stringify({ result }), {
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