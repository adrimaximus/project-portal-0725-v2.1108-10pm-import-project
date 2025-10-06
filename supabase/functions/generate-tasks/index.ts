/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

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
    const { projectName, venue, services, description } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets.");
    }

    const serviceList = Array.isArray(services) && services.length > 0 ? services.join(', ') : 'Not specified';

    const prompt = `You are a helpful project management assistant. Based on the following project details, generate a JSON array of 5 concise, actionable task titles. The project is titled '${projectName}'. It will take place at '${venue || 'an unspecified location'}'. The services involved are: ${serviceList}. Project overview: ${description || 'No overview provided.'}. Return ONLY a valid JSON array of strings, where each string is a task title. For example: ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"]. Do not include any other text, markdown, or explanation.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const responseData = await response.json();
    const responseText = responseData.content[0].text;
    
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("Raw AI response:", responseText);
      throw new Error("AI response did not contain a valid JSON array.");
    }

    const tasks = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("AI generated an empty or invalid list of tasks.");
    }

    return new Response(
      JSON.stringify(tasks),
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