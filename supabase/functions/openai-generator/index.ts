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
        const { request, conversationHistory } = payload;
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
        
        const { data: users, error: usersError } = await userSupabase.from('profiles').select('id, first_name, last_name, email');
        if (usersError) {
          throw new Error(`Failed to fetch users for context: ${usersError.message}`);
        }

        if (!projects || projects.length === 0) {
          responseData = { result: "I couldn't find any projects associated with your account to analyze. Try creating a project or ask a team member to be added to one." };
          break;
        }

        const summarizedProjects = projects.map(p => ({
          name: p.name,
          status: p.status,
          owner: p.created_by.name,
          description: p.description?.substring(0, 100),
          startDate: p.start_date,
          dueDate: p.due_date,
        }));
        const userList = users.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));

        const today = new Date().toISOString();
        const systemPrompt = `You are an expert project management AI assistant. You can answer questions and perform actions.
Today's date is ${today}.

AVAILABLE ACTIONS:
If the user asks to update a project, you MUST respond ONLY with a JSON object in this format:
{"action": "UPDATE_PROJECT", "project_name": "<project name>", "updates": {"field": "value"}}

- Valid fields for updates are: "owner".
- For "owner", the value must be the full name of an existing user.
- Be smart about identifying the project and user from the user's request. Use the context provided.

If the user's request is not an action, answer their question based on the provided data.

CONTEXT:
- Available Projects: ${JSON.stringify(summarizedProjects, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
`;

        const messages = [
          { role: "system", content: systemPrompt },
          ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
          { role: "user", content: request }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages,
            temperature: 0.1,
            max_tokens: 500,
        });

        const responseText = response.choices[0].message.content;
        let actionData;
        try {
            actionData = JSON.parse(responseText);
        } catch (e) {
            responseData = { result: responseText };
            break;
        }

        if (actionData && actionData.action === 'UPDATE_PROJECT') {
            const { project_name, updates } = actionData;
            
            const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                responseData = { result: `I couldn't find a project named "${project_name}". Please be more specific.` };
                break;
            }

            if (updates.owner) {
                const newOwner = users.find(u => (`${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase() === updates.owner.toLowerCase()) || (u.email && u.email.toLowerCase() === updates.owner.toLowerCase()));
                if (!newOwner) {
                    responseData = { result: `I couldn't find a user named "${updates.owner}". Please make sure they are a member of the workspace.` };
                    break;
                }

                const { error: transferError } = await supabaseAdmin.rpc('transfer_project_ownership', {
                    p_project_id: project.id,
                    p_new_owner_id: newOwner.id
                });

                if (transferError) {
                    responseData = { result: `I tried, but failed to change the owner. The database said: ${transferError.message}` };
                } else {
                    responseData = { result: `Done! I've made ${updates.owner} the new owner of "${project.name}".` };
                }
            } else {
                responseData = { result: "I understood you want to update a project, but I don't know what to change. You can ask me to change the 'owner'." };
            }
        } else {
            responseData = { result: responseText };
        }
        break;
      }
      case 'generate-insight': {
        const { goal, context } = payload;
        if (!goal || !context) {
          throw new Error("Goal and context are required for generating insights.");
        }

        const systemPrompt = `Anda adalah seorang pelatih AI yang suportif dan berwawasan luas. Tujuan Anda adalah memberikan saran yang memotivasi dan dapat ditindaklanjuti kepada pengguna berdasarkan kemajuan mereka menuju tujuan tertentu. Anda akan diberikan objek JSON dengan detail tujuan dan kemajuan terbaru mereka. Analisis informasi ini dan berikan wawasan singkat yang bermanfaat dalam format markdown.

- Pertahankan nada yang positif dan memotivasi.
- Sapa pengguna secara langsung.
- Jika kemajuan baik, berikan pujian dan sarankan cara untuk mempertahankan momentum.
- Jika kemajuan tertinggal, berikan semangat, bukan kritik. Sarankan langkah-langkah kecil yang dapat dikelola untuk kembali ke jalur yang benar.
- Jaga agar respons tetap ringkas (2-4 kalimat).
- Jangan mengulangi data kembali kepada pengguna; interpretasikan data tersebut.
- PENTING: Selalu berikan respons dalam Bahasa Indonesia.`;

        const userPrompt = `Berikut adalah tujuan saya dan kemajuan terbaru saya. Tolong berikan saya beberapa saran pembinaan.
Tujuan: ${JSON.stringify(goal, null, 2)}
Konteks Kemajuan: ${JSON.stringify(context, null, 2)}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 200,
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
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});