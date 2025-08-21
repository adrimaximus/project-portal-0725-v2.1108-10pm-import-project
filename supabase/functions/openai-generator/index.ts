// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function executeAction(actionData, context) {
    const { userSupabase, user, projects, users, goals, kbArticles, allTags } = context;

    switch (actionData.action) {
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
        case 'CREATE_KB_ARTICLE': {
            const { title, content, tags } = actionData.article_details;
            if (!title || !content) return "I need a title and content to create a knowledge base article.";

            const tagNames = tags || [];
            const existingTagIds = allTags.filter(t => tagNames.includes(t.name)).map(t => t.id);
            const newTags = tagNames
                .filter(name => !allTags.some(t => t.name.toLowerCase() === name.toLowerCase()))
                .map(name => ({ name, color: '#cccccc' })); // Default color for new tags

            const { data: newArticle, error } = await userSupabase.rpc('upsert_article_with_tags', {
                p_id: null,
                p_title: title,
                p_content: content,
                p_cover_image_url: null,
                p_author_id: user.id,
                p_existing_tag_ids: existingTagIds,
                p_custom_tags: newTags,
            }).single();

            if (error) return `I failed to create the article. The database said: ${error.message}`;
            return `Done! I've created the knowledge base article "${newArticle.title}". You can view it at /knowledge-base/${newArticle.slug}`;
        }
        case 'UPDATE_KB_ARTICLE': {
            const { article_title, updates } = actionData;
            if (!article_title || !updates) return "I need the title of the article and the updates to apply.";

            const article = kbArticles.find(a => a.title.toLowerCase() === article_title.toLowerCase());
            if (!article) return `I couldn't find an article named "${article_title}".`;

            const { data: fullArticle, error: fetchError } = await userSupabase
                .from('kb_articles')
                .select('*, kb_article_tags(tags(*))')
                .eq('id', article.id)
                .single();
            
            if (fetchError) return `I found the article, but couldn't fetch its details to update it. Error: ${fetchError.message}`;

            const currentTagNames = new Set(fullArticle.kb_article_tags.map(t => t.tags.name));
            
            if (updates.add_tags) {
                updates.add_tags.forEach(tagName => currentTagNames.add(tagName));
            }
            if (updates.remove_tags) {
                updates.remove_tags.forEach(tagName => currentTagNames.delete(tagName));
            }

            const finalTagNames = Array.from(currentTagNames);
            const existingTagIds = allTags.filter(t => finalTagNames.includes(t.name)).map(t => t.id);
            const newTags = finalTagNames
                .filter(name => !allTags.some(t => t.name.toLowerCase() === name.toLowerCase()))
                .map(name => ({ name, color: '#cccccc' }));

            const { data: updatedArticle, error: updateError } = await userSupabase.rpc('upsert_article_with_tags', {
                p_id: article.id,
                p_title: updates.title || fullArticle.title,
                p_content: updates.content || fullArticle.content,
                p_cover_image_url: updates.cover_image_url || fullArticle.cover_image_url,
                p_author_id: user.id,
                p_existing_tag_ids: existingTagIds,
                p_custom_tags: newTags,
            }).single();

            if (updateError) return `I failed to update the article. The database said: ${updateError.message}`;
            return `Done! I've updated the article "${updatedArticle.title}". You can view it at /knowledge-base/${updatedArticle.slug}`;
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

        const { data: kbArticles, error: kbError } = await userSupabase
            .from('kb_articles')
            .select('id, title, slug, content, kb_article_tags(tags(name))');
        if (kbError) {
            throw new Error(`Failed to fetch knowledge base for context: ${kbError.message}`);
        }

        const { data: allTags, error: allTagsError } = await userSupabase
            .from('tags')
            .select('id, name');
        if (allTagsError) {
            throw new Error(`Failed to fetch tags for context: ${allTagsError.message}`);
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
        const summarizedKbArticles = kbArticles.map(a => ({
            title: a.title,
            content: a.content,
            tags: a.kb_article_tags.map(t => t.tags.name)
        }));

        const systemPrompt = `You are an expert project and goal management AI assistant. Your purpose is to execute actions for the user. You will receive a conversation history and context data.

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

8. CREATE_KB_ARTICLE:
{"action": "CREATE_KB_ARTICLE", "article_details": {"title": "<article title>", "content": "<HTML content>", "tags": ["<tag name 1>", "<tag name 2>"]}}
- 'content' must be valid HTML.

9. UPDATE_KB_ARTICLE:
{"action": "UPDATE_KB_ARTICLE", "article_title": "<title of article to update>", "updates": {"title": "<new title>", "content": "<new HTML content>", "add_tags": ["<tag to add>"], "remove_tags": ["<tag to remove>"]}}
- When asked to update an article's content (e.g., "add a paragraph about X to article Y"), you MUST use the existing content provided in the 'Available Knowledge Base Articles' context.
- Modify this existing HTML content with the user's requested changes.
- Provide the FULL, MODIFIED HTML content in the 'updates.content' field. Do not just provide the fragment to be added or a description of the change.

CONTEXT:
- Available Projects (with their tasks and tags): ${JSON.stringify(summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(userList, null, 2)}
- Available Services: ${JSON.stringify(serviceList, null, 2)}
- Available Icons: ${JSON.stringify(iconList, null, 2)}
- Available Knowledge Base Articles: ${JSON.stringify(summarizedKbArticles, null, 2)}
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

            const actionResult = await executeAction(actionData, { userSupabase, user, projects, users, goals, kbArticles, allTags });
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