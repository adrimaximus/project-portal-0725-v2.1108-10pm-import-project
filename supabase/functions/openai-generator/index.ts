// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      case 'analyze-projects': {
        const { request } = payload;
        if (!request) {
          throw new Error("An analysis request type is required.");
        }

        const userSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: projects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects');
        if (rpcError) {
          throw new Error(`Failed to fetch project data for analysis: ${rpcError.message}`);
        }
        if (!projects || projects.length === 0) {
          responseData = { result: "I couldn't find any projects associated with your account to analyze. Try creating a project or ask a team member to be added to one." };
          break;
        }

        let systemPrompt, userPrompt;

        if (request === 'summarize_health') {
          systemPrompt = "You are a helpful project management assistant. Analyze the provided JSON data and answer the user's question concisely and clearly in markdown format. Today's date is " + new Date().toDateString() + ".";
          userPrompt = "Provide a brief, bulleted summary of the overall project health. Mention the number of projects in each status category, any projects that are at risk or overdue, and the total budget of active projects. The projects data is: \n" + JSON.stringify(projects, null, 2);
        } else if (request === 'find_overdue') {
          systemPrompt = "You are a helpful project management assistant. Analyze the provided JSON data and answer the user's question concisely and clearly in markdown format. Today's date is " + new Date().toDateString() + ".";
          userPrompt = "Identify and list the names of any projects that are past their due date but are not marked as 'Completed'. If there are none, state that clearly. The projects data is: \n" + JSON.stringify(projects, null, 2);
        } else {
          systemPrompt = `You are an expert project management AI assistant. You will be given a user's question and a JSON object containing all the projects they have access to. Answer the user's question based *only* on the provided project data. Be concise and helpful. Today's date is ${new Date().toDateString()}.`;
          userPrompt = `Question: "${request}"\n\nProjects Data:\n${JSON.stringify(projects, null, 2)}`;
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