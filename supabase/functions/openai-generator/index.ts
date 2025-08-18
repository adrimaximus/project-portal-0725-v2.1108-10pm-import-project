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
        
        const { data: { user } } = await userSupabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");

        const { data: projects, error: rpcError } = await userSupabase.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });
        if (rpcError) {
          throw new Error(`Failed to fetch project data for analysis: ${rpcError.message}`);
        }
        
        const { data: users, error: usersError } = await userSupabase.from('profiles').select('id, first_name, last_name, email');
        if (usersError) {
          throw new Error(`Failed to fetch users for context: ${usersError.message}`);
        }

        const { data: goals, error: goalsError } = await userSupabase.rpc('get_user_goals');
        if (goalsError) {
          throw new Error(`Failed to fetch goals for context: ${goalsError.message}`);
        }

        const summarizedProjects = projects.map(p => ({
            name: p.name,
            status: p.status,
            tasks: (p.tasks || []).map(t => ({
                title: t.title,
                completed: t.completed,
                assignedTo: (t.assignedTo || []).map(a => a.name)
            }))
        }));
        const summarizedGoals = goals.map(g => ({
            title: g.title,
            type: g.type,
            progress: g.completions ? g.completions.length : 0,
            tags: g.tags ? g.tags.map(t => t.name) : []
        }));
        const userList = users.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
        const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
        const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];

        const today = new Date().toISOString();
        const systemPrompt = `You are an expert project and goal management AI assistant. You can answer questions and perform actions based on user requests. You will receive a conversation history. Use it to understand the context of the user's latest message.
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

If the user's request is a question and not an action, answer it based on the provided data.

CONTEXT:
- Available Projects (with their tasks): ${JSON.stringify(summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
- Available Services: ${JSON.stringify(serviceList, null, 2)}
- Available Icons: ${JSON.stringify(iconList, null, 2)}
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
            max_tokens: 1000,
        });

        const responseText = response.choices[0].message.content;
        let actionData;
        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
            if (!jsonMatch) {
                responseData = { result: responseText };
                break;
            }
            const jsonString = jsonMatch[1] || jsonMatch[2];
            actionData = JSON.parse(jsonString);
        } catch (e) {
            responseData = { result: responseText };
            break;
        }

        if (actionData && actionData.action === 'CREATE_PROJECT') {
            const { project_details } = actionData;
            if (!project_details || !project_details.name) {
                responseData = { result: "To create a project, I need at least a name." };
                break;
            }

            const { data: newProject, error: projectInsertError } = await supabaseAdmin
                .from('projects')
                .insert({
                    name: project_details.name,
                    description: project_details.description,
                    start_date: project_details.start_date,
                    due_date: project_details.due_date,
                    venue: project_details.venue,
                    budget: project_details.budget,
                    created_by: user.id,
                    status: 'Requested',
                })
                .select()
                .single();

            if (projectInsertError) {
                responseData = { result: `I tried to create the project, but failed. The database said: ${projectInsertError.message}` };
                break;
            }

            const newProjectId = newProject.id;
            let followUpMessages = [];

            if (project_details.services && project_details.services.length > 0) {
                const servicesToInsert = project_details.services.map(serviceTitle => ({
                    project_id: newProjectId,
                    service_title: serviceTitle,
                }));
                const { error: servicesError } = await supabaseAdmin.from('project_services').insert(servicesToInsert);
                if (servicesError) followUpMessages.push("I couldn't add the services due to an error.");
                else followUpMessages.push(`I've added ${project_details.services.length} services.`);
            }

            if (project_details.members && project_details.members.length > 0) {
                const memberIdsToAssign = userList
                    .filter(u => project_details.members.some(name => u.name.toLowerCase() === name.toLowerCase()))
                    .map(u => u.id);
                
                if (memberIdsToAssign.length > 0) {
                    const membersToInsert = memberIdsToAssign.map(userId => ({
                        project_id: newProjectId,
                        user_id: userId,
                        role: 'member',
                    }));
                    const { error: membersError } = await supabaseAdmin.from('project_members').insert(membersToInsert);
                    if (membersError) followUpMessages.push("I couldn't add the team members due to an error.");
                    else followUpMessages.push(`I've assigned ${project_details.members.join(', ')} to the project.`);
                } else {
                    followUpMessages.push(`I couldn't find the users ${project_details.members.join(', ')} to assign.`);
                }
            }

            let finalMessage = `Done! I've created the project "${newProject.name}".`;
            if (followUpMessages.length > 0) {
                finalMessage += " " + followUpMessages.join(' ');
            }
            responseData = { result: finalMessage };

        } else if (actionData && actionData.action === 'UPDATE_PROJECT') {
            const { project_name, updates } = actionData;
            
            const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                responseData = { result: `I couldn't find a project named "${project_name}". Please be more specific.` };
                break;
            }

            const rpcParams = {
                p_project_id: project.id,
                p_name: updates.name !== undefined ? updates.name : project.name,
                p_description: updates.description !== undefined ? updates.description : (project.description || null),
                p_category: updates.category !== undefined ? updates.category : (project.category || null),
                p_status: updates.status !== undefined ? updates.status : project.status,
                p_budget: updates.budget !== undefined ? updates.budget : (project.budget || null),
                p_start_date: updates.start_date !== undefined ? updates.start_date : (project.start_date || null),
                p_due_date: updates.due_date !== undefined ? updates.due_date : (project.due_date || null),
                p_payment_status: updates.payment_status !== undefined ? updates.payment_status : project.payment_status,
                p_payment_due_date: updates.payment_due_date !== undefined ? updates.payment_due_date : (project.payment_due_date || null),
                p_venue: updates.venue !== undefined ? updates.venue : (project.venue || null),
                p_member_ids: project.assignedTo.map(m => m.id),
                p_service_titles: project.services || [],
            };

            // Handle members
            let currentMemberIds = new Set(project.assignedTo.map(m => m.id));
            if (updates.add_members) {
                updates.add_members.forEach(name => {
                    const userToAdd = userList.find(u => u.name.toLowerCase() === name.toLowerCase());
                    if (userToAdd) currentMemberIds.add(userToAdd.id);
                });
            }
            if (updates.remove_members) {
                updates.remove_members.forEach(name => {
                    const userToRemove = userList.find(u => u.name.toLowerCase() === name.toLowerCase());
                    if (userToRemove) currentMemberIds.delete(userToRemove.id);
                });
            }
            rpcParams.p_member_ids = Array.from(currentMemberIds);

            // Handle services
            let currentServices = new Set(project.services || []);
            if (updates.add_services) {
                updates.add_services.forEach(service => currentServices.add(service));
            }
            if (updates.remove_services) {
                updates.remove_services.forEach(service => currentServices.delete(service));
            }
            rpcParams.p_service_titles = Array.from(currentServices);

            const { error: updateError } = await supabaseAdmin.rpc('update_project_details', rpcParams);

            if (updateError) {
                responseData = { result: `I tried to update the project, but failed. The database said: ${updateError.message}` };
            } else {
                const changes = [];
                for (const [key, value] of Object.entries(updates)) {
                    switch (key) {
                        case 'name': changes.push(`renamed it to "${value}"`); break;
                        case 'description': changes.push(`updated the description`); break;
                        case 'status': changes.push(`changed the status to "${value}"`); break;
                        case 'payment_status': changes.push(`updated the payment status to "${value}"`); break;
                        case 'budget': changes.push(`set the budget to a new value`); break;
                        case 'start_date': changes.push(`set the start date to ${new Date(value).toLocaleDateString('en-CA')}`); break;
                        case 'due_date': changes.push(`set the due date to ${new Date(value).toLocaleDateString('en-CA')}`); break;
                        case 'venue': changes.push(`set the venue to "${value}"`); break;
                        case 'add_members': changes.push(`added ${value.join(', ')} to the team`); break;
                        case 'remove_members': changes.push(`removed ${value.join(', ')} from the team`); break;
                        case 'add_services': changes.push(`added the services: ${value.join(', ')}`); break;
                        case 'remove_services': changes.push(`removed the services: ${value.join(', ')}`); break;
                    }
                }
                if (changes.length > 0) {
                    const changesString = changes.join(' and ');
                    responseData = { result: `Done! For the project "${project.name}", I've ${changesString}.` };
                } else {
                    responseData = { result: `Done! I've updated the project "${project.name}".` };
                }
            }

        } else if (actionData && actionData.action === 'CREATE_TASK') {
            const { project_name, task_title, assignees } = actionData;
            const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                responseData = { result: `I couldn't find a project named "${project_name}" to add the task to.` };
                break;
            }

            const { data: newTask, error: taskError } = await supabaseAdmin.from('tasks').insert({
                project_id: project.id,
                title: task_title,
                created_by: user.id,
            }).select().single();

            if (taskError) {
                responseData = { result: `I tried to create the task, but failed. The database said: ${taskError.message}` };
                break;
            }

            let assignmentMessage = "";
            if (assignees && assignees.length > 0) {
                const userIdsToAssign = userList
                    .filter(u => assignees.some(name => u.name.toLowerCase() === name.toLowerCase()))
                    .map(u => u.id);
                
                if (userIdsToAssign.length > 0) {
                    const newAssignees = userIdsToAssign.map(uid => ({ task_id: newTask.id, user_id: uid }));
                    const { error: assignError } = await supabaseAdmin.from('task_assignees').insert(newAssignees);
                    if (assignError) {
                        assignmentMessage = ` I created the task, but couldn't assign it due to an error: ${assignError.message}`;
                    } else {
                        assignmentMessage = ` and assigned it to ${assignees.join(', ')}`;
                    }
                } else {
                    assignmentMessage = ` but I couldn't find the user(s) ${assignees.join(', ')} to assign.`;
                }
            }

            responseData = { result: `OK, I've added the task "${task_title}" to the project "${project.name}"${assignmentMessage}.` };

        } else if (actionData && (actionData.action === 'ASSIGN_TASK' || actionData.action === 'UNASSIGN_TASK')) {
            const { project_name, task_title, assignees } = actionData;
            if (!project_name || !task_title || !assignees || assignees.length === 0) {
                responseData = { result: "To assign a task, I need the project name, task title, and at least one user." };
                break;
            }

            const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                responseData = { result: `I couldn't find a project named "${project_name}".` };
                break;
            }

            const task = project.tasks.find(t => t.title.toLowerCase() === task_title.toLowerCase());
            if (!task) {
                responseData = { result: `I couldn't find a task named "${task_title}" in the project "${project.name}".` };
                break;
            }

            const userIdsToModify = userList
                .filter(u => assignees.some(name => u.name.toLowerCase() === name.toLowerCase()))
                .map(u => u.id);

            if (userIdsToModify.length === 0) {
                responseData = { result: `I couldn't find any of the users you mentioned: ${assignees.join(', ')}.` };
                break;
            }

            if (actionData.action === 'ASSIGN_TASK') {
                const newAssignees = userIdsToModify.map(uid => ({ task_id: task.id, user_id: uid }));
                const { error: assignError } = await supabaseAdmin.from('task_assignees').insert(newAssignees);
                if (assignError) {
                    responseData = { result: `I tried to assign the task, but failed: ${assignError.message}` };
                } else {
                    responseData = { result: `Done! I've assigned ${assignees.join(', ')} to the task "${task.title}".` };
                }
            } else { // UNASSIGN_TASK
                const { error: unassignError } = await supabaseAdmin.from('task_assignees').delete().eq('task_id', task.id).in('user_id', userIdsToModify);
                if (unassignError) {
                    responseData = { result: `I tried to unassign from the task, but failed: ${unassignError.message}` };
                } else {
                    responseData = { result: `Done! I've unassigned ${assignees.join(', ')} from the task "${task.title}".` };
                }
            }

        } else if (actionData && actionData.action === 'CREATE_GOAL') {
            const { goal_details } = actionData;
            if (!goal_details || !goal_details.title) {
                responseData = { result: "To create a goal, I need at least a title." };
                break;
            }

            const rpcParams = {
                p_title: goal_details.title,
                p_description: goal_details.description || null,
                p_icon: goal_details.icon || 'Target',
                p_color: goal_details.color || '#3366FF',
                p_type: goal_details.type || 'frequency',
                p_frequency: goal_details.frequency || null,
                p_specific_days: goal_details.specific_days || null,
                p_target_quantity: goal_details.target_quantity ?? null,
                p_target_period: goal_details.target_period || null,
                p_target_value: goal_details.target_value ?? null,
                p_unit: goal_details.unit || null,
                p_existing_tags: [],
                p_custom_tags: goal_details.tags || [],
            };

            const { data: newGoal, error: rpcError } = await userSupabase
                .rpc('create_goal_and_link_tags', rpcParams)
                .single();

            if (rpcError) {
                responseData = { result: `I tried to create the goal, but failed. The database said: ${rpcError.message}` };
            } else {
                responseData = { result: `Done! I've created the new goal: "${newGoal.title}".` };
            }

        } else if (actionData && actionData.action === 'UPDATE_GOAL') {
            const { goal_title, updates } = actionData;
            const goal = goals.find(g => g.title.toLowerCase() === goal_title.toLowerCase());
            if (!goal) {
                responseData = { result: `I couldn't find a goal named "${goal_title}".` };
                break;
            }

            const { data: existingTags } = await supabaseAdmin.from('tags').select('id, name').or(`user_id.eq.${user.id},user_id.is.null`);
            const existingTagMap = new Map(existingTags.map(t => [t.name.toLowerCase(), t.id]));
            
            let currentTagIds = new Set(goal.tags.map(t => t.id));
            let newCustomTags = [];

            if (updates.add_tags) {
                updates.add_tags.forEach(tagName => {
                    const existingId = existingTagMap.get(tagName.toLowerCase());
                    if (existingId) {
                        currentTagIds.add(existingId);
                    } else {
                        newCustomTags.push({ name: tagName, color: '#CCCCCC' }); // Default color
                    }
                });
            }
            if (updates.remove_tags) {
                updates.remove_tags.forEach(tagName => {
                    const tagToRemove = goal.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (tagToRemove) {
                        currentTagIds.delete(tagToRemove.id);
                    }
                });
            }

            const { error: updateError } = await userSupabase
                .rpc('update_goal_with_tags', {
                    p_goal_id: goal.id,
                    p_title: updates.title,
                    p_description: updates.description,
                    p_icon: updates.icon,
                    p_color: updates.color,
                    p_type: updates.type,
                    p_frequency: updates.frequency,
                    p_specific_days: updates.specific_days,
                    p_target_quantity: updates.target_quantity,
                    p_target_period: updates.target_period,
                    p_target_value: updates.target_value,
                    p_unit: updates.unit,
                    p_tags: Array.from(currentTagIds),
                    p_custom_tags: newCustomTags,
                });

            if (updateError) {
                responseData = { result: `I tried to update the goal, but failed: ${updateError.message}` };
            } else {
                responseData = { result: `Done! I've updated the goal "${goal.title}".` };
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
      case 'generate-mood-insight': {
        const { prompt, userName } = payload;
        if (!prompt) {
          throw new Error("Prompt is required for generating mood insights.");
        }

        const systemPrompt = `Anda adalah seorang teman AI yang suportif dan berwawasan luas. Tujuan Anda adalah memberikan saran yang memotivasi dan dapat ditindaklanjuti kepada pengguna berdasarkan ringkasan suasana hati mereka. Anda akan diberikan ringkasan suasana hati pengguna. Analisis informasi ini dan berikan wawasan singkat (2-3 kalimat) yang bermanfaat dalam format markdown. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka. Selalu berikan respons dalam Bahasa Indonesia.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
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