// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeAction } from '../actions/index.ts';

async function getContext(userSupabase) {
    const { data: projects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });
    if (rpcError) throw new Error(`Failed to fetch project data for analysis: ${rpcError.message}`);
    
    const { data: users, error: usersError } = await userSupabase.from('profiles').select('id, first_name, last_name, email');
    if (usersError) throw new Error(`Failed to fetch users for context: ${usersError.message}`);

    const { data: goals, error: goalsError } = await userSupabase.rpc('get_user_goals');
    if (goalsError) throw new Error(`Failed to fetch goals for context: ${goalsError.message}`);

    return { projects, users, goals };
}

function buildSystemPrompt(projects, users, goals) {
    const summarizedProjects = projects.map(p => ({
        name: p.name, status: p.status, tags: (p.tags || []).map(t => t.name),
        tasks: (p.tasks || []).map(t => ({ title: t.title, completed: t.completed, assignedTo: (t.assignedTo || []).map(a => a.name) }))
    }));
    const summarizedGoals = goals.map(g => ({
        title: g.title, type: g.type, progress: g.completions ? g.completions.length : 0, tags: g.tags ? g.tags.map(t => t.name) : []
    }));
    const userList = users.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
    const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
    const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];

    return `You are an expert project and goal management AI assistant. Your purpose is to execute actions for the user. You will receive a conversation history and context data.

**Critical Rules of Operation:**
1.  **ACTION-ORIENTED:** Your primary function is to identify and execute actions based on the user's request.
2.  **TASK CREATION WORKFLOW (SPECIAL CASE):**
    a.  When a user asks to create a task, your FIRST response MUST be a natural language recommendation. Example: "Tentu, saya bisa membuatkan task 'Desain logo baru' di proyek 'Brand Refresh'. Apakah Anda ingin melanjutkan?"
    b.  If the user's NEXT message is a confirmation (e.g., "yes", "ok, buatkan", "proceed"), your response MUST be ONLY the \`CREATE_TASK\` action JSON. Do not add any other text.
3.  **DIRECT ACTION FOR OTHER COMMANDS:** For all other actions (CREATE_PROJECT, UPDATE_PROJECT, etc.), you should act directly by responding with ONLY the action JSON, unless the request is dangerously ambiguous (e.g., "delete the project").
4.  **QUESTION ANSWERING:** If the user's request is clearly a question seeking information, then and only then should you answer in natural language.

**Your entire process is:**
1. Analyze the user's latest message.
2. Is it a request to create a task?
   - YES: Respond with a natural language recommendation and wait for confirmation. If they have already confirmed, respond with the \`CREATE_TASK\` JSON.
   - NO: Is it another action?
     - YES: Respond with the appropriate action JSON.
     - NO: It's a question. Answer it naturally.

AVAILABLE ACTIONS:
You can perform several types of actions. When you decide to perform an action, you MUST respond ONLY with a JSON object in the specified format.

1. CREATE_PROJECT:
{"action": "CREATE_PROJECT", "project_details": {"name": "<project name>", "description": "<desc>", "start_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "venue": "<venue>", "budget": 12345, "services": ["Service 1"], "members": ["User Name"]}}
- The current user will be the project owner. 'members' are additional people to add to the project.
- If the user does not explicitly list services, you MUST analyze the project name and description to infer a list of relevant services from the 'Available Services' context and include them in the 'services' array. For example, a 'gala dinner' project might need 'Venue', 'Food & Beverage', and 'Entertainment'.

2. UPDATE_PROJECT:
{"action": "UPDATE_PROJECT", "project_name": "<project name>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: name, description, status, payment_status, budget, start_date, due_date, venue, add_members, remove_members, add_services, remove_services, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names. If a tag doesn't exist, it will be created with a default color.

3. CREATE_TASK:
{"action": "CREATE_TASK", "project_name": "<project name>", "task_title": "<title of the new task>", "assignees": ["<optional user name>"]}

4. ASSIGN_TASK:
{"action": "ASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>", "<user name 2>"]}

5. UNASSIGN_TASK:
{"action": "UNASSIGN_TASK", "project_name": "<project name>", "task_title": "<title of the task>", "assignees": ["<user name 1>"]}

6. CREATE_GOAL:
{"action": "CREATE_GOAL", "goal_details": {"title": "<goal title>", "description": "<desc>", "type": "<type>", "frequency": "<freq>", "specific_days": ["Mo", "We"], "target_quantity": 123, "target_period": "Weekly", "target_value": 123, "unit": "USD", "icon": "IconName", "color": "#RRGGBB", "tags": [{"name": "Tag1", "color": "#RRGGBB"}]}}
- If a user provides only a title for a new goal, you MUST infer the other details.
- Infer a suitable 'description'.
- Choose an appropriate 'type' ('frequency', 'quantity', or 'value').
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.
- Create 2-3 relevant 'tags' as an array of objects like '[{"name": "Health", "color": "#FF6B6B"}, ...]'. These will be new tags.
- Example: User says "create a goal to learn guitar". You might respond with: {"action": "CREATE_GOAL", "goal_details": {"title": "Learn Guitar", "description": "Practice guitar regularly to improve skills.", "type": "frequency", "frequency": "Weekly", "specific_days": ["Mo", "We", "Fr"], "icon": "Music", "color": "#4ECDC4", "tags": [{"name": "Music", "color": "#4ECDC4"}, {"name": "Hobby", "color": "#F7B801"}]}}

7. UPDATE_GOAL:
{"action": "UPDATE_GOAL", "goal_title": "<title of the goal to update>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names.

CONTEXT:
- Available Projects (with their tasks and tags): ${JSON.stringify(summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
- Available Services: ${JSON.stringify(serviceList, null, 2)}
- Available Icons: ${JSON.stringify(iconList, null, 2)}
`;
}

export async function handleAnalyzeProjects(req, supabaseAdmin, openai, payload) {
    const { request, conversationHistory } = payload;
    if (!request) {
        throw new Error("An analysis request type is required.");
    }

    const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const context = await getContext(userSupabase);
    const systemPrompt = buildSystemPrompt(context.projects, context.users, context.goals);

    const messages = [
        { role: "system", content: systemPrompt },
        ...(conversationHistory || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
        { role: "user", content: request }
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages,
        temperature: 0.1,
        max_tokens: 1000,
    });

    const responseText = response.choices[0].message.content;
    
    try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        if (!jsonMatch) {
            return { result: responseText };
        }
        const jsonString = jsonMatch[1] || jsonMatch[2];
        const actionData = JSON.parse(jsonString);

        const actionResult = await executeAction(actionData, { userSupabase, supabaseAdmin, user, ...context });
        return { result: actionResult };

    } catch (e) {
        return { result: responseText };
    }
}