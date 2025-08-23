// @ts-nocheck
export const buildContext = async (userSupabase, user) => {
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

  if (projectsRes.error) throw new Error(`Failed to fetch project data for analysis: ${projectsRes.error.message}`);
  if (usersRes.error) throw new Error(`Failed to fetch users for context: ${usersRes.error.message}`);
  if (goalsRes.error) throw new Error(`Failed to fetch goals for context: ${goalsRes.error.message}`);
  if (allTagsRes.error) throw new Error(`Failed to fetch tags for context: ${allTagsRes.error.message}`);
  if (articlesRes.error) throw new Error(`Failed to fetch articles for context: ${articlesRes.error.message}`);
  if (foldersRes.error) throw new Error(`Failed to fetch folders for context: ${foldersRes.error.message}`);

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

export async function executeAction(actionData, context) {
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
        case 'DELETE_PROJECT': {
            const { project_name } = actionData;
            if (!project_name) return "I need the name of the project to delete.";

            const project = projects.find(p => p.name.toLowerCase() === project_name.toLowerCase());
            if (!project) return `I couldn't find a project named "${project_name}".`;

            const { error } = await userSupabase.from('projects').delete().eq('id', project.id);
            if (error) return `I failed to delete the project. The database said: ${error.message}`;

            return `Done! I've deleted the project "${project_name}".`;
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
                const unsplashApiKey = Deno.env.get('VITE_UNSPLASH_ACCESS_KEY');
                if (unsplashApiKey) {
                    const unsplashResponse = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(header_image_search_query)}&per_page=1&orientation=landscape`, {
                        headers: { Authorization: `Client-ID ${unsplashApiKey}` }
                    });
                    if (unsplashResponse.ok) {
                        const unsplashData = await unsplashResponse.json();
                        header_image_url = unsplashData.results?.[0]?.urls?.regular;
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
                const unsplashApiKey = Deno.env.get('VITE_UNSPLASH_ACCESS_KEY');
                if (!unsplashApiKey) return "The Unsplash API key is not configured on the server.";
                
                const unsplashResponse = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(updates.header_image_search_query)}&per_page=1&orientation=landscape`, {
                    headers: { Authorization: `Client-ID ${unsplashApiKey}` }
                });
                if (unsplashResponse.ok) {
                    const unsplashData = await unsplashResponse.json();
                    const imageUrl = unsplashData.results?.[0]?.urls?.regular;
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