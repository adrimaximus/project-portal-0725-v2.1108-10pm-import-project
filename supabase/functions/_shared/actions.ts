// @ts-nocheck
import { createApi as createUnsplashApi } from 'https://esm.sh/unsplash-js@7.0.19';

export async function executeAction(actionData, context) {
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
                const { title, content, folder_name, header_image_search_query } = actionData.article_details;
                let folder_id = folders.find(f => f.name.toLowerCase() === folder_name?.toLowerCase())?.id;
                let header_image_url = null;

                if (header_image_search_query) {
                    const unsplash = createUnsplashApi({ accessKey: Deno.env.get('VITE_UNSPLASH_ACCESS_KEY')! });
                    const photo = await unsplash.search.getPhotos({ query: header_image_search_query, perPage: 1 });
                    if (photo.response?.results[0]) {
                        header_image_url = photo.response.results[0].urls.regular;
                    }
                }

                if (!folder_id) {
                    const { data: defaultFolderData, error: folderError } = await userSupabase.rpc('create_default_kb_folder').single();
                    if (folderError || !defaultFolderData) return `I couldn't find or create a default folder for the article: ${folderError?.message}`;
                    folder_id = defaultFolderData.id;
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
                    const unsplash = createUnsplashApi({ accessKey: Deno.env.get('VITE_UNSPLASH_ACCESS_KEY')! });
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