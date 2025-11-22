// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const diagnostics = {};

    const { data: projectPolicies } = await supabaseAdmin.from('pg_policies').select('policyname').eq('tablename', 'projects');
    diagnostics.projectsRLS = projectPolicies && projectPolicies.length > 0;

    const { data: memberPolicies } = await supabaseAdmin.from('pg_policies').select('policyname').eq('tablename', 'project_members');
    diagnostics.projectMembersRLS = memberPolicies && memberPolicies.length > 0;

    const { data: userProjects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects');
    diagnostics.rpcReturnsData = !rpcError && userProjects && userProjects.length > 0;
    diagnostics.projectCount = userProjects ? userProjects.length : 0;

    const { data: projectsWithNullDates, error: nullDateError } = await supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact' })
      .or('start_date.is.null,due_date.is.null')
      .in('id', userProjects ? userProjects.map(p => p.id) : []);
    diagnostics.projectsWithNullDates = nullDateError ? 'unknown' : projectsWithNullDates?.length || 0;

    // Use maybeSingle to prevent error if key is missing
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .maybeSingle();

    if (configError) {
        throw new Error(`Error fetching config: ${configError.message}`);
    }

    if (!config?.value) {
      throw new Error("OpenAI API key is not configured by an administrator.");
    }
    const openai = new OpenAI({ apiKey: config.value });

    const systemPrompt = `You are an expert Supabase and application support AI. Your goal is to help a user diagnose why their projects might not be showing up in the UI. You will be given a JSON object with diagnostic results. Interpret these results and provide a clear, friendly, and actionable explanation in markdown format.

Here's what the diagnostic keys mean:
- projectsRLS: boolean - True if Row Level Security is enabled on the 'projects' table. This is critical for security.
- projectMembersRLS: boolean - True if RLS is enabled on the 'project_members' table. Also critical for security.
- rpcReturnsData: boolean - True if the function to get projects returns data for this user.
- projectCount: number - The number of projects the function returned for the user.
- projectsWithNullDates: number - The number of the user's visible projects that are missing a start or end date, which might affect calendar views.

Based on the results, provide a step-by-step diagnosis.
- If RLS is off on either table, that's the primary problem. State that there's a critical security misconfiguration and that data cannot be displayed safely. Advise them to contact support immediately.
- If RLS is on but rpcReturnsData is false (projectCount is 0), it likely means they have no projects or aren't assigned to any. Suggest they create a new project or ask a team member to be added to one.
- If rpcReturnsData is true but they still report issues, it might be a UI issue or a problem with specific views. If projectsWithNullDates > 0, mention that this could cause them to not appear in calendar/timeline views and suggest editing them to add dates.
- If all checks pass (RLS is on, data is returned, no null dates), reassure them that the backend seems to be working correctly and the issue might be with a specific filter or view on the page. Suggest they try clearing filters.
- Keep the tone helpful and reassuring. Address the user directly. Start with "Here's my analysis of your project data connection:".`;

    const userPrompt = JSON.stringify(diagnostics, null, 2);

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
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