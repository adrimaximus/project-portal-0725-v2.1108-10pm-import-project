import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, User, Reaction } from '@/types';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';

export const useProjectMutations = (slug?: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();

    const invalidateProjectQueries = () => {
        if (slug) {
            queryClient.invalidateQueries({ queryKey: ['project', slug] });
        }
        queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const updateProjectStatus = useMutation({
        mutationFn: async ({ projectId, status }: { projectId: string, status: string }) => {
            const { error } = await supabase.rpc('update_project_status', {
                p_project_id: projectId,
                p_new_status: status,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Project status updated');
            invalidateProjectQueries();
        },
        onError: (err: any) => {
            toast.error('Failed to update project status', { description: getErrorMessage(err) });
        }
    });

    const updateProject = useMutation<Project, Error, Project>({
        mutationFn: async (editedProject: Project): Promise<Project> => {
            const { id, person_ids, ...projectDetails } = editedProject as any;
            
            const { data, error } = await supabase
                .rpc('update_project_details', {
                    p_project_id: id,
                    p_name: projectDetails.name,
                    p_description: projectDetails.description || null,
                    p_category: projectDetails.category || null,
                    p_status: projectDetails.status,
                    p_budget: projectDetails.budget || null,
                    p_start_date: projectDetails.start_date || null,
                    p_due_date: projectDetails.due_date || null,
                    p_payment_status: projectDetails.payment_status,
                    p_payment_due_date: projectDetails.payment_due_date || null,
                    p_members: projectDetails.assignedTo,
                    p_service_titles: projectDetails.services || [],
                    p_venue: projectDetails.venue || null,
                    p_existing_tags: (projectDetails.tags || []).filter((t: any) => !t.isNew).map((t: any) => t.id),
                    p_custom_tags: (projectDetails.tags || []).filter((t: any) => t.isNew).map(({ name, color }: any) => ({ name, color })),
                    p_invoice_number: projectDetails.invoice_number || null,
                    p_po_number: projectDetails.po_number || null,
                    p_paid_date: projectDetails.paid_date || null,
                    p_email_sending_date: projectDetails.email_sending_date || null, 
                    p_hardcopy_sending_date: projectDetails.hardcopy_sending_date || null, p_channel: projectDetails.channel || null,
                    p_client_company_id: projectDetails.client_company_id || null,
                })
                .single();
            if (error) throw error;

            if (person_ids !== undefined) {
                const { error: deleteError } = await supabase
                    .from('people_projects')
                    .delete()
                    .eq('project_id', id);
                if (deleteError) throw new Error(`Failed to update client link (delete step): ${deleteError.message}`);

                if (person_ids.length > 0) {
                    const linksToInsert = person_ids.map((personId: string) => ({
                        project_id: id,
                        person_id: personId,
                    }));
                    const { error: insertError } = await supabase
                        .from('people_projects')
                        .insert(linksToInsert);
                    if (insertError) throw new Error(`Failed to update client link (insert step): ${insertError.message}`);
                }
            }

            return data as Project;
        },
        onSuccess: (data: Project) => {
            if (slug && slug !== data.slug) {
                toast.success("Project updated successfully! Redirecting...");
                navigate(`/projects/${data.slug}`, { replace: true });
            } else {
                toast.success("Project updated successfully!");
                invalidateProjectQueries();
            }
        },
        onError: (err: any) => toast.error("Failed to save project", { description: getErrorMessage(err) }),
    });

    const addFiles = useMutation({
        mutationFn: async ({ files, project, user }: { files: File[], project: Project, user: User }) => {
            toast.info(`Uploading ${files.length} file(s)...`);
            for (const file of files) {
                const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                const filePath = `${project.id}/comments/${Date.now()}-${sanitizedFileName}`;
                const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                
                const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                if (!urlData || !urlData.publicUrl) {
                    throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
                }
                
                const { error: dbError } = await supabase.from('project_files').insert({
                    project_id: project.id, user_id: user.id, name: file.name,
                    size: file.size, type: file.type, url: urlData.publicUrl, storage_path: filePath,
                });
                if (dbError) throw new Error(`Failed to save ${file.name} to database: ${dbError.message}`);
            }
        },
        onSuccess: () => {
            toast.success("File upload complete!");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "File upload failed.")),
    });

    const deleteFile = useMutation({
        mutationFn: async (file: { id: string, storage_path: string }) => {
            const { error: storageError } = await supabase.storage.from('task-attachments').remove([file.storage_path]);
            if (storageError) throw new Error(`Failed to delete file from storage: ${storageError.message}`);
            
            const { error: dbError } = await supabase.from('project_files').delete().eq('id', file.id);
            if (dbError) throw new Error(`Failed to delete file from database: ${dbError.message}`);
        },
        onSuccess: () => {
            toast.success("File deleted successfully");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error(getErrorMessage(err)),
    });

    const addTask = useMutation({
        mutationFn: async ({ project, user, title, assigneeIds }: { project: Project, user: User, title: string, assigneeIds: string[] }) => {
            const { data: newTask, error } = await supabase.from('tasks').insert({ project_id: project.id, title, created_by: user.id }).select().single();
            if (error) throw error;

            if (newTask && assigneeIds.length > 0) {
                const assignments = assigneeIds.map(userId => ({ task_id: newTask.id, user_id: userId }));
                const { error: assignError } = await supabase.from('task_assignees').insert(assignments);
                if (assignError) {
                    console.warn('Failed to assign users:', assignError);
                    toast.warning("Task created, but couldn't assign users automatically.");
                }
            }
        },
        onSuccess: () => {
            toast.success("Task added successfully.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to add task", { description: getErrorMessage(err) }),
    });

    const updateTask = useMutation({
        mutationFn: async ({ taskId, updates }: { taskId: string, updates: any }) => {
            const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Task updated.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to update task", { description: getErrorMessage(err) }),
    });

    const assignUsersToTask = useMutation({
        mutationFn: async ({ taskId, userIds }: { taskId: string, userIds: string[] }) => {
            await supabase.from('task_assignees').delete().eq('task_id', taskId);
            if (userIds.length > 0) {
                const newAssignees = userIds.map(uid => ({ task_id: taskId, user_id: uid }));
                const { error } = await supabase.from('task_assignees').insert(newAssignees);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast.success("Task assignments updated.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to assign users", { description: getErrorMessage(err) }),
    });

    const deleteTask = useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Task deleted.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to delete task", { description: getErrorMessage(err) }),
    });

    const addComment = useMutation({
        mutationFn: async ({ project, user, text, isTicket, attachments, mentionedUserIds, replyToId }: { project: Project, user: User, text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null }) => {
            let finalCommentText = text;
            let firstAttachmentUrl: string | null = null;
            let firstAttachmentName: string | null = null;
            let attachmentsJsonb: any[] = []; // Array to store attachment metadata

            if (attachments && attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const fileId = uuidv4();
                    const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                    const filePath = `${project.id}/comments/${Date.now()}-${sanitizedFileName}`;
                    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                    if (!urlData || !urlData.publicUrl) {
                        throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
                    }
                    
                    return { 
                        id: fileId,
                        file_name: file.name, 
                        file_url: urlData.publicUrl,
                        file_type: file.type,
                        file_size: file.size,
                        storage_path: filePath,
                        created_at: new Date().toISOString(),
                    };
                });
    
                const uploadedFiles = await Promise.all(uploadPromises);
                attachmentsJsonb = uploadedFiles;
    
                if (uploadedFiles.length > 0) {
                    firstAttachmentUrl = uploadedFiles[0].file_url;
                    firstAttachmentName = uploadedFiles[0].file_name;
    
                    const markdownLinks = uploadedFiles.map(file => `* [${file.file_name}](${file.file_url})`).join('\n');
                    finalCommentText += `\n\n**Attachments:**\n${markdownLinks}`;
                }
            }
    
            const { data: commentData, error: commentError } = await supabase.from('comments').insert({
                project_id: project.id, 
                author_id: user.id, 
                text: finalCommentText, 
                is_ticket: isTicket, 
                attachment_url: firstAttachmentUrl, 
                attachment_name: firstAttachmentName,
                attachments_jsonb: attachmentsJsonb,
                reply_to_comment_id: replyToId,
            }).select().single();
            
            if (commentError) throw commentError;

            if (mentionedUserIds.length > 0) {
              supabase.functions.invoke('send-mention-email', {
                body: {
                  project_slug: project.slug,
                  project_name: project.name,
                  mentioner_name: user.name,
                  mentioned_user_ids: mentionedUserIds,
                  comment_text: text,
                  comment_id: commentData.id,
                },
              }).then(({ error }) => {
                if (error) {
                  console.error("Failed to trigger mention email notifications:", error);
                }
              });
            }
    
            if (isTicket && commentData) {
                const cleanTextForDescription = text.replace(/@\[[^\]]+\]\([^)]+\)\s*/g, '').trim();
                const taskTitle = `Ticket: ${cleanTextForDescription.substring(0, 50)}${cleanTextForDescription.length > 50 ? '...' : ''}`;

                const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
                    project_id: project.id, 
                    created_by: user.id, 
                    title: taskTitle, 
                    description: cleanTextForDescription, // Comment text as description
                    origin_ticket_id: commentData.id,
                }).select().single();
                
                if (taskError) throw new Error(`Ticket created, but failed to create task: ${taskError.message}`);
    
                if (newTask && mentionedUserIds.length > 0) {
                    // Add mentioned users to the project if they aren't already members
                    const projectMemberIds = project.assignedTo.map(m => m.id);
                    const newMemberIds = mentionedUserIds.filter(id => !projectMemberIds.includes(id));

                    if (newMemberIds.length > 0) {
                        const newMembers = newMemberIds.map(userId => ({
                            project_id: project.id,
                            user_id: userId,
                            role: 'member' as const
                        }));
                        const { error: memberError } = await supabase.from('project_members').insert(newMembers);
                        if (memberError) {
                            console.warn('Failed to add mentioned users to project:', memberError);
                            toast.warning("Couldn't add some mentioned users to the project team.");
                        }
                    }

                    // Assign users to the task
                    const assignments = mentionedUserIds.map(userId => ({
                        task_id: newTask.id,
                        user_id: userId,
                    }));
                    const { error: assignError } = await supabase.from('task_assignees').insert(assignments);
                    if (assignError) {
                        console.warn('Failed to assign mentioned users:', assignError);
                        toast.warning("Ticket created, but couldn't assign mentioned users automatically.");
                    }
                }
            }
        },
        onSuccess: (_, variables) => {
            toast.success(variables.isTicket ? "Ticket created and added to tasks." : "Comment posted.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to add comment/ticket", { description: getErrorMessage(err) }),
    });

    const updateComment = useMutation({
        mutationFn: async ({ project, commentId, text, attachments, isConvertingToTicket, mentionedUserIds }: { project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[] }) => {
            const { data: originalComment, error: fetchError } = await supabase
                .from('comments')
                .select('text, is_ticket, project_id, attachment_url, attachment_name, attachments_jsonb')
                .eq('id', commentId)
                .single();
            if (fetchError) throw fetchError;

            let newAttachmentMarkdown = '';
            let newFirstAttachmentUrl: string | null = null;
            let newFirstAttachmentName: string | null = null;
            let existingAttachmentsJsonb: any[] = originalComment.attachments_jsonb || [];
            let newAttachmentsJsonb: any[] = [];

            if (attachments && attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const fileId = uuidv4();
                    const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                    const filePath = `${originalComment.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
                    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                    if (!urlData || !urlData.publicUrl) {
                        throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
                    }

                    return { 
                        id: fileId,
                        file_name: file.name, 
                        file_url: urlData.publicUrl,
                        file_type: file.type,
                        file_size: file.size,
                        storage_path: filePath,
                        created_at: new Date().toISOString(),
                    };
                });
    
                newAttachmentsJsonb = await Promise.all(uploadPromises);
                existingAttachmentsJsonb = [...existingAttachmentsJsonb, ...newAttachmentsJsonb];
    
                if (newAttachmentsJsonb.length > 0) {
                    newAttachmentMarkdown = newAttachmentsJsonb.map(file => `* [${file.file_name}](${file.file_url})`).join('\n');
                    if (!originalComment.attachment_url) {
                        newFirstAttachmentUrl = newAttachmentsJsonb[0].file_url;
                        newFirstAttachmentName = newAttachmentsJsonb[0].file_name;
                    }
                }
            }

            const attachmentsRegex = /\n\n\*\*Attachments:\*\*[\s\S]*$/s;
            let finalCommentText = text;

            if (existingAttachmentsJsonb.length > 0) {
                const markdownLinks = existingAttachmentsJsonb.map(file => `* [${file.file_name}](${file.file_url})`).join('\n');
                const fullAttachmentMarkdown = `\n\n**Attachments:**\n${markdownLinks}`;
                
                finalCommentText = finalCommentText.replace(attachmentsRegex, '').trim() + fullAttachmentMarkdown;
            } else {
                finalCommentText = finalCommentText.replace(attachmentsRegex, '').trim();
            }

            const updatePayload: any = {
                text: finalCommentText,
                is_ticket: isConvertingToTicket || originalComment.is_ticket,
                attachments_jsonb: existingAttachmentsJsonb,
            };
            if (newFirstAttachmentUrl) {
                updatePayload.attachment_url = newFirstAttachmentUrl;
                updatePayload.attachment_name = newFirstAttachmentName;
            }

            const { error: updateError } = await supabase.from('comments').update(updatePayload).eq('id', commentId);
            if (updateError) throw updateError;

            if (mentionedUserIds.length > 0) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const { data: projectData } = await supabase.from('projects').select('slug, name').eq('id', originalComment.project_id).single();
                  const { data: mentionerData } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', user.id).single();
                  const mentionerName = `${mentionerData?.first_name || ''} ${mentionerData?.last_name || ''}`.trim() || mentionerData?.email || 'A user';

                  if (projectData) {
                    supabase.functions.invoke('send-mention-email', {
                      body: {
                        project_slug: projectData.slug,
                        project_name: projectData.name,
                        mentioner_name: mentionerName,
                        mentioned_user_ids: mentionedUserIds,
                        comment_text: text,
                        comment_id: commentId,
                      },
                    }).then(({ error }) => {
                      if (error) {
                        console.error("Failed to trigger mention email notifications on update:", error);
                      }
                    });
                  }
              }
            }

            if (isConvertingToTicket && !originalComment.is_ticket) {
                const cleanTextForDescription = text.replace(/@\[[^\]]+\]\([^)]+\)\s*/g, '').trim();
                const taskTitle = `Ticket: ${cleanTextForDescription.substring(0, 50)}${cleanTextForDescription.length > 50 ? '...' : ''}`;

                const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
                    project_id: originalComment.project_id,
                    title: taskTitle, 
                    description: cleanTextForDescription,
                    origin_ticket_id: commentId,
                }).select().single();
                if (taskError) {
                    toast.warning("Comment updated, but failed to create the associated task.");
                }
    
                if (newTask && mentionedUserIds.length > 0) {
                    const projectMemberIds = project.assignedTo.map(m => m.id);
                    const newMemberIds = mentionedUserIds.filter(id => !projectMemberIds.includes(id));

                    if (newMemberIds.length > 0) {
                        const newMembers = newMemberIds.map(userId => ({
                            project_id: project.id,
                            user_id: userId,
                            role: 'member' as const
                        }));
                        const { error: memberError } = await supabase.from('project_members').insert(newMembers);
                        if (memberError) {
                            console.warn('Failed to add mentioned users to project:', memberError);
                            toast.warning("Couldn't add some mentioned users to the project team.");
                        }
                    }

                    const assignments = mentionedUserIds.map(userId => ({
                        task_id: newTask.id,
                        user_id: userId,
                    }));
                    const { error: assignError } = await supabase.from('task_assignees').insert(assignments);
                    if (assignError) {
                        console.warn('Failed to assign mentioned users:', assignError);
                        toast.warning("Ticket created, but couldn't assign mentioned users automatically.");
                    }
                }
            }
        },
        onSuccess: () => {
            toast.success("Comment updated.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to update comment", { description: getErrorMessage(err) }),
    });

    const deleteComment = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase.rpc('delete_comment_and_task', { p_comment_id: commentId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Comment deleted.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to delete comment", { description: getErrorMessage(err) }),
    });

    const deleteProject = useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Project deleted successfully.");
            invalidateProjectQueries();
            navigate('/projects');
        },
        onError: (err: any) => toast.error("Failed to delete project.", { description: getErrorMessage(err) }),
    });

    const toggleCommentReaction = useMutation({
        mutationFn: async ({ commentId, emoji }: { commentId: string, emoji: string }) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.rpc('toggle_comment_reaction', {
                p_comment_id: commentId,
                p_emoji: emoji,
            });
            if (error) throw error;
        },
        onMutate: async ({ commentId, emoji }) => {
            await queryClient.cancelQueries({ queryKey: ['project', slug] });
            const previousProject = queryClient.getQueryData<Project>(['project', slug]);

            if (previousProject && user) {
                const newProject = {
                    ...previousProject,
                    comments: previousProject.comments.map(comment => {
                        if (comment.id === commentId) {
                            const newReactions = [...(comment.reactions || [])];
                            const existingReactionIndex = newReactions.findIndex(r => r.user_id === user.id);

                            if (existingReactionIndex > -1) {
                                if (newReactions[existingReactionIndex].emoji === emoji) {
                                    newReactions.splice(existingReactionIndex, 1);
                                } else {
                                    newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], emoji };
                                }
                            } else {
                                newReactions.push({
                                    id: `temp-${Date.now()}`,
                                    emoji,
                                    user_id: user.id,
                                    user_name: user.name || 'You',
                                } as Reaction);
                            }
                            return { ...comment, reactions: newReactions };
                        }
                        return comment;
                    })
                };
                queryClient.setQueryData(['project', slug], newProject);
            }
            return { previousProject };
        },
        onError: (err, variables, context) => {
            if (context?.previousProject) {
                queryClient.setQueryData(['project', slug], context.previousProject);
            }
            toast.error("Failed to update reaction.", { description: getErrorMessage(err) });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['project', slug] });
        },
    });

    const toggleProjectReaction = useMutation({
        mutationFn: async ({ projectId, emoji }: { projectId: string, emoji: string }) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.rpc('toggle_project_reaction', {
                p_project_id: projectId,
                p_emoji: emoji,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            invalidateProjectQueries();
        },
        onError: (err: any) => {
            toast.error("Failed to update reaction.", { description: getErrorMessage(err) });
        },
    });

    return {
        updateProject,
        addFiles,
        deleteFile,
        addTask,
        updateTask,
        assignUsersToTask,
        deleteTask,
        addComment,
        updateComment,
        deleteComment,
        deleteProject,
        toggleCommentReaction,
        updateProjectStatus,
        toggleProjectReaction,
    };
};