// @ts-nocheck
/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.22.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectName, venue, services, description, existingTasks } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets.");
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const serviceList = Array.isArray(services) && services.length > 0 ? services.join(', ') : 'Not specified';
    const existingTasksList = Array.isArray(existingTasks) && existingTasks.length > 0 ? `The following tasks already exist, so do not generate them again: ${existingTasks.join(', ')}.` : '';

    const prompt = `You are an expert project management assistant specializing in brand activation and event execution. Your primary goal is to break down a project into actionable tasks.

      Focus heavily on the **Project Title** and **Project Description** to understand the core objectives. Use other details as supplementary context.

      **Project Details:**
      - **Project Title (Primary Focus):** ${projectName}
      - **Project Description (Primary Focus):** ${description || 'No overview provided.'}
      - **Event Venue:** ${venue || 'not specified'}
      - **Services Provided:** ${serviceList}

      ${existingTasksList}

      Based on the information above, generate a JSON array of 5 new, highly specific, concise, and actionable task objects. Each object must have two keys: "title" (a string) and "priority" (a string, which must be one of: "Low", "Normal", "High", "Urgent").

      Return ONLY a valid JSON array of objects. For example: [{"title": "Prepare promotional materials", "priority": "High"}, {"title": "Coordinate with sound system vendor", "priority": "Normal"}]. Do not include any other text, markdown, or explanation.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = msg.content[0].text;
    
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