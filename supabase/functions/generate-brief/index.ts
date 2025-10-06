/// <reference types="https://cdn.jsdelivr.net/npm/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, startDate, dueDate, venue, services } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets.");
    }

    const serviceList = Array.isArray(services) && services.length > 0 ? services.join(', ') : 'Not specified';
    const timeline = startDate && dueDate 
      ? `from ${new Date(startDate).toLocaleDateString()} to ${new Date(dueDate).toLocaleDateString()}` 
      : 'Not specified';

    const prompt = `You are a project management assistant. Generate a project brief and preparation recommendations based on these details:
- Project Title: ${title}
- Timeline: ${timeline}
- Venue: ${venue || 'Not specified'}
- Services: ${serviceList}

The output should be in HTML format. Structure it with an <h2> for "Project Brief" and another <h2> for "Preparation Recommendations". Use <ul> and <li> for lists. Be concise and professional.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const responseData = await response.json();
    const brief = responseData.content[0].text;

    return new Response(
      JSON.stringify({ brief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})