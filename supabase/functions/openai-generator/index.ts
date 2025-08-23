// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.29.2';

// --- CORS HEADERS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- LIB: CLIENTS ---
const createSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

const createSupabaseUserClient = (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error("401: Missing Authorization header.");
  }
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
};

const getOpenAIClient = async (supabaseAdmin) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("400: OpenAI API key is not configured. Please ask an administrator to set it up in the integration settings.");
  }

  return new OpenAI({ apiKey: config.value });
};

// --- LIB: ACTION HELPERS ---
const findUserByNameOrEmail = async (context, nameOrEmail) => {
  const user = context.userList.find(u => u.name.toLowerCase() === nameOrEmail.toLowerCase() || u.email.toLowerCase() === nameOrEmail.toLowerCase());
  return user || null;
};

const findProjectByName = async (context, name) => {
  const project = context.projects.find(p => p.name.toLowerCase() === name.toLowerCase());
  return project || null;
};

const findGoalByTitle = async (context, title) => {
  const goal = context.goals.find(g => g.title.toLowerCase() === title.toLowerCase());
  return goal || null;
};

const findTagByName = async (context, name) => {
  const tag = context.allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
  return tag || null;
};

const findOrCreateFolder = async (supabaseAdmin, user, folderName) => {
  if (!folderName) folderName = 'Uncategorized';

  let { data: folder, error } = await supabaseAdmin
    .from('kb_folders')
    .select('id')
    .eq('name', folderName)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`500: Error finding folder: ${error.message}`);

  if (folder) {
    return folder.id;
  }

  const { data: newFolder, error: createError } = await supabaseAdmin
    .from('kb_folders')
    .insert({ name: folderName, user_id: user.id, slug: folderName.toLowerCase().replace(/\s+/g, '-') })
    .select('id')
    .single();

  if (createError) throw new Error(`500: Error creating folder: ${createError.message}`);
  return newFolder.id;
};

const getUnsplashImage = async (query) => {
  if (!query) return null;
  const accessKey = Deno.env.get('VITE_UNSPLASH_ACCESS_KEY');
  if (!accessKey) {
    console.warn("Unsplash API key not set. Skipping image search.");
    return null;
  }
  
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Unsplash API error:", await response.text());
      return null;
    }
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (e) {
    console.error("Error fetching from Unsplash:", e);
    return null;
  }
};

// --- LIB: ACTION EXECUTOR ---
async function executeAction(actionData, context) {
  const { supabaseAdmin, user } = context;
  const { action, ...details } = actionData;

  switch (action) {
    case 'CREATE_PROJECT': {
      const { name, description, start_date, due_date, venue, budget, services, members } = details.project_details;
      const memberIds = (await Promise.all((members || []).map(name => findUserByNameOrEmail(context, name))))
        .filter(Boolean).map(u => u.id);

      const { data: newProject, error } = await supabaseAdmin
        .from('projects')
        .insert({ name, description, start_date, due_date, venue, budget, created_by: user.id })
        .select('id, slug')
        .single();
      if (error) throw new Error(`500: Failed to create project: ${error.message}`);

      if (services && services.length > 0) {
        await supabaseAdmin.from('project_services').insert(services.map(s => ({ project_id: newProject.id, service_title: s })));
      }
      if (memberIds.length > 0) {
        await supabaseAdmin.from('project_members').insert(memberIds.map(id => ({ project_id: newProject.id, user_id: id })));
      }
      return `Done! I've created the project "${name}". You can view it at /projects/${newProject.slug}`;
    }

    case 'CREATE_TASK': {
      const { project_name, task_title, assignees } = details;
      const project = await findProjectByName(context, project_name);
      if (!project) return `I couldn't find a project named "${project_name}".`;

      const assigneeIds = (await Promise.all((assignees || []).map(name => findUserByNameOrEmail(context, name))))
        .filter(Boolean).map(u => u.id);

      const { data: newTask, error } = await supabaseAdmin
        .from('tasks')
        .insert({ project_id: project.id, title: task_title, created_by: user.id })
        .select('id')
        .single();
      if (error) throw new Error(`500: Failed to create task: ${error.message}`);

      if (assigneeIds.length > 0) {
        await supabaseAdmin.from('task_assignees').insert(assigneeIds.map(id => ({ task_id: newTask.id, user_id: id })));
      }
      return `Done! I've created the task "${task_title}" in the "${project_name}" project.`;
    }

    case 'CREATE_ARTICLE': {
      const { title, content, folder_name, header_image_search_query } = details.article_details;
      
      const header_image_url = await getUnsplashImage(header_image_search_query);
      const folder_id = await findOrCreateFolder(supabaseAdmin, user, folder_name);

      const { data: newArticle, error } = await supabaseAdmin
        .from('kb_articles')
        .insert({ title, content: { html: content }, folder_id, header_image_url, user_id: user.id })
        .select('slug')
        .single();

      if (error) throw new Error(`500: Failed to create article: ${error.message}`);
      
      return `Done! I've created the article "${title}". You can view it at /knowledge-base/pages/${newArticle.slug}`;
    }

    default:
      return `I'm sorry, I can't perform the action "${action}" yet. This feature is under development.`;
  }
}

// --- LIB: CONTEXT BUILDER ---
const buildContext = async (userSupabase, user) => {
  const [
    projectsRes,
    usersRes,
    goalsRes,
    allTagsRes,
    articlesRes,
    foldersRes
  ] = await Promise.all([
    userSupabase.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 }),
    userSupabase.from('profiles').select('id, first_name, last_name, email'),
    userSupabase.rpc('get_user_goals'),
    userSupabase.from('tags').select('id, name'),
    userSupabase.from('kb_articles').select('id, title, slug, folder_id'),
    userSupabase.from('kb_folders').select('id, name')
  ]);

  if (projectsRes.error) throw new Error(`500: Failed to fetch project data for analysis: ${projectsRes.error.message}`);
  if (usersRes.error) throw new Error(`500: Failed to fetch users for context: ${usersRes.error.message}`);
  if (goalsRes.error) throw new Error(`500: Failed to fetch goals for context: ${goalsRes.error.message}`);
  if (allTagsRes.error) throw new Error(`500: Failed to fetch tags for context: ${allTagsRes.error.message}`);
  if (articlesRes.error) throw new Error(`500: Failed to fetch articles for context: ${articlesRes.error.message}`);
  if (foldersRes.error) throw new Error(`500: Failed to fetch folders for context: ${foldersRes.error.message}`);

  const summarizedProjects = projectsRes.data.map(p => ({
      name: p.name,
      status: p.status,
      tags: (p.tags || []).map(t => t.name),
      tasks: (p.tasks || []).map(t => ({
          title: t.title,
          completed: t.completed,
          assignedTo: (t.assignedTo || []).map(a => a.name)
      }))
  }));
  const summarizedGoals = goalsRes.data.map(g => ({
      title: g.title,
      type: g.type,
      progress: g.completions ? g.completions.length : 0,
      tags: g.tags ? g.tags.map(t => t.name) : []
  }));
  const userList = usersRes.data.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email, email: u.email }));
  const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
  const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];
  const summarizedArticles = articlesRes.data.map(a => ({ title: a.title, folder: foldersRes.data.find(f => f.id === a.folder_id)?.name }));
  const summarizedFolders = foldersRes.data.map(f => f.name);

  return {
    projects: projectsRes.data,
    users: usersRes.data,
    goals: goalsRes.data,
    allTags: allTagsRes.data,
    articles: articlesRes.data,
    folders: foldersRes.data,
    summarizedProjects,
    summarizedGoals,
    userList,
    serviceList,
    iconList,
    summarizedArticles,
    summarizedFolders,
  };
};

// --- PROMPTS ---
const getAnalyzeProjectsSystemPrompt = (context) => `You are an expert project and goal management AI assistant. Your purpose is to execute actions for the user. You will receive a conversation history and context data.

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
- If 'header_image_search_query' is provided, I will find an image on Unsplash and set it as the article's header image.

9. UPDATE_ARTICLE:
{"action": "UPDATE_ARTICLE", "article_title": "<title of article to update>", "updates": {"title": "<new title>", "content": "<new HTML content>", "folder_name": "<new folder name>", "header_image_search_query": "<optional image search query>"}}
- 'content' will replace the existing content. To append, first get the existing content and then provide the full new content.
- Use 'header_image_search_query' to find and set a new header image for the article.

10. DELETE_ARTICLE:
{"action": "DELETE_ARTICLE", "article_title": "<title of article to delete>"}

CONTEXT:
- Available Projects (with their tasks and tags): ${JSON.stringify(context.summarizedProjects, null, 2)}
- Available Goals: ${JSON.stringify(context.summarizedGoals, null, 2)}
- Available Users: ${JSON.stringify(context.userList, null, 2)}
- Available Services: ${JSON.stringify(context.serviceList, null, 2)}
- Available Icons: ${JSON.stringify(context.iconList, null, 2)}
- Available Articles: ${JSON.stringify(context.summarizedArticles, null, 2)}
- Available Folders: ${JSON.stringify(context.summarizedFolders, null, 2)}
`;

const articleWriterFeaturePrompts = {
  'generate-article-from-title': {
    system: `You are an expert writer. Write a comprehensive article in HTML format based on the following title. The article should be well-structured with headings (h2, h3), paragraphs (p), and lists (ul, li) where appropriate. Respond ONLY with the HTML content.`,
    user: (payload) => `Title: "${payload.title}"`,
    max_tokens: 2048,
  },
  'expand-article-text': {
    system: `You are an expert writer. Your task is to expand upon a selected piece of text within a larger article. Develop the idea further, add more detail, and ensure it flows naturally with the rest of the content. Respond ONLY with the new, expanded HTML content that should replace the original selected text. Do not repeat the original text unless it's naturally part of the expansion.`,
    user: (payload) => `Article Title: "${payload.title}"\n\nFull Article Content (for context):\n${payload.fullContent}\n\nExpand this selected text:\n"${payload.selectedText}"`,
    max_tokens: 1024,
  },
  'improve-article-content': {
    system: `You are an expert editor. Improve the following article content for clarity, grammar, and engagement. Maintain the original meaning and tone. Respond ONLY with the improved HTML content, preserving the original HTML structure as much as possible. Do not add any explanatory text before or after the HTML.`,
    user: (payload) => `Improve this content:\n\n${payload.content}`,
    max_tokens: 2048,
  },
  'summarize-article-content': {
    system: `You are an expert editor. Your task is to summarize the provided text.
- If you are given only 'content', summarize that content.
- If you are given 'content' (a selection), 'fullArticleContent', and 'articleTitle', summarize the 'content' selection *within the context* of the full article. The summary should fit seamlessly back into the article.
- The summary should be concise, capture the main points, and be presented in well-structured HTML format (paragraphs, lists).
- Respond ONLY with the summarized HTML content.`,
    user: (payload) => {
      if (payload.fullArticleContent && payload.articleTitle) {
        return `Article Title: "${payload.articleTitle}"\n\nFull Article Content (for context):\n${payload.fullArticleContent}\n\nSummarize this selected text:\n"${payload.content}"`;
      }
      return `Summarize this content:\n\n${payload.content}`;
    },
    max_tokens: 1024,
  }
};

// --- FEATURES ---
async function analyzeDuplicates(payload, context) {
  const { openai } = context;
  const { duplicates } = payload;
  if (!duplicates) {
    throw new Error("400: Duplicates data is required for analysis.");
  }

  const systemPrompt = `You are a data quality assistant. Here is a list of potential duplicate contacts. Summarize the findings in a friendly, concise paragraph in markdown format. Mention the total number of pairs found and the common reasons (e.g., 'similar names or shared emails'). Then, recommend that the user review and merge them to keep their contact list clean.`;
  const userPrompt = `Analyze these potential duplicates:\n${JSON.stringify(duplicates, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 250,
  });

  return { result: response.choices[0].message.content };
}

async function aiMergeContacts(payload, context) {
  const { supabaseAdmin, openai } = context;
  const { primary_person_id, secondary_person_id } = payload;
  if (!primary_person_id || !secondary_person_id) {
    throw new Error("400: Primary and secondary person IDs are required.");
  }

  // Fetch both person records with their relations
  const { data: peopleData, error: peopleError } = await supabaseAdmin
    .rpc('get_people_with_details')
    .in('id', [primary_person_id, secondary_person_id]);

  if (peopleError) throw peopleError;
  if (!peopleData || peopleData.length < 2) throw new Error("404: Could not find both contacts to merge.");

  const primaryPerson = peopleData.find(p => p.id === primary_person_id);
  const secondaryPerson = peopleData.find(p => p.id === secondary_person_id);

  // Ask AI to merge
  const systemPrompt = `You are an intelligent contact merging assistant. Your task is to merge two JSON objects representing two people into a single, consolidated JSON object. Follow these rules carefully:

1.  **Primary Record**: The user will designate one record as "primary". You should prioritize data from this record but intelligently incorporate data from the "secondary" record.
2.  **No Data Deletion**: Do not discard information from the secondary record. If a field from the secondary record conflicts with the primary (e.g., a different job title), and cannot be combined, add the secondary information to the 'notes' field in a structured way, like "Also worked as: [Job Title] at [Company]".
3.  **Field Merging Logic**:
    *   **full_name**: Choose the most complete or formal name. If "Jane D." and "Jane Doe" are provided, choose "Jane Doe".
    *   **avatar_url, company, job_title, department, birthday**: If both records have a value, prefer the primary record's value. Add the secondary record's value to the 'notes' if it's different and seems important (e.g., a different company or job title).
    *   **contact (emails, phones)**: Combine the arrays, ensuring all unique values are kept. Do not duplicate entries.
    *   **social_media**: Merge the two JSON objects. If a key exists in both (e.g., 'linkedin'), the primary record's value takes precedence.
    *   **notes**: Intelligently combine the notes from both records. Do not simply concatenate them. Summarize if possible, remove redundancy, and add a separator like "--- Merged Notes ---" if you are combining distinct blocks of text. Also, add any conflicting information from other fields here.
4.  **Output Format**: Your response MUST be ONLY the final, merged JSON object representing the person. Do not include any explanations, markdown formatting, or other text. The JSON should be a valid object that can be parsed directly.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Merge these two contacts. \n\nPrimary Contact:\n${JSON.stringify(primaryPerson, null, 2)}\n\nSecondary Contact:\n${JSON.stringify(secondaryPerson, null, 2)}` }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const mergedPersonJSON = response.choices[0].message.content;
  if (!mergedPersonJSON) {
      throw new Error("503: AI failed to return a merged contact.");
  }
  const mergedPerson = JSON.parse(mergedPersonJSON);

  // --- Database Operations ---
  // Combine unique project and tag IDs from both original records
  const allProjectIds = [...new Set([...(primaryPerson.projects || []).map(p => p.id), ...(secondaryPerson.projects || []).map(p => p.id)])];
  const allTagIds = [...new Set([...(primaryPerson.tags || []).map(t => t.id), ...(secondaryPerson.tags || []).map(t => t.id)])];

  // Use the upsert RPC to update the primary person and their relations
  const { error: upsertError } = await supabaseAdmin.rpc('upsert_person_with_details', {
      p_id: primary_person_id,
      p_full_name: mergedPerson.full_name,
      p_contact: mergedPerson.contact,
      p_company: mergedPerson.company,
      p_job_title: mergedPerson.job_title,
      p_department: mergedPerson.department,
      p_social_media: mergedPerson.social_media,
      p_birthday: mergedPerson.birthday,
      p_notes: mergedPerson.notes,
      p_avatar_url: mergedPerson.avatar_url,
      p_address: mergedPerson.address,
      p_project_ids: allProjectIds,
      p_existing_tag_ids: allTagIds,
      p_custom_tags: [], // We are not creating new tags here
  });

  if (upsertError) {
      throw new Error(`500: Failed to update primary contact: ${upsertError.message}`);
  }

  // Delete the secondary person
  const { error: deleteError } = await supabaseAdmin.from('people').delete().eq('id', secondary_person_id);
  if (deleteError) {
      // This is not ideal, but we should log it. The primary contact is updated.
      console.error(`Failed to delete secondary contact ${secondary_person_id}: ${deleteError.message}`);
  }

  return { message: "Contacts merged successfully by AI." };
}

async function articleWriter(payload, context) {
  const { openai, feature } = context;
  const promptConfig = articleWriterFeaturePrompts[feature];

  if (!promptConfig) {
    throw new Error(`400: Unknown article writer feature: ${feature}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: promptConfig.system },
      { role: "user", content: promptConfig.user(payload) }
    ],
    temperature: 0.7,
    max_tokens: promptConfig.max_tokens,
  });

  return { result: response.choices[0].message.content?.trim() };
}

async function generateCaption(payload, context) {
  const { openai } = context;
  const { altText } = payload;
  if (!altText) {
    throw new Error("400: altText is required for generating a caption.");
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
  return { caption };
}

async function generateMoodInsight(payload, context) {
  const { openai } = context;
  const { prompt, userName, conversationHistory } = payload;
  if (!prompt) {
    throw new Error("400: Prompt is required for generating mood insights.");
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

  return { result: response.choices[0].message.content };
}

async function suggestIcon(payload, context) {
  const { openai } = context;
  const { title, icons } = payload;
  if (!title || !icons || !Array.isArray(icons)) {
    throw new Error("400: Title and a list of icons are required.");
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

  return { result: response.choices[0].message.content?.trim() };
}

async function analyzeProjects(payload, context) {
  const { req, openai } = context;
  const { request, conversationHistory } = payload;
  if (!request) {
    throw new Error("400: An analysis request type is required.");
  }

  const userSupabase = createSupabaseUserClient(req);
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error("401: User not authenticated.");

  const actionContext = await buildContext(userSupabase, user);
  const systemPrompt = getAnalyzeProjectsSystemPrompt(actionContext);

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

      const actionResult = await executeAction(actionData, { ...actionContext, userSupabase, user });
      return { result: actionResult };

  } catch (e) {
      return { result: responseText };
  }
}

async function generateInsight(payload, context) {
  const { openai } = context;
  const { goal, context: progressContext } = payload;
  if (!goal || !progressContext) {
    throw new Error("400: Goal and context are required for generating insights.");
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
Konteks Kemajuan: ${JSON.stringify(progressContext, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return { result: response.choices[0].message.content };
}

// --- MAIN ROUTER ---
const featureHandlers = {
  'analyze-duplicates': analyzeDuplicates,
  'ai-merge-contacts': aiMergeContacts,
  'generate-article-from-title': articleWriter,
  'expand-article-text': articleWriter,
  'improve-article-content': articleWriter,
  'summarize-article-content': articleWriter,
  'generate-caption': generateCaption,
  'generate-mood-insight': generateMoodInsight,
  'suggest-icon': suggestIcon,
  'analyze-projects': analyzeProjects,
  'generate-insight': generateInsight,
};

// --- SERVER ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { feature, payload } = await req.json();
    if (!feature || !payload) {
      throw new Error("400: 'feature' and 'payload' are required in the request body.");
    }
    
    const handler = featureHandlers[feature];
    if (!handler) {
      throw new Error(`404: Unknown feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    
    const context = {
        req,
        openai,
        supabaseAdmin,
        feature,
    };

    const responseData = await handler(payload, context);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge function error:", error.message);
    const message = error.message;
    const statusCodeMatch = message.match(/^(\d{3}):/);
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 500;
    const cleanMessage = message.replace(/^\d{3}:\s*/, '');

    return new Response(JSON.stringify({ error: cleanMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});