// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- HELPERS ---
const findUserByNameOrEmail = async (context, nameOrEmail) => {
  const user = context.userList.find(u => u.name.toLowerCase() === nameOrEmail.toLowerCase() || u.email.toLowerCase() === nameOrEmail.toLowerCase());
  return user || null;
};

const findProjectByName = async (context, name) => {
  const project = context.projects.find(p => p.name.toLowerCase() === name.toLowerCase());
  return project || null;
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

// --- EXECUTOR ---
export async function executeAction(actionData, context) {
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
      return `Done! I've created the project "${name}". You can view it [here](/projects/${newProject.slug}).`;
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
      return `Done! I've created the task "${task_title}" in the [${project_name} project](/projects/${project.slug}).`;
    }

    case 'CREATE_GOAL': {
      const { title, description, type, frequency, specific_days, target_quantity, target_period, target_value, unit, icon, color, tags } = details.goal_details;

      const { data: newGoal, error } = await supabaseAdmin
        .rpc('create_goal_and_link_tags', {
          p_title: title,
          p_description: description || null,
          p_icon: icon,
          p_color: color,
          p_type: type,
          p_frequency: frequency || null,
          p_specific_days: specific_days || null,
          p_target_quantity: target_quantity || null,
          p_target_period: target_period || null,
          p_target_value: target_value || null,
          p_unit: unit || null,
          p_existing_tags: [],
          p_custom_tags: tags || [],
        })
        .single();

      if (error) throw new Error(`500: Failed to create goal: ${error.message}`);
      if (!newGoal) throw new Error("500: Goal creation did not return data.");

      return `Done! I've created the goal "${newGoal.title}". You can view it [here](/goals/${newGoal.slug}).`;
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
      
      return `Done! I've created the article "${title}". You can view it [here](/knowledge-base/pages/${newArticle.slug}).`;
    }

    default:
      return `I'm sorry, I can't perform the action "${action}" yet. This feature is under development.`;
  }
}