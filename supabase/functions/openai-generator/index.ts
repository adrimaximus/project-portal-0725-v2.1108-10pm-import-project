// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import prompts from a shared location (or define them here)
const getProjectBriefSystemPrompt = (project) => `Anda adalah asisten AI... (rest of prompt)`; // Placeholder for brevity
const getTaskSuggestionsSystemPrompt = (project, existingTasks) => `Anda adalah asisten AI untuk manajer proyek... (rest of prompt)`; // Placeholder for brevity

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single();

    if (configError || !config?.value) {
      throw new Error("OpenAI API key is not configured by an administrator.");
    }

    const openai = new OpenAI({ apiKey: config.value });

    let responseData;

    switch (feature) {
      case 'generate-brief': {
        // Logic from generateProjectBrief
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: getProjectBriefSystemPrompt(payload.project) },
                { role: "user", content: "Tolong hasilkan brief proyek berdasarkan informasi yang diberikan." }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });
        responseData = { result: response.choices[0].message.content };
        break;
      }
      case 'generate-tasks': {
        // Logic from generateTaskSuggestions
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: getTaskSuggestionsSystemPrompt(payload.project, payload.existingTasks) },
                { role: "user", content: "Berdasarkan detail proyek, tolong berikan beberapa saran tugas dalam format array JSON." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
        });
        const content = response.choices[0].message.content;
        responseData = { result: JSON.parse(content || '{}') };
        break;
      }
      case 'generate-insight': {
        // Mocked logic for insight
        await new Promise(resolve => setTimeout(resolve, 1000));
        responseData = { result: `Here is an AI insight for your goal "${payload.goal.title}". Keep up the great work!` };
        break;
      }
      case 'generate-icon': {
        // Mocked logic for icon
        await new Promise(resolve => setTimeout(resolve, 1500));
        responseData = { result: `https://via.placeholder.com/128/4ECDC4/FFFFFF?text=AI` };
        break;
      }
      case 'analyze-projects': {
        const { projects, request } = payload;
        if (!projects || !request) {
          throw new Error("Projects data and a request type are required for analysis.");
        }

        let systemPrompt = "You are a helpful project management assistant. Analyze the provided JSON data and answer the user's question concisely and clearly in markdown format. Today's date is " + new Date().toDateString() + ".";
        let userPrompt = "";

        if (request === 'summarize_health') {
          userPrompt = "Provide a brief, bulleted summary of the overall project health. Mention the number of projects in each status category, any projects that are at risk or overdue, and the total budget of active projects. The projects data is: \n" + JSON.stringify(projects, null, 2);
        } else if (request === 'find_overdue') {
          userPrompt = "Identify and list the names of any projects that are past their due date but are not marked as 'Completed'. If there are none, state that clearly. The projects data is: \n" + JSON.stringify(projects, null, 2);
        } else {
          throw new Error(`Unknown analysis request: ${request}`);
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 400,
        });
        responseData = { result: response.choices[0].message.content };
        break;
      }
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }

    return new Response(JSON.stringify(responseData), {
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