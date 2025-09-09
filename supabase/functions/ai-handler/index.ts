// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import OpenAI from 'https://esm.sh/openai@4.29.2';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168';
import mammoth from 'https://esm.sh/mammoth@1.7.2';
import { createApi } from 'https://esm.sh/unsplash-js@7.0.19';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

// --- From _shared/clients.ts ---
const createSupabaseAdmin = () => {
  return createSupabaseClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getOpenAIClient = async (supabaseAdmin) => {
  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'OPENAI_API_KEY')
    .single();

  if (configError || !config?.value) {
    throw new Error("OpenAI API key is not configured by an administrator.");
  }
  return new OpenAI({ apiKey: config.value });
};

const createSupabaseUserClient = (req) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    return createSupabaseClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
};

// --- From _shared/prompts.ts ---
const getAnalyzeProjectsSystemPrompt = (context, userName) => `You are an AI Assistant Director & Expert Consultant for 7inked (a leading brand activation agency in Asia) and Betterworks ID (a regional brand activation & digital activation platform).
Your role is to guide, consult, and provide end-to-end expert input on:

- Event Planning & Brand Activation (concept, execution, frameworks, tools, cost breakdowns, stakeholder engagement).
- Digital Activation (integrating AI, tech platforms, engagement tools, gamification, social amplification).
- AI-Powered Assistance (intuitive frameworks, modern practices, smart recommendations).

**Tone & Style:**

- Speak like a director-level consultant: professional, confident, insightful.
- Deliver clear, step-by-step frameworks that are intuitive and directly applicable.
- Stay modern, relevant, practical, and smart (avoid outdated or generic suggestions).
- Provide both strategic vision and operational details.

**Capabilities & Expectations:**

**Event & Brand Activation Expert**

- Give structured planning frameworks (Rundown, Budget Table, Merchandise Set, Crew Roles, Production Timeline).
- Suggest regional-standard benchmarks for Asia (scale, pricing, engagement methods).
- Compare alternatives (e.g., LED specs, booth sizes, gamification mechanics).

**Digital Activation & AI Tech Consultant**

- Show how AI, automation, and digital tools can enhance activations (Supabase, Cloudinary, Omnichannel Chat, Gamification apps, Loyalty platforms).
- Provide integration flows (e.g., email → CRM, WhatsApp → lead gen, portal → Supabase).

**Framework & Workflow Guidance**

- Always provide step-by-step processes.
- Translate abstract ideas into practical execution guides (templates, checklists, workflows).
- Propose smart improvements that balance creativity, cost-efficiency, and ROI.

**Leadership Perspective**

- Act like a senior director who mentors the team.
- Anticipate possible risks and provide mitigation strategies.
- Push for innovation, efficiency, and measurable impact.

**Output Format:**

- Use tables, bullet points, and frameworks for clarity.
- Provide practical templates (budget, timeline, task breakdowns).
- Adapt answers for both strategic decisions and hands-on execution.

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

3. DELETE_PROJECT:
{"action": "DELETE_PROJECT", "project_name": "<name of project to delete>"}

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
- Create 2-3 relevant 'tags' as an array of objects like '[{"name": "Health", "color": "#FF6B6B"}, {"name": "Hobby", "color": "#F7B801"}]'. These will be new tags.
- Example: User says "create a goal to learn guitar". You might respond with: {"action": "CREATE_GOAL", "goal_details": {"title": "Learn Guitar", "description": "Practice guitar regularly to improve skills.", "type": "frequency", "frequency": "Weekly", "specific_days": ["Mo", "We", "Fr"], "icon": "Music", "color": "#4ECDC4", "tags": [{"name": "Music", "color": "#4ECDC4"}, {"name": "Hobby", "color": "#F7B801"}]}}

8. UPDATE_GOAL:
{"action": "UPDATE_GOAL", "goal_title": "<title of the goal to update>", "updates": {"field": "value", "another_field": "value"}}
- Valid fields for 'updates' are: title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, add_tags, remove_tags.
- For 'add_tags' and 'remove_tags', the value should be an array of tag names.

9. CREATE_ARTICLE:
{"action": "CREATE_ARTICLE", "article_details": {"title": "<The user's topic for the article>", "folder_name": "<optional folder name>"}}
- When creating an article, just provide the topic as the title. The system will generate the full content and find a relevant image.

10. UPDATE_ARTICLE:
{"action": "UPDATE_ARTICLE", "article_title": "<title of article to update>", "updates": {"title": "<new title>", "content": "<new HTML content>", "folder_name": "<new folder name>", "header_image_search_query": "<optional image search query>"}}
- 'content' will replace the existing content. To append, first get the existing content and then provide the full new content.
- Use 'header_image_search_query' to find and set a new header image for the article.

11. DELETE_ARTICLE:
{"action": "DELETE_ARTICLE", "article_title": "<title of article to delete>"}

12. CREATE_FOLDER:
{"action": "CREATE_FOLDER", "folder_details": {"name": "<folder name>", "description": "<desc>", "icon": "IconName", "color": "#RRGGBB", "category": "<category>"}}
- If the user only provides a name, you MUST infer the other details.
- Suggest a relevant 'icon' from the 'Available Icons' list and a suitable 'color'.

13. SEARCH_MAPS_AND_WEBSITE:
{"action": "SEARCH_MAPS_AND_WEBSITE", "query": "<search query for a place or a website URL>"}

CONTEXT:
- Current Date & Time: ${new Date().toISOString()}
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
    system: `You are an expert writer. Generate a well-structured article in HTML format based on the provided title. Include a heading, an introduction, several paragraphs with valuable insights, a bulleted or numbered list with actionable steps, and a conclusion. The response must be ONLY the HTML content of the article body.`,
    user: (payload) => `Title: ${payload.title}`,
    max_tokens: 1500,
  },
  'expand-article-text': {
    system: `You are an expert writer. Expand upon the selected text within the context of the full article. Maintain the original tone and style. The response must be ONLY the new, expanded HTML content to replace the selection.`,
    user: (payload) => `Full Article Content:\n${payload.fullContent}\n\nSelected Text to Expand:\n${payload.selectedText}`,
    max_tokens: 1000,
  },
  'improve-article-content': {
    system: `You are an expert editor. Rewrite the following article content to be more professional, engaging, and clear. Fix any grammatical errors. The response must be ONLY the improved HTML content of the article body.`,
    user: (payload) => `Original Content:\n${payload.content}`,
    max_tokens: 2000,
  },
  'summarize-article-content': {
    system: `You are an expert summarizer. Summarize the following content into a concise paragraph. The response must be ONLY the summarized HTML content.`,
    user: (payload) => `Content to Summarize:\n${payload.content}`,
    max_tokens: 500,
  },
};

// --- From _shared/context.ts ---
const buildContext = async (supabaseClient, user) => {
  console.log("[DIAGNOSTIC] buildContext: Starting context build.");
  try {
    const [
      projectsRes,
      usersRes,
      goalsRes,
      allTagsRes,
      articlesRes,
      foldersRes
    ] = await Promise.all([
      supabaseClient.rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 }),
      supabaseClient.from('profiles').select('id, first_name, last_name, email'),
      supabaseClient.rpc('get_user_goals'),
      supabaseClient.from('tags').select('id, name'),
      supabaseClient.from('kb_articles').select('id, title, slug, folder_id'),
      supabaseClient.from('kb_folders').select('id, name')
    ]);
    console.log("[DIAGNOSTIC] buildContext: All parallel fetches completed.");

    if (projectsRes.error) throw new Error(`Failed to fetch project data for analysis: ${projectsRes.error.message}`);
    if (usersRes.error) throw new Error(`Failed to fetch users for context: ${usersRes.error.message}`);
    if (goalsRes.error) throw new Error(`Failed to fetch goals for context: ${goalsRes.error.message}`);
    if (allTagsRes.error) throw new Error(`Failed to fetch tags for context: ${allTagsRes.error.message}`);
    if (articlesRes.error) throw new Error(`Failed to fetch articles for context: ${articlesRes.error.message}`);
    if (foldersRes.error) throw new Error(`Failed to fetch folders for context: ${foldersRes.error.message}`);
    console.log("[DIAGNOSTIC] buildContext: All data fetches successful.");

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
    const userList = usersRes.data.map(u => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
    const serviceList = [ "3D Graphic Design", "Accommodation", "Award Ceremony", "Branding", "Content Creation", "Digital Marketing", "Entertainment", "Event Decoration", "Event Equipment", "Event Gamification", "Exhibition Booth", "Food & Beverage", "Keyvisual Graphic Design", "LED Display", "Lighting System", "Logistics", "Man Power", "Merchandise", "Motiongraphic Video", "Multimedia System", "Payment Advance", "Photo Documentation", "Plaque & Trophy", "Prints", "Professional Security", "Professional video production for commercial ads", "Show Management", "Slido", "Sound System", "Stage Production", "Talent", "Ticket Management System", "Transport", "Venue", "Video Documentation", "VIP Services", "Virtual Events", "Awards System", "Brand Ambassadors", "Electricity & Genset", "Event Consultation", "Workshop" ];
    const iconList = [ 'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users', 'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap' ];
    const summarizedArticles = articlesRes.data.map(a => ({ title: a.title, folder: foldersRes.data.find(f => f.id === a.folder_id)?.name }));
    const summarizedFolders = foldersRes.data.map(f => f.name);
    console.log("[DIAGNOSTIC] buildContext: Data summarization complete.");

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
  } catch (error) {
    console.error("[DIAGNOSTIC] buildContext: CRITICAL ERROR during context build:", error);
    throw error; // Re-throw to be caught by the main handler
  }
};

// --- From _shared/actions.ts ---
async function executeAction(actionData, context) {
    console.log("[DIAGNOSTIC] executeAction: Starting action execution for", actionData.action);
    const { userSupabase, user, projects, users, goals, allTags, articles, folders } = context;

    try {
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
                if (!newProject) return `I tried to create the project, but the database didn't confirm it was created. Please check your projects list.`;

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
                const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
                if (!project) return `I couldn't find a project named "${project_name}".`;

                const { data, error } = await userSupabase.rpc('update_project_details', {
                    p_project_id: project.id,
                    p_name: updates.name || project.name,
                    p_description: updates.description || project.description,
                    p_category: updates.category || project.category,
                    p_status: updates.status || project.status,
                    p_budget: updates.budget || project.budget,
                    p_start_date: updates.start_date || project.start_date,
                    p_due_date: updates.due_date || project.due_date,
                    p_payment_status: updates.payment_status || project.payment_status,
                    p_payment_due_date: updates.payment_due_date || project.payment_due_date,
                    p_venue: updates.venue || project.venue,
                    p_member_ids: project.assignedTo.map(m => m.id), // This RPC requires all members, not just changes
                    p_service_titles: updates.services || project.services,
                    p_existing_tags: (updates.tags || project.tags || []).map(t => t.id),
                    p_custom_tags: [],
                });

                if (error) return `I failed to update the project. The database said: ${error.message}`;
                return `I've updated the project "${project.name}".`;
            }
            case 'CREATE_GOAL': {
                const { goal_details } = actionData;
                const { data: newGoal, error } = await userSupabase.rpc('create_goal_and_link_tags', {
                    p_title: goal_details.title,
                    p_description: goal_details.description,
                    p_icon: goal_details.icon,
                    p_color: goal_details.color,
                    p_type: goal_details.type,
                    p_frequency: goal_details.frequency,
                    p_specific_days: goal_details.specific_days,
                    p_target_quantity: goal_details.target_quantity,
                    p_target_period: goal_details.target_period,
                    p_target_value: goal_details.target_value,
                    p_unit: goal_details.unit,
                    p_existing_tags: [],
                    p_custom_tags: goal_details.tags || [],
                }).single();

                if (error) return `I failed to create the goal. The database said: ${error.message}`;
                if (!newGoal) return `I tried to create the goal, but the database didn't confirm it was created. Please check your goals list.`;
                return `I've created the goal "${newGoal.title}". You can view it at /goals/${newGoal.slug}`;
            }
            case 'UPDATE_GOAL': {
                const { goal_title, updates } = actionData;
                const goal = goals.find(g => g.title.toLowerCase() === goal_title.toLowerCase());
                if (!goal) return `I couldn't find a goal named "${goal_title}".`;

                const { error } = await userSupabase.rpc('update_goal_with_tags', {
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
                    p_tags: (updates.tags || goal.tags || []).map(t => t.id),
                    p_custom_tags: [],
                });

                if (error) return `I failed to update the goal. The database said: ${error.message}`;
                return `I've updated the goal "${goal.title}".`;
            }
            case 'CREATE_FOLDER': {
                const { name, description, icon, color, category } = actionData.folder_details;
                const { data: newFolder, error } = await userSupabase.from('kb_folders').insert({
                    name, description, icon, color, category, user_id: user.id
                }).select().single();
                if (error) return `I failed to create the folder. The database said: ${error.message}`;
                if (!newFolder) return `I tried to create the folder, but the database didn't confirm it was created. Please check your folders list.`;
                return `I've created the folder "${newFolder.name}". You can view it at /knowledge-base/folders/${newFolder.slug}`;
            }
            case 'CREATE_ARTICLE': {
                const { title: prompt, folder_name } = actionData.article_details;
                if (!prompt) return "I need a title or topic to create an article.";

                const { data: articleData, error: articleError } = await userSupabase.functions.invoke('generate-article', {
                    body: { prompt },
                });
                if (articleError) return `I failed to generate the article content. The error was: ${articleError.message}`;
                
                const { title, content, unsplash_keywords } = articleData;

                let folder_id = folders.find(f => f.name.toLowerCase() === folder_name?.toLowerCase())?.id;
                let header_image_url = null;

                if (unsplash_keywords && unsplash_keywords.length > 0) {
                    const unsplash = createApi({ accessKey: Deno.env.get('VITE_UNSPLASH_ACCESS_KEY')! });
                    const query = unsplash_keywords.join(' ');
                    const photo = await unsplash.search.getPhotos({ query, perPage: 1, orientation: 'landscape' });
                    if (photo.response?.results[0]) {
                        header_image_url = photo.response.results[0].urls.regular;
                    }
                }

                if (!folder_id) {
                    const { data: defaultFolderData, error: folderError } = await userSupabase.rpc('create_default_kb_folder').single();
                    if (folderError || !defaultFolderData) return `I couldn't find or create a default folder for the article: ${folderError?.message}`;
                    folder_id = defaultFolderData;
                }

                const { data: newArticle, error } = await userSupabase.from('kb_articles').insert({
                    title, content: { html: content }, folder_id, user_id: user.id, header_image_url
                }).select().single();

                if (error) return `I failed to create the article. The database said: ${error.message}`;
                if (!newArticle) return `I tried to create the article, but the database didn't confirm it was created. Please check your articles list.`;
                return `I've created the article "${newArticle.title}". You can view it at /knowledge-base/pages/${newArticle.slug}`;
            }
            case 'UPDATE_ARTICLE': {
                const { article_title, updates } = actionData;
                const article = articles.find(a => a.title.toLowerCase() === article_title.toLowerCase());
                if (!article) return `I couldn't find an article named "${article_title}".`;

                let header_image_url = article.header_image_url;
                if (updates.header_image_search_query) {
                    const unsplash = createApi({ accessKey: Deno.env.get('VITE_UNSPLASH_ACCESS_KEY')! });
                    const photo = await unsplash.search.getPhotos({ query: updates.header_image_search_query, perPage: 1 });
                    if (photo.response?.results[0]) {
                        header_image_url = photo.response.results[0].urls.regular;
                    }
                }

                const { error } = await userSupabase.from('kb_articles').update({
                    title: updates.title,
                    content: updates.content ? { html: updates.content } : undefined,
                    folder_id: updates.folder_name ? folders.find(f => f.name.toLowerCase() === updates.folder_name.toLowerCase())?.id : undefined,
                    header_image_url,
                }).eq('id', article.id);

                if (error) return `I failed to update the article. The database said: ${error.message}`;
                return `I've updated the article "${article.title}".`;
            }
            case 'DELETE_ARTICLE': {
                const { article_title } = actionData;
                const article = articles.find(a => a.title.toLowerCase() === article_title.toLowerCase());
                if (!article) return `I couldn't find an article named "${article_title}".`;
                const { error } = await userSupabase.from('kb_articles').delete().eq('id', article.id);
                if (error) return `I failed to delete the article. The database said: ${error.message}`;
                return `I've deleted the article "${article_title}".`;
            }
            case 'SEARCH_MAPS_AND_WEBSITE': {
                const { query } = actionData;
                if (!query) return "I need a place name or website to search for.";

                const { data, error } = await userSupabase.functions.invoke('scrape-url', {
                    body: { query },
                });

                if (error) {
                    let errorMessage = error.message;
                    if (error.context && typeof error.context.json === 'function') {
                        try {
                            const errorBody = await error.context.json();
                            if (errorBody.error) {
                                errorMessage = errorBody.error;
                            }
                        } catch (e) {
                            // ignore parsing error, stick with original message
                        }
                    }
                    return `I had trouble searching for that. The error was: ${errorMessage}`;
                }
                if (data.error) {
                    return `I had trouble searching for that. The error was: ${data.error}`;
                }

                const details = data.result;
                let response = `### ${details.Name}\n`;
                if (details.Average_Rating) {
                    response += `**Rating:** ${details.Average_Rating} ⭐ (${details.Review_Count} reviews)\n`;
                }
                if (details.Categories) {
                    response += `**Categories:** ${details.Categories.join(', ').replace(/_/g, ' ')}\n`;
                }
                response += `\n**Address:** ${details.Fulladdress}\n`;
                if (details.Phone) {
                    response += `**Phone:** ${details.Phone}\n`;
                }
                if (details.Website) {
                    response += `**Website:** [${details.Domain}](${details.Website})\n`;
                }
                if (details.Email) {
                    response += `**Email:** ${details.Email}\n`;
                }
                if (details.Opening_Hours) {
                    response += `\n**Hours:**\n${details.Opening_Hours.map(h => `- ${h}`).join('\n')}\n`;
                }
                
                const socialLinks = [
                    details.instagram && `[Instagram](${details.instagram})`,
                    details.facebook && `[Facebook](${details.facebook})`,
                    details.twitter && `[Twitter](${details.twitter})`,
                    details.youtube && `[YouTube](${details.youtube})`,
                ].filter(Boolean);

                if (socialLinks.length > 0) {
                    response += `\n**Socials:** ${socialLinks.join(' | ')}\n`;
                }

                response += `\n[View on Google Maps](${details.Google_Maps_URL})\n`;

                if (details.Featured_Image) {
                    response += `\n![Featured Image](${details.Featured_Image})\n`;
                }

                return response;
            }
            default:
                return "I'm not sure how to perform that action. Can you clarify?";
        }
    } catch (error) {
        console.error(`[DIAGNOSTIC] executeAction: CRITICAL ERROR during ${actionData.action}:`, error);
        return `I encountered an unexpected error while trying to perform the action: ${error.message}`;
    }
}

// --- From _shared/features.ts ---
async function sendEmail(to, subject, html, text) {
  const emailFrom = Deno.env.get('EMAIL_FROM') || "Betterworks <no-reply@mail.betterworks.id>";
  const emailitApiKey = Deno.env.get('EMAILIT_API_KEY');

  if (!emailitApiKey) {
    console.error("Emailit API key is not configured on the server.");
    return; // Don't throw, just log the error, as this is a secondary action.
  }

  const payload = { from: emailFrom, to, subject, html, text };

  try {
    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailitApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to send email via Emailit: HTTP ${response.status}`, errorData);
    } else {
      console.log(`Email sent successfully to ${to}`);
    }
  } catch (e) {
    console.error(`Error sending email: ${e.message}`);
  }
}

async function analyzeProjects(payload, context) {
  console.log("[DIAGNOSTIC] analyzeProjects: Starting analysis.");
  const { openai, user, userSupabase, supabaseAdmin } = context;
  let { request, conversationHistory, attachmentUrl, attachmentType, replyToMessageId } = payload;
  
  if (!request && !attachmentUrl) {
    throw new Error("An analysis request is required.");
  }

  let documentContext = '';
  if (attachmentUrl && (attachmentType === 'application/pdf' || attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    console.log(`[DIAGNOSTIC] analyzeProjects: Detected document attachment for parsing: ${attachmentType}`);
    try {
      const response = await fetch(attachmentUrl);
      if (!response.ok) throw new Error(`Failed to fetch attachment from storage: ${response.statusText}`);
      const fileBuffer = await response.arrayBuffer();

      if (attachmentType === 'application/pdf') {
        const pdf = await pdfjs.getDocument(fileBuffer).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => item.str).join(' ') + '\n';
        }
        documentContext = textContent;
      } else if (attachmentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        documentContext = value;
      }
      console.log("[DIAGNOSTIC] analyzeProjects: Document parsing successful.");
    } catch (e) {
      console.error("[DIAGNOSTIC] analyzeProjects: CRITICAL ERROR during document parsing:", e);
      return { result: `I'm sorry, I had trouble reading the attached document. Error: ${e.message}` };
    }
  }

  if (attachmentUrl && attachmentType?.startsWith('audio/')) {
    console.log("[DIAGNOSTIC] analyzeProjects: Detected audio attachment for transcription.");
    try {
      const audioResponse = await fetch(attachmentUrl);
      if (!audioResponse.ok) throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioResponse,
        model: "whisper-1",
      });
      
      request = transcription.text;
      console.log("[DIAGNOSTIC] analyzeProjects: Transcription successful. Text:", request);
      
      const { error: updateError } = await userSupabase
        .from('ai_chat_history')
        .update({ content: `(Voice Message): ${request}` })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (updateError) console.error("Failed to update history with transcription:", updateError);

    } catch (transcriptionError) {
      console.error("[DIAGNOSTIC] analyzeProjects: CRITICAL ERROR during transcription:", transcriptionError);
      throw new Error(`Failed to transcribe audio: ${transcriptionError.message}`);
    }
  }

  let history;
  if (conversationHistory && Array.isArray(conversationHistory)) {
      history = conversationHistory;
      console.log(`[DIAGNOSTIC] analyzeProjects: Using ${conversationHistory.length} messages from client-provided history.`);
  } else {
      const { data: dbHistory, error: historyError } = await userSupabase
        .from('ai_chat_history')
        .select('sender, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20);
      if (historyError) throw historyError;
      history = dbHistory;
      console.log(`[DIAGNOSTIC] analyzeProjects: Fetched ${history ? history.length : 0} messages from DB.`);
  }

  const actionContext = await buildContext(userSupabase, user);
  const currentUserProfile = actionContext.userList.find(u => u.id === user.id);
  const currentUserName = currentUserProfile ? currentUserProfile.name : 'there';
  const systemPrompt = getAnalyzeProjectsSystemPrompt(actionContext, currentUserName);
  console.log("[DIAGNOSTIC] analyzeProjects: System prompt generated.");

  const userContent = [];
  let combinedRequest = request || '';
  if (documentContext) {
    combinedRequest += `\n\n--- Attached Document Content ---\n${documentContext}`;
  }

  if (combinedRequest) {
    userContent.push({ type: "text", text: combinedRequest });
  }
  
  if (attachmentUrl && (attachmentType?.startsWith('image/'))) {
    userContent.push({ type: "image_url", image_url: { url: attachmentUrl } });
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.content })),
    { role: "user", content: userContent }
  ];

  console.log("[DIAGNOSTIC] analyzeProjects: Sending request to OpenAI.");
  const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
  });
  console.log("[DIAGNOSTIC] analyzeProjects: Received response from OpenAI.");

  const responseText = response.choices[0].message.content;
  
  if (responseText) {
    await userSupabase.from('ai_chat_history').insert({ 
      user_id: user.id, 
      sender: 'ai', 
      content: responseText 
    });
  }
  console.log("[DIAGNOSTIC] analyzeProjects: Saved AI response to history.");

  // Send email on first interaction
  if (history.length === 1 && history[0].sender === 'user') {
    const userQuestion = history[0].content;
    const aiAnswer = responseText;
    const userEmail = user.email;
    const userName = currentUserName;

    const emailSubject = `AI Assistant Interaction: ${userName}`;
    const emailHtml = `
      <p>A user has interacted with the AI assistant.</p>
      <p><strong>User:</strong> ${userName} (${userEmail})</p>
      <hr>
      <p><strong>Question:</strong></p>
      <p>${userQuestion}</p>
      <br>
      <p><strong>AI Answer:</strong></p>
      <p>${aiAnswer.replace(/\n/g, '<br>')}</p>
    `;
    
    await sendEmail('adri@7inked.com', emailSubject, emailHtml, null);
  }

  try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (!jsonMatch) {
          console.log("[DIAGNOSTIC] analyzeProjects: No JSON action found in response. Returning natural language.");
          return { result: responseText };
      }
      const jsonString = jsonMatch[1] || jsonMatch[2];
      const actionData = JSON.parse(jsonString);
      console.log("[DIAGNOSTIC] analyzeProjects: Parsed JSON action:", actionData.action);

      const actionResult = await executeAction(actionData, { ...actionContext, userSupabase, user, originalRequest: request });
      console.log("[DIAGNOSTIC] analyzeProjects: Action executed. Result:", actionResult);
      
      await userSupabase.from('ai_chat_history').insert({ user_id: user.id, sender: 'ai', content: actionResult });

      return { result: actionResult };

  } catch (e) {
      console.error("[DIAGNOSTIC] analyzeProjects: Error parsing or executing action. Returning raw response.", e);
      return { result: `I'm sorry, I encountered an error while processing that action: ${e.message}` };
  }
}

async function analyzeDuplicates(payload, context) {
  const { openai } = context;
  const { duplicates } = payload;
  if (!duplicates) {
    throw new Error("Duplicates data is required for analysis.");
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
    throw new Error("Primary and secondary person IDs are required.");
  }

  // Fetch both person records with their relations
  const { data: peopleData, error: peopleError } = await supabaseAdmin
    .rpc('get_people_with_details')
    .in('id', [primary_person_id, secondary_person_id]);

  if (peopleError) throw peopleError;
  if (!peopleData || peopleData.length < 2) throw new Error("Could not find both contacts to merge.");

  const primaryPerson = peopleData.find(p => p.id === primary_person_id);
  const secondaryPerson = peopleData.find(p => p.id === secondary_person_id);

  // Ask AI to merge
  const systemPrompt = `You are an intelligent contact merging assistant. Your task is to merge two JSON objects representing two people into a single, consolidated JSON object. Follow these rules carefully:

1.  **Primary Record**: The user will designate one record as "primary". You should prioritize data from this record but intelligently incorporate data from the "secondary" record.
2.  **No Data Deletion**: Do not discard information from the secondary record. If a field from the secondary record conflicts with the primary (e.g., a different job title), and cannot be combined, add the secondary information to the 'notes' field in a structured way, like "Also worked as: [Job Title] at [Company]".
3.  **Field Merging Logic**:
    *   **user_id**: This is the most important field. If the primary record has a user_id, keep it. If the primary does not but the secondary does, the merged record MUST inherit the user_id from the secondary record. If both have different user_ids, this is a conflict; keep the primary's user_id and add a note like "This contact was merged with another registered user (ID: [secondary_user_id])".
    *   **full_name, email**: If the merged record has a user_id, these fields should be taken from the record that provided the user_id, as they are managed by the user's profile.
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
      throw new Error("AI failed to return a merged contact.");
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
      throw new Error(`Failed to update primary contact: ${upsertError.message}`);
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
    throw new Error(`Unknown article writer feature: ${feature}`);
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
  return { caption };
}

async function generateMoodInsight(payload, context) {
  const { openai } = context;
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

  return { result: response.choices[0].message.content };
}

async function suggestIcon(payload, context) {
  const { openai } = context;
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

  return { result: response.choices[0].message.content?.trim() };
}

async function generateInsight(payload, context) {
  const { openai } = context;
  const { goal, context: progressContext } = payload;
  if (!goal || !progressContext) {
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

async function aiSelectCalendarEvents(payload, context) {
  const { openai } = context;
  const { events, existingProjects } = payload;
  if (!events || !Array.isArray(events)) {
    throw new Error("A list of calendar events is required.");
  }

  const systemPrompt = `You are an AI assistant that helps users manage their projects. Your task is to analyze a list of upcoming Google Calendar events and decide which ones should be imported as new projects. You will be given a list of events and a list of existing project names for context.

Your rules are:
1.  Identify events that look like actual projects or significant client meetings. Ignore personal or trivial events (e.g., "Lunch", "Doctor's Appointment").
2.  Compare the event summaries with the list of existing project names. Do NOT select events that seem to be duplicates of existing projects.
3.  Your response MUST be a JSON object containing a single key: "event_ids_to_import". The value of this key must be an array of strings, where each string is the ID of an event you have chosen to import.
4.  If you determine that no events should be imported, respond with an empty array: {"event_ids_to_import": []}.
5.  Do not include any other text, explanation, or markdown in your response. Only the JSON object.`;

  const userPrompt = `Existing Projects:\n${JSON.stringify(existingProjects, null, 2)}\n\nCalendar Events to Analyze:\n${JSON.stringify(events.map(e => ({id: e.id, summary: e.summary, description: e.description})), null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content);
  return { result };
}

// --- Main Handler ---
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
  'ai-select-calendar-events': aiSelectCalendarEvents,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("[DIAGNOSTIC] Request received.");
    const userSupabase = createSupabaseUserClient(req);
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error("User not authenticated.");
    console.log("[DIAGNOSTIC] User authenticated:", user.id);

    const bodyText = await req.text();
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {
      throw new Error(`Invalid JSON body: ${e.message}`);
    }
    console.log("[DIAGNOSTIC] Request body parsed. Feature:", body.feature);

    const { feature, payload } = body;
    const handler = featureHandlers[feature];

    if (!handler) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const openai = await getOpenAIClient(supabaseAdmin);
    console.log("[DIAGNOSTIC] OpenAI client initialized.");
    
    const context = {
        req,
        openai,
        supabaseAdmin,
        feature,
        user,
        userSupabase,
    };

    const responseData = await handler(payload, context);
    console.log("[DIAGNOSTIC] Feature handler executed successfully.");

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[DIAGNOSTIC] CRITICAL ERROR in main handler:", error);
    let status = 500;
    let message = error.message;

    if (error.status === 401) {
      status = 401;
      message = "OpenAI API key is invalid or has been revoked. Please check your key in the settings.";
    } else if (error.status === 429) {
      status = 429;
      message = "You've exceeded your OpenAI quota or have a billing issue. Please check your OpenAI account.";
    }

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});