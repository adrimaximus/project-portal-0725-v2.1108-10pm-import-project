// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- AI Context & Prompt Generation ---

async function getAiContext(userSupabase) {
  const { data: projects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });
  if (rpcError) throw new Error(`Failed to fetch project data for analysis: ${rpcError.message}`);

  const { data: users, error: usersError } = await userSupabase.from('profiles').select('id, first_name, last_name, email');
  if (usersError) throw new Error(`Failed to fetch users for context: ${usersError.message}`);

  const { data: goals, error: goalsError } = await userSupabase.rpc('get_user_goals');
  if (goalsError) throw new Error(`Failed to fetch goals for context: ${goalsError.message}`);

  return {
    projects: projects.map(p => ({
      name: p.name, status: p.status, category: p.category,
      tasks: (p.tasks || []).map(t => ({ title: t.title, completed: t.completed, assignedTo: (t.assignedTo || []).map(a => a.name) }))
    })),
    goals: goals.map(g => ({
      title: g.title, type: g.type, progress: g.completions ? g.completions.length : 0, tags: g.tags ? g.tags.map(t => t.name) : []
    })),
    users: users.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email })),
    services: [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ],
    icons: [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ],
  };
}

function getSystemPrompt(context) {
  const today = new Date().toISOString();
  return `You are an expert project and goal management AI assistant. You can answer questions and perform actions based on user requests. You will receive a conversation history. Use it to understand the context of the user's latest message.
Today's date is ${today}.

AVAILABLE ACTIONS:
You can perform several types of actions. When asked to perform an action, you MUST respond ONLY with a JSON object in the specified format.

1. CREATE_PROJECT:
{"action": "CREATE_PROJECT", "project_details": {"name": "<project name>", "description": "<desc>", "start_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "venue": "<venue>", "budget": 12345, "services": ["Service 1"], "members": ["User Name"]}}
- The current user will be the project owner. 'members' are additional people to add to the project.
- If the user does not explicitly list services, you MUST analyze the project name and description to infer a list of relevant services from the 'Available Services' context and include them in the 'services' array. For example, a 'gala dinner' project might need 'Venue', 'Food & Beverage', and 'Entertainment'.

2. UPDATE_PROJECT:
{"action": "UPDATE_PROJECT", "project_name": "<project name>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: name, description, status, payment_status, budget, start_date, due_date, venue, add_members, remove_members, add_services, remove_services.

3. BULK_UPDATE_PROJECTS:
{"action": "BULK_UPDATE_PROJECTS", "filters": {"field": "value", "another_field": "value"}, "updates": {"field": "new_value"}}
- Use this for updating multiple projects at once based on criteria.
- For filters, you can use 'null' for fields that are empty. For example, to find projects with no status, use {"status": null}.
- The projects updated will be limited to the ones the user has access to.

4. CREATE_TASK:
{"action": "CREATE_TASK", "project_name": "<project name>", "task_title": "<title of the new task>", "assignees": ["<optional user name>"]}

5. ASSIGN_TASK:
{"action": "ASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>", "<user name 2>"]}

6. UNASSIGN_TASK:
{"action": "UNASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>"]}

7. CREATE_GOAL:
{"action": "CREATE_GOAL", "goal_details": {"title": "<goal title>", "description": "<desc>", "type": "<type>", "frequency": "<freq>", "specific_days": ["Mo", "We"], "target_quantity": 123, "target_period": "Weekly", "target_value": 123, "unit": "USD", "icon": "IconName", "color": "#RRGGBB", "tags": [{"name": "Tag1", "color": "#RRGGBB"}]}}
- If a user provides only a title for a new goal, you MUST infer the other details.
- Infer a suitable 'description'.
- Choose an appropriate 'type' ('frequency', 'quantity', or 'value').
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.
- Create 2-3 relevant 'tags' as an array of objects like '[{"name": "Health", "color": "#FF6B6B"}, ...]'. These will be new tags.
- Example: User says "create a goal to learn guitar". You might respond with: {"action": "CREATE_GOAL", "goal_details": {"title": "Learn Guitar", "description": "Practice guitar regularly to improve skills.", "type": "frequency", "frequency": "Weekly", "specific_days": ["Mo", "We", "Fr"], "icon": "Music", "color": "#4ECDC4", "tags": [{"name": "Music", "color": "#4ECDC4"}, {"name": "Hobby", "color": "#F7B801"}]}}

8. UPDATE_GOAL:
{"action": "UPDATE_GOAL", "goal_title": "<title of the goal to update>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names.

If the user's request is a question and not an action, answer it based on the provided data.

CONTEXT:
- Available Projects (with their tasks): ${JSON.stringify(context.projects, null, 2)}
- Available Goals: ${JSON.stringify(context.goals, null, 2)}
- Available Users: ${JSON.stringify(context.users, null, 2)}
- Available Services: ${JSON.stringify(context.services, null, 2)}
- Available Icons: ${JSON.stringify(context.icons, null, 2)}
`;
}

// --- Action Handlers ---

async function handleCreateProjectAction({ details, supabaseAdmin, user, userList }) {
  if (!details || !details.name) return "To create a project, I need at least a name.";

  const { data: newProject, error } = await supabaseAdmin.from('projects').insert({
    name: details.name, description: details.description, start_date: details.start_date,
    due_date: details.due_date, venue: details.venue, budget: details.budget,
    created_by: user.id, status: 'Requested',
  }).select().single();

  if (error) return `I tried to create the project, but failed. The database said: ${error.message}`;

  let followUp = [];
  if (details.services?.length > 0) {
    const { error } = await supabaseAdmin.from('project_services').insert(details.services.map(s => ({ project_id: newProject.id, service_title: s })));
    if (error) followUp.push("I couldn't add the services."); else followUp.push(`I've added ${details.services.length} services.`);
  }
  if (details.members?.length > 0) {
    const memberIds = userList.filter(u => details.members.some(name => u.name.toLowerCase() === name.toLowerCase())).map(u => u.id);
    if (memberIds.length > 0) {
      const { error } = await supabaseAdmin.from('project_members').insert(memberIds.map(id => ({ project_id: newProject.id, user_id: id, role: 'member' })));
      if (error) followUp.push("I couldn't add the team members."); else followUp.push(`I've assigned ${details.members.join(', ')}.`);
    } else {
      followUp.push(`I couldn't find the users ${details.members.join(', ')}.`);
    }
  }
  return `Done! I've created the project "${newProject.name}". ${followUp.join(' ')}`.trim();
}

async function handleUpdateProjectAction({ projectName, updates, projects, userList, supabaseAdmin }) {
    const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    if (!project) return `I couldn't find a project named "${projectName}".`;

    const rpcParams = {
        p_project_id: project.id, p_name: updates.name ?? project.name,
        p_description: updates.description ?? (project.description || null),
        p_category: updates.category ?? (project.category || null),
        p_status: updates.status ?? project.status, p_budget: updates.budget ?? (project.budget || null),
        p_start_date: updates.start_date ?? (project.start_date || null),
        p_due_date: updates.due_date ?? (project.due_date || null),
        p_payment_status: updates.payment_status ?? project.payment_status,
        p_payment_due_date: updates.payment_due_date ?? (project.payment_due_date || null),
        p_venue: updates.venue ?? (project.venue || null),
        p_member_ids: project.assignedTo.map(m => m.id),
        p_service_titles: project.services || [],
    };

    let currentMemberIds = new Set(project.assignedTo.map(m => m.id));
    if (updates.add_members) updates.add_members.forEach(name => {
        const user = userList.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (user) currentMemberIds.add(user.id);
    });
    if (updates.remove_members) updates.remove_members.forEach(name => {
        const user = userList.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (user) currentMemberIds.delete(user.id);
    });
    rpcParams.p_member_ids = Array.from(currentMemberIds);

    let currentServices = new Set(project.services || []);
    if (updates.add_services) updates.add_services.forEach(s => currentServices.add(s));
    if (updates.remove_services) updates.remove_services.forEach(s => currentServices.delete(s));
    rpcParams.p_service_titles = Array.from(currentServices);

    const { error } = await supabaseAdmin.rpc('update_project_details', rpcParams);
    if (error) return `I tried to update the project, but failed: ${error.message}`;
    
    const changes = Object.keys(updates).map(key => `updated ${key.replace('_', ' ')}`).join(', ');
    return `Done! I've updated the project "${project.name}": ${changes}.`;
}

async function handleBulkUpdateProjectsAction({ filters, updates, projects, supabaseAdmin }) {
    if (!filters || !updates) return "For a bulk update, I need both filters and the updates to apply.";

    let query = supabaseAdmin.from('projects').select('id');
    for (const [key, value] of Object.entries(filters)) {
        query = value === null ? query.is(key, null) : query.eq(key, value);
    }
    query = query.in('id', projects.map(p => p.id));

    const { data: projectsToUpdate, error: filterError } = await query;
    if (filterError) return `I couldn't find projects to update: ${filterError.message}`;
    if (!projectsToUpdate || projectsToUpdate.length === 0) return "I couldn't find any projects matching your criteria.";

    const projectIds = projectsToUpdate.map(p => p.id);
    const { error: updateError } = await supabaseAdmin.from('projects').update(updates).in('id', projectIds);
    if (updateError) return `I tried to update the projects, but failed: ${updateError.message}`;
    
    return `Done! I've updated ${projectIds.length} project(s).`;
}

// ... other action handlers for tasks, goals etc. can be added here in the same pattern

// --- Feature Handlers ---

async function handleAnalyzeProjects({ req, payload, supabaseAdmin, openai }) {
  const { request, conversationHistory } = payload;
  if (!request) throw new Error("An analysis request type is required.");

  const userSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error("User not authenticated.");

  const context = await getAiContext(userSupabase);
  const systemPrompt = getSystemPrompt(context);

  const messages = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: request }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo", messages, temperature: 0.1, max_tokens: 1000,
  });

  const responseText = response.choices[0].message.content;
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
  if (!jsonMatch) return { result: responseText };

  try {
    const actionData = JSON.parse(jsonMatch[1] || jsonMatch[2]);
    switch (actionData.action) {
      case 'CREATE_PROJECT':
        return { result: await handleCreateProjectAction({ details: actionData.project_details, supabaseAdmin, user, userList: context.users }) };
      case 'UPDATE_PROJECT':
        return { result: await handleUpdateProjectAction({ projectName: actionData.project_name, updates: actionData.updates, projects: context.projects, userList: context.users, supabaseAdmin }) };
      case 'BULK_UPDATE_PROJECTS':
        return { result: await handleBulkUpdateProjectsAction({ filters: actionData.filters, updates: actionData.updates, projects: context.projects, supabaseAdmin }) };
      // ... other action cases
      default:
        return { result: "I understood the action, but I don't know how to perform it yet." };
    }
  } catch (e) {
    return { result: responseText };
  }
}

async function handleGenerateInsight({ payload, openai }) {
  const { goal, context } = payload;
  if (!goal || !context) throw new Error("Goal and context are required.");

  const systemPrompt = `Anda adalah seorang pelatih AI yang suportif dan berwawasan luas. Tujuan Anda adalah memberikan saran yang memotivasi dan dapat ditindaklanjuti kepada pengguna berdasarkan kemajuan mereka. Analisis detail tujuan berikut: judul, deskripsi, tipe, tag, pemilik (owner), kolaborator lain (collaborators), dan kemajuan terbaru. Berdasarkan analisis holistik ini, berikan wawasan singkat yang bermanfaat dalam format markdown.

- Pertahankan nada yang positif dan memotivasi.
- Sapa pengguna secara langsung. Jika ada pemilik (owner), sapa mereka sebagai pemilik tujuan.
- Jika ada kolaborator lain, Anda bisa menyebutkan mereka dalam konteks kolaborasi.
- Jika kemajuan baik, berikan pujian dan sarankan cara untuk mempertahankan momentum.
- Jika kemajuan tertinggal, berikan semangat, bukan kritik. Sarankan langkah-langkah kecil yang dapat dikelola untuk kembali ke jalur yang benar.
- Jaga agar respons tetap ringkas (2-4 kalimat).
- Jangan mengulangi data kembali kepada pengguna; interpretasikan data tersebut.
- PENTING: Selalu berikan respons dalam Bahasa Indonesia.`;
  const userPrompt = `Berikut adalah tujuan saya dan kemajuan terbaru saya. Tolong berikan saya beberapa saran pembinaan.\nTujuan: ${JSON.stringify(goal, null, 2)}\nKonteks Kemajuan: ${JSON.stringify(context, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    temperature: 0.7, max_tokens: 200,
  });
  return { result: response.choices[0].message.content };
}

async function handleGenerateMoodInsight({ payload, openai }) {
    const { prompt, conversationHistory } = payload;
    if (!prompt) throw new Error("Prompt is required.");

    const systemPrompt = `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`;
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
        { role: "user", content: prompt }
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo", messages, temperature: 0.7, max_tokens: 200,
    });
    return { result: response.choices[0].message.content };
}

const featureHandlers = {
  'analyze-projects': handleAnalyzeProjects,
  'generate-insight': handleGenerateInsight,
  'generate-mood-insight': handleGenerateMoodInsight,
};

// --- Main Server ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    const handler = featureHandlers[feature];
    if (!handler) throw new Error(`Unknown feature: ${feature}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: config, error: configError } = await supabaseAdmin.from('app_config').select('value').eq('key', 'OPENAI_API_KEY').single();
    if (configError || !config?.value) throw new Error("OpenAI API key is not configured by an administrator.");

    const openai = new OpenAI({ apiKey: config.value });

    const responseData = await handler({ req, payload, supabaseAdmin, openai });

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