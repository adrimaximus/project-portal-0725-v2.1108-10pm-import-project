// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function executeAction(actionData, context) {
    const { userSupabase, user, projects, users, goals, allTags, articles, folders } = context;

    switch (actionData.action) {
        case 'CREATE_PROJECT': {
            const { name, description, start_date, due_date, venue, budget, services, members } = actionData.project_details;
            if (!name) return "I need a name to create a project.";

            const { data: newProject, error: projectError } = await userSupabase.from('projects').insert({
                name,
                description,
                start_date,
                due_date,
                venue,
                budget,
                created_by: user.id,
            }).select().single();

            if (projectError) return `I failed to create the project. The database said: ${projectError.message}`;

            let followUpMessage = "";

            if (services && services.length > 0) {
                const servicesToInsert = services.map(service_title => ({ project_id: newProject.id, service_title }));
                const { error: serviceError } = await userSupabase.from('project_services').insert(servicesToInsert);
                if (serviceError) followUpMessage += ` but I couldn't add the services: ${serviceError.message}`;
            }

            if (members && members.length > 0) {
                const memberIds = users
                    .filter(u => members.some(name => `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === name.toLowerCase()))
                    .map(u => u.id);
                
                if (memberIds.length > 0) {
                    const membersToInsert = memberIds.map(user_id => ({ project_id: newProject.id, user_id, role: 'member' }));
                    const { error: memberError } = await userSupabase.from('project_members').insert(membersToInsert);
                    if (memberError) followUpMessage += ` but I couldn't add the members: ${memberError.message}`;
                } else {
                    followUpMessage += ` but I couldn't find the users to add as members.`;
                }
            }

            return `Done! I've created the project "${newProject.name}"${followUpMessage}. You can view it at /projects/${newProject.slug}`;
        }
        case 'UPDATE_PROJECT': {
            const { project_name, updates } = actionData;
            if (!project_name || !updates) return "I need the project name and the updates to apply.";

            let project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) return `I couldn't find a project named "${project_name}".`;

            const { data: fullProject, error: fetchError } = await userSupabase
                .rpc('get_project_by_slug', { p_slug: project.slug })
                .single();
            
            if (fetchError) return `I found the project, but couldn't fetch its details to update it. Error: ${fetchError.message}`;

            const p_member_ids = new Set(fullProject.assignedTo.map(m => m.id));
            if (updates.add_members) updates.add_members.forEach(name => {
                const userToAdd = users.find(u => `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === name.toLowerCase());
                if (userToAdd) p_member_ids.add(userToAdd.id);
            });
            if (updates.remove_members) updates.remove_members.forEach(name => {
                const userToRemove = users.find(u => `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === name.toLowerCase());
                if (userToRemove) p_member_ids.delete(userToRemove.id);
            });

            const p_service_titles = new Set(fullProject.services || []);
            if (updates.add_services) updates.add_services.forEach(title => p_service_titles.add(title));
            if (updates.remove_services) updates.remove_services.forEach(title => p_service_titles.delete(title));

            const p_existing_tags = new Set((fullProject.tags || []).map(t => t.id));
            const p_custom_tags = [];
            if (updates.add_tags) {
                updates.add_tags.forEach(tagName => {
                    const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (existingTag) p_existing_tags.add(existingTag.id);
                    else p_custom_tags.push({ name: tagName, color: '#cccccc' });
                });
            }
            if (updates.remove_tags) {
                updates.remove_tags.forEach(tagName => {
                    const tagToRemove = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (tagToRemove) p_existing_tags.delete(tagToRemove.id);
                });
            }

            const { data: updatedProject, error: updateError } = await userSupabase.rpc('update_project_details', {
                p_project_id: project.id,
                p_name: updates.name || fullProject.name,
                p_description: updates.description || fullProject.description,
                p_category: updates.category || fullProject.category,
                p_status: updates.status || fullProject.status,
                p_budget: updates.budget || fullProject.budget,
                p_start_date: updates.start_date || fullProject.start_date,
                p_due_date: updates.due_date || fullProject.due_date,
                p_payment_status: updates.payment_status || fullProject.payment_status,
                p_payment_due_date: updates.payment_due_date || fullProject.payment_due_date,
                p_venue: updates.venue || fullProject.venue,
                p_member_ids: Array.from(p_member_ids),
                p_service_titles: Array.from(p_service_titles),
                p_existing_tags: Array.from(p_existing_tags),
                p_custom_tags: p_custom_tags,
            }).single();

            if (updateError) return `I failed to update the project. The database said: ${updateError.message}`;
            return `Done! I've updated the project "${updatedProject.name}".`;
        }
        case 'CREATE_TASK': {
            const { project_name, task_title, assignees } = actionData;
            
            let project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) {
                const possibleMatches = projects.filter(p => p.name.toLowerCase().includes(project_name.toLowerCase()));
                if (possibleMatches.length === 1) project = possibleMatches[0];
                else if (possibleMatches.length > 1) return `I found multiple projects matching "${project_name}". Please be more specific.`;
            }
            if (!project) return `I couldn't find a project named "${project_name}".`;

            const { data: newTask, error: taskError } = await userSupabase.from('tasks').insert({
                project_id: project.id,
                title: task_title,
                created_by: user.id,
            }).select().single();

            if (taskError) return `I failed to create the task. The database said: ${taskError.message}`;

            let assignmentMessage = "";
            if (assignees && assignees.length > 0) {
                const userIdsToAssign = users
                    .filter(u => assignees.some(name => `${u.first_name} ${u.last_name}`.toLowerCase() === name.toLowerCase() || u.email.toLowerCase() === name.toLowerCase()))
                    .map(u => u.id);
                
                if (userIdsToAssign.length > 0) {
                    const newAssignees = userIdsToAssign.map(uid => ({ task_id: newTask.id, user_id: uid }));
                    const { error: assignError } = await userSupabase.from('task_assignees').insert(newAssignees);
                    if (assignError) assignmentMessage = ` but couldn't assign it: ${assignError.message}`;
                    else assignmentMessage = ` and assigned it to ${assignees.join(', ')}`;
                } else {
                    assignmentMessage = ` but couldn't find the user(s) to assign.`;
                }
            }
            return `Done! I've added the task "${task_title}" to "${project.name}"${assignmentMessage}.`;
        }
        case 'CREATE_GOAL': {
            const { title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, tags } = actionData.goal_details;
            if (!title) return "I need a title to create a goal.";

            const existingTagIds = (tags || [])
                .map(tag => allTags.find(t => t.name.toLowerCase() === tag.name.toLowerCase())?.id)
                .filter(Boolean);
            const customTags = (tags || [])
                .filter(tag => !allTags.some(t => t.name.toLowerCase() === tag.name.toLowerCase()));

            const { data: newGoal, error } = await userSupabase.rpc('create_goal_and_link_tags', {
                p_title: title,
                p_description: description || null,
                p_icon: icon || 'Target',
                p_color: color || '#cccccc',
                p_type: type || 'frequency',
                p_frequency: frequency || null,
                p_specific_days: specific_days || null,
                p_target_quantity: target_quantity || null,
                p_target_period: target_period || null,
                p_target_value: target_value || null,
                p_unit: unit || null,
                p_existing_tags: existingTagIds,
                p_custom_tags: customTags,
            }).single();

            if (error) return `I failed to create the goal. The database said: ${error.message}`;
            return `Done! I've created the goal "${newGoal.title}". You can view it at /goals/${newGoal.slug}`;
        }
        case 'UPDATE_GOAL': {
            const { goal_title, updates } = actionData;
            if (!goal_title || !updates) return "I need the goal title and the updates to apply.";

            const goal = goals.find(g => g.title.toLowerCase() === goal_title.toLowerCase());
            if (!goal) return `I couldn't find a goal named "${goal_title}".`;

            const p_tags = new Set(goal.tags.map(t => t.id));
            const p_custom_tags = [];
            if (updates.add_tags) {
                updates.add_tags.forEach(tagName => {
                    const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (existingTag) p_tags.add(existingTag.id);
                    else p_custom_tags.push({ name: tagName, color: '#cccccc' });
                });
            }
            if (updates.remove_tags) {
                updates.remove_tags.forEach(tagName => {
                    const tagToRemove = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                    if (tagToRemove) p_tags.delete(tagToRemove.id);
                });
            }

            const { data: updatedGoal, error } = await userSupabase.rpc('update_goal_with_tags', {
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
                p_tags: Array.from(p_tags),
                p_custom_tags: p_custom_tags,
            }).single();

            if (error) return `I failed to update the goal. The database said: ${error.message}`;
            return `Done! I've updated the goal "${updatedGoal.title}".`;
        }
        case 'CREATE_ARTICLE': {
            const { title, content, folder_name, header_image_search_query } = actionData.article_details;
            if (!title) return "I need a title to create an article.";

            let folder_id;
            const targetFolderName = folder_name || 'Uncategorized';
            let folder = folders.find(f => f.name.toLowerCase() === targetFolderName.toLowerCase());

            if (!folder) {
                const { data: newFolder, error: folderError } = await userSupabase
                    .from('kb_folders')
                    .insert({ name: targetFolderName, user_id: user.id, icon: 'Archive', color: '#9ca3af' })
                    .select('id')
                    .single();
                if (folderError) return `I couldn't create a new folder for the article. The database said: ${folderError.message}`;
                folder_id = newFolder.id;
            } else {
                folder_id = folder.id;
            }

            let header_image_url = null;
            if (header_image_search_query) {
                const pexelsApiKey = Deno.env.get('VITE_PEXELS_API_KEY');
                if (pexelsApiKey) {
                    const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(header_image_search_query)}&per_page=1`, {
                        headers: { Authorization: pexelsApiKey }
                    });
                    if (pexelsResponse.ok) {
                        const pexelsData = await pexelsResponse.json();
                        header_image_url = pexelsData.photos?.[0]?.src?.large2x;
                    }
                }
            }

            const { data: newArticle, error: articleError } = await userSupabase.from('kb_articles').insert({
                title,
                content: { html: content || '<p></p>' },
                folder_id,
                user_id: user.id,
                header_image_url: header_image_url,
            }).select('slug').single();

            if (articleError) return `I failed to create the article. The database said: ${articleError.message}`;
            return `Done! I've created the article "${title}". You can view it at /knowledge-base/articles/${newArticle.slug}`;
        }
        case 'UPDATE_ARTICLE': {
            const { article_title, updates } = actionData;
            if (!article_title || !updates) return "I need the article title and the updates to apply.";

            const { data: article, error: findError } = await userSupabase.from('kb_articles').select('id, content, folder_id').ilike('title', `%${article_title}%`).single();
            if (findError || !article) return `I couldn't find an article named "${article_title}".`;

            const updatePayload = {};
            if (updates.title) updatePayload.title = updates.title;
            if (updates.content) updatePayload.content = { html: updates.content };
            
            if (updates.header_image_search_query) {
                const pexelsApiKey = Deno.env.get('VITE_PEXELS_API_KEY');
                if (!pexelsApiKey) return "The Pexels API key is not configured on the server.";
                
                const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(updates.header_image_search_query)}&per_page=1`, {
                    headers: { Authorization: pexelsApiKey }
                });
                if (pexelsResponse.ok) {
                    const pexelsData = await pexelsResponse.json();
                    const imageUrl = pexelsData.photos?.[0]?.src?.large2x;
                    if (imageUrl) {
                        updatePayload.header_image_url = imageUrl;
                    }
                }
            }
            
            if (updates.folder_name) {
                let folder = folders.find(f => f.name.toLowerCase() === updates.folder_name.toLowerCase());
                if (!folder) {
                    const { data: newFolder, error: folderError } = await userSupabase
                        .from('kb_folders')
                        .insert({ name: updates.folder_name, user_id: user.id, icon: 'Folder', color: '#6b7280' })
                        .select('id')
                        .single();
                    if (folderError) return `I couldn't find or create the new folder. The database said: ${folderError.message}`;
                    updatePayload.folder_id = newFolder.id;
                } else {
                    updatePayload.folder_id = folder.id;
                }
            }

            const { error: updateError } = await userSupabase.from('kb_articles').update(updatePayload).eq('id', article.id);
            if (updateError) return `I failed to update the article. The database said: ${updateError.message}`;
            return `Done! I've updated the article "${updates.title || article_title}".`;
        }
        case 'INSERT_IMAGE_INTO_ARTICLE': {
            const { article_title, image_url } = actionData;
            if (!article_title || !image_url) return "I need the article title and the image URL.";

            const { data: article, error: findError } = await userSupabase.from('kb_articles').select('id, content').ilike('title', `%${article_title}%`).single();
            if (findError || !article) return `I couldn't find an article named "${article_title}".`;

            const currentContent = article.content?.html || '';
            const newContent = `${currentContent}<p><img src="${image_url}" alt="Image inserted by AI"></p>`;

            const { error: updateError } = await userSupabase.from('kb_articles').update({ content: { html: newContent } }).eq('id', article.id);
            if (updateError) return `I failed to insert the image. The database said: ${updateError.message}`;
            return `Done! I've added the image to the article "${article_title}".`;
        }
        case 'DELETE_ARTICLE': {
            const { article_title } = actionData;
            if (!article_title) return "I need the title of the article to delete.";

            const { data: article, error: findError } = await userSupabase.from('kb_articles').select('id').ilike('title', `%${article_title}%`).single();
            if (findError || !article) return `I couldn't find an article named "${article_title}".`;

            const { error: deleteError } = await userSupabase.from('kb_articles').delete().eq('id', article.id);
            if (deleteError) return `I failed to delete the article. The database said: ${deleteError.message}`;
            return `Done! I've deleted the article "${article_title}".`;
        }
        default:
            return "I'm not sure how to perform that action. Can you clarify?";
    }
}

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
      case 'suggest-icon': {
        const { title, icons } = payload;
        if (!title || !icons || !Array.isArray(icons)) {
          throw new Error("Title and a list of icons are required.");
        }

        const systemPrompt = `You are an AI assistant that suggests the best icon for a given title from a list. Your response must be ONLY the name of the icon from the list provided, with no extra text, explanation, or punctuation.`;
        const userPrompt = `Title: "${title}"\n\nIcons: [${icons.join(', ')}]`;

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0,
          max_tokens: 20,
        });

        responseData = { result: response.choices[0].message.content?.trim() };
        break;
      }
      case 'generate-caption': {
        const { altText } = payload;
        if (!altText) {
          throw new Error("altText is required for generating a caption.");
        }

        const systemPrompt = `You are an AI that generates a short, inspiring, one-line caption for an image. The caption should be suitable for a professional dashboard related to events, marketing, and project management. Respond with ONLY the caption, no extra text or quotes. Keep it under 12 words.`;
        const userPrompt = `Generate a caption for an image described as: "${altText}"`;

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 30,
        });

        const caption = response.choices[0].message.content?.trim().replace(/"/g, '');
        responseData = { caption };
        break;
      }
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

        const { data: allTags, error: allTagsError } = await userSupabase
            .from('tags')
            .select('id, name');
        if (allTagsError) {
            throw new Error(`Failed to fetch tags for context: ${allTagsError.message}`);
        }

        const { data: articles, error: articlesError } = await userSupabase.from('kb_articles').select('id, title, slug, folder_id');
        if (articlesError) {
          throw new Error(`Failed to fetch articles for context: ${articlesError.message}`);
        }

        const { data: folders, error: foldersError } = await userSupabase.from('kb_folders').select('id, name');
        if (foldersError) {
          throw new Error(`Failed to fetch folders for context: ${foldersError.message}`);
        }

        const summarizedProjects = projects.map(p => ({
            name: p.name,
            status: p.status,
            tags: (p.tags || []).map(t => t.name),
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
        const summarizedArticles = articles.map(a => ({ title: a.title, folder: folders.find(f => f.id === a.folder_id)?.name }));
        const summarizedFolders = folders.map(f => f.name);
        
        const systemPrompt = `You are an expert project and goal management AI assistant. Your purpose is to execute actions for the user. You will receive a conversation history and context data.

**Critical Rules of Operation:**
1.  **ACTION-ORIENTED:** Your primary function is to identify and execute actions based on the user's request.
2.  **TASK CREATION WORKFLOW (SPECIAL CASE):**
    a.  When a user asks to create a task, your FIRST response MUST be a natural language recommendation. Example: "Sure, I can create the task 'Design new logo' in the 'Brand Refresh' project. Should I proceed?"
    b.  If the user's NEXT message is a confirmation (e.g., "yes", "ok, do it", "proceed"), your response MUST be ONLY the \`CREATE_TASK\` action JSON. Do not add any other text.
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

8. CREATE_ARTICLE:
{"action": "CREATE_ARTICLE", "article_details": {"title": "<article title>", "content": "<HTML content>", "folder_name": "<optional folder name>", "header_image_search_query": "<optional image search query>"}}
- If folder_name is not provided, it will be placed in "Uncategorized".
- If 'header_image_search_query' is provided, I will find an image on Pexels and set it as the article's header image.

9. UPDATE_ARTICLE:
{"action": "UPDATE_ARTICLE", "article_title": "<title of article to update>", "updates": {"title": "<new title>", "content": "<new HTML content>", "folder_name": "<new folder name>", "header_image_search_query": "<optional image search query>"}}
- 'content' will replace the existing content. To append, first get the existing content and then provide the full new content.
- Use 'header_image_search_query' to find and set a new header image for the article.

10. DELETE_ARTICLE:
{"action": "DELETE_ARTICLE", "article_title": "<title of article to delete>"}

CONTEXT:
- Available Projects (with their tasks and tags): ${JSON.stringify(summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
- Available Services: ${JSON.stringify(serviceList, null, 2)}
- Available Icons: ${JSON.stringify(iconList, null, 2)}
- Available Articles: ${JSON.stringify(summarizedArticles, null, 2)}
- Available Folders: ${JSON.stringify(summarizedFolders, null, 2)}
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
        
        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
            if (!jsonMatch) {
                responseData = { result: responseText };
                break;
            }
            const jsonString = jsonMatch[1] || jsonMatch[2];
            const actionData = JSON.parse(jsonString);

            const actionResult = await executeAction(actionData, { userSupabase, user, projects, users, goals, allTags, articles, folders });
            responseData = { result: actionResult };

        } catch (e) {
            responseData = { result: responseText };
        }
        break;
      }
      case 'generate-insight': {
        const { goal, context } = payload;
        if (!goal || !context) {
          throw new Error("Goal and context are required for generating insights.");
        }

        const owner = goal.collaborators.find(c => c.id === goal.user_id);
        const otherCollaborators = goal.collaborators.filter(c => c.id !== goal.user_id);

        const modifiedGoal = {
          ...goal,
          owner: owner,
          collaborators: otherCollaborators,
        };
        delete modifiedGoal.user_id;

        const systemPrompt = `Anda adalah seorang pelatih AI yang suportif dan berwawasan luas. Tujuan Anda adalah memberikan saran yang memotivasi dan dapat ditindaklanjuti kepada pengguna berdasarkan kemajuan mereka. Analisis detail tujuan berikut: judul, deskripsi, tipe, tag, pemilik (owner), kolaborator lain (collaborators), dan kemajuan terbaru. Berdasarkan analisis holistik ini, berikan wawasan singkat yang bermanfaat dalam format markdown.

- Pertahankan nada yang positif dan memotivasi.
- Sapa pengguna secara langsung. Jika ada pemilik (owner), sapa mereka sebagai pemilik tujuan.
- Jika ada kolaborator lain, Anda bisa menyebutkan mereka dalam konteks kolaborasi.
- Jika kemajuan baik, berikan pujian dan sarankan cara untuk mempertahankan momentum.
- Jika kemajuan tertinggal, berikan semangat, bukan kritik. Sarankan langkah-langkah kecil yang dapat dikelola untuk kembali ke jalur yang benar.
- Jaga agar respons tetap ringkas (2-4 kalimat).
- Jangan mengulangi data kembali kepada pengguna; interpretasikan data tersebut.
- PENTING: Selalu berikan respons dalam Bahasa Indonesia.`;

        const userPrompt = `Berikut adalah tujuan saya dan kemajuan terbaru saya. Tolong berikan saya beberapa saran pembinaan.
Tujuan: ${JSON.stringify(modifiedGoal, null, 2)}
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
        const { prompt, userName, conversationHistory } = payload;
        if (!prompt) {
          throw new Error("Prompt is required for generating mood insights.");
        }

        const systemPrompt = `Anda adalah seorang teman AI yang suportif, empatik, dan berwawasan luas. Tujuan Anda adalah untuk terlibat dalam percakapan yang mendukung dengan pengguna tentang suasana hati dan perasaan mereka. Anda akan menerima riwayat percakapan. Tugas Anda adalah memberikan respons berikutnya dalam percakapan tersebut. Pertahankan nada yang positif dan memotivasi. Sapa pengguna dengan nama mereka jika ini adalah awal percakapan. Jaga agar respons tetap sangat ringkas, maksimal 2 kalimat, dan terasa seperti percakapan alami. Jangan mengulangi diri sendiri. Fokus percakapan ini adalah murni pada kesejahteraan emosional. Jangan membahas topik lain seperti proyek, tugas, atau tujuan kerja kecuali jika pengguna secara eksplisit mengungkitnya terlebih dahulu dalam konteks perasaan mereka. Selalu berikan respons dalam Bahasa Indonesia.`;

        const messages = [
          { role: "system", content: systemPrompt },
          ...(conversationHistory || []).map(msg => ({
            role: msg.sender === 'ai' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: prompt }
        ];
        
        if (messages.length > 2 && messages[messages.length-2].role === 'user' && messages[messages.length-2].content === prompt) {
          messages.splice(messages.length-2, 1);
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: messages,
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