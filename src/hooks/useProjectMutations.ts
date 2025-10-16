import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, User, Reaction } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useProjectMutations = (slug: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();

    const invalidateProjectQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const useUpdateProject = () => useMutation({
        mutationFn: async (editedProject: Project) => {
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
                    p_hardcopy_sending_date: projectDetails.hardcopy_sending_date || null,
                    p_channel: projectDetails.channel || null,
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

            return data;
        },
        onSuccess: (data: any) => {
            if (slug !== data.slug) {
                toast.success("Project updated successfully! Redirecting...");
                navigate(`/projects/${data.slug}`, { replace: true });
            } else {
                toast.success("Project updated successfully!");
                invalidateProjectQueries();
            }
        },
        onError: (err: any) => toast.error("Failed to save project", { description: err.message }),
    });

    const useAddFiles = () => useMutation({
        mutationFn: async ({ files, project, user }: { files: File[], project: Project, user: User }) => {
            toast.info(`Uploading ${files.length} file(s)...`);
            for (const file of files) {
                const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                const filePath = `${project.id}/${Date.now()}-${sanitizedFileName}`;
                const { error: uploadError } = await supabase.storage.from('task-attachments').upload(filePath, file);
                if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                
                const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(filePath);
                
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
        onError: (err: any) => toast.error(err.message),
    });

    const useDeleteFile = () => useMutation({
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
        onError: (err: any) => toast.error(err.message),
    });

    const useAddTask = () => useMutation({
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
        onError: (err: any) => toast.error("Failed to add task", { description: err.message }),
    });

    const useUpdateTask = () => useMutation({
        mutationFn: async ({ taskId, updates }: { taskId: string, updates: any }) => {
            const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Task updated.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to update task", { description: err.message }),
    });

    const useAssignUsersToTask = () => useMutation({
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
        onError: (err: any) => toast.error("Failed to assign users", { description: err.message }),
    });

    const useDeleteTask = () => useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Task deleted.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to delete task", { description: err.message }),
    });

    const useAddComment = () => useMutation({
        mutationFn: async ({ project, user, text, isTicket, attachments, mentionedUserIds }: { project: Project, user: User, text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[] }) => {
            let finalCommentText = text;
            let firstAttachmentUrl: string | null = null;
            let firstAttachmentName: string | null = null;
    
            if (attachments && attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                    const filePath = `${project.id}/comments/${Date.now()}-${sanitizedFileName}`;
                    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                    return { name: file.name, url: urlData.publicUrl };
                });
    
                const uploadedFiles = await Promise.all(uploadPromises);
    
                if (uploadedFiles.length > 0) {
                    firstAttachmentUrl = uploadedFiles[0].url;
                    firstAttachmentName = uploadedFiles[0].name;
    
                    const markdownLinks = uploadedFiles.map(file => `* [${file.name}](${file.url})`).join('\n');
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
            }).select().single();
            
            if (commentError) throw commentError;
    
            if (isTicket && commentData) {
                const cleanTextForTitle = text.replace(/@\[[^\]]+\]\([^)]+\)\s*/g, '').trim();
    
                const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
                    project_id: project.id, 
                    created_by: user.id, 
                    title: cleanTextForTitle.substring(0, 100), 
                    origin_ticket_id: commentData.id,
                }).select().single();
                
                if (taskError) throw new Error(`Ticket created, but failed to create task: ${taskError.message}`);
    
                if (newTask && mentionedUserIds.length > 0) {
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
        onError: (err: any) => toast.error(err.message),
    });

    const useUpdateComment = () => useMutation({
        mutationFn: async ({ commentId, text, attachments, isConvertingToTicket, mentionedUserIds }: { commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[] }) => {
            const { data: originalComment, error: fetchError } = await supabase
                .from('comments')
                .select('text, is_ticket, project_id, attachment_url, attachment_name')
                .eq('id', commentId)
                .single();
            if (fetchError) throw fetchError;

            let newAttachmentMarkdown = '';
            let newFirstAttachmentUrl: string | null = null;
            let newFirstAttachmentName: string | null = null;

            if (attachments && attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                    const filePath = `${originalComment.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
                    const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                    return { name: file.name, url: urlData.publicUrl };
                });
                const uploadedFiles = await Promise.all(uploadPromises);
                
                if (uploadedFiles.length > 0) {
                    newAttachmentMarkdown = uploadedFiles.map(file => `* [${file.name}](${file.url})`).join('\n');
                    if (!originalComment.attachment_url) {
                        newFirstAttachmentUrl = uploadedFiles[0].url;
                        newFirstAttachmentName = uploadedFiles[0].name;
                    }
                }
            }

            const attachmentsRegex = /\*\*Attachments:\*\*\n((?:\* \[.+\]\(.+\)\n?)+)/;
            const existingAttachmentsMatch = originalComment.text.match(attachmentsRegex);
            let finalCommentText = text;

            if (existingAttachmentsMatch) {
                finalCommentText += `\n\n${existingAttachmentsMatch[0]}`;
                if (newAttachmentMarkdown) {
                    finalCommentText += `\n${newAttachmentMarkdown}`;
                }
            } else if (newAttachmentMarkdown) {
                finalCommentText += `\n\n**Attachments:**\n${newAttachmentMarkdown}`;
            }

            const updatePayload: any = {
                text: finalCommentText,
                is_ticket: isConvertingToTicket || originalComment.is_ticket,
            };
            if (newFirstAttachmentUrl) {
                updatePayload.attachment_url = newFirstAttachmentUrl;
                updatePayload.attachment_name = newFirstAttachmentName;
            }

            const { error: updateError } = await supabase.from('comments').update(updatePayload).eq('id', commentId);
            if (updateError) throw updateError;

            if (isConvertingToTicket && !originalComment.is_ticket) {
                const cleanTextForTitle = text.replace(/@\[[^\]]+\]\([^)]+\)\s*/g, '').trim();
                const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
                    project_id: originalComment.project_id,
                    title: cleanTextForTitle.substring(0, 100),
                    origin_ticket_id: commentId,
                }).select().single();
                if (taskError) {
                    toast.warning("Comment updated, but failed to create the associated task.");
                }

                if (newTask && mentionedUserIds.length > 0) {
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
        onError: (err: any) => toast.error("Failed to update comment", { description: err.message }),
    });

    const useDeleteComment = () => useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase.rpc('delete_comment_and_task', { p_comment_id: commentId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Comment deleted.");
            invalidateProjectQueries();
        },
        onError: (err: any) => toast.error("Failed to delete comment", { description: err.message }),
    });

    const useDeleteProject = () => useMutation({
        mutationFn: async (projectId: string) => {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Project deleted successfully.");
            invalidateProjectQueries();
            navigate('/projects');
        },
        onError: (err: any) => toast.error("Failed to delete project.", { description: err.message }),
    });

    const useToggleTaskReaction = () => useMutation({
        mutationFn: async ({ taskId, emoji }: { taskId: string, emoji: string }) => {
          if (!user) throw new Error("User not authenticated");
          const { error } = await supabase.rpc('toggle_task_reaction', {
            p_task_id: taskId,
            p_emoji: emoji,
          });
          if (error) throw error;
        },
        onMutate: async ({ taskId, emoji }) => {
          if (!user) return;
    
          const queryKey = ['project', slug];
          await queryClient.cancelQueries({ queryKey });
          const previousProject = queryClient.getQueryData<Project>(queryKey);
    
          if (previousProject) {
            const updatedTasks = previousProject.tasks.map(task => {
              if (task.id === taskId) {
                const reactions = task.reactions || [];
                const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji && r.user_id === user.id);
                let newReactions: Reaction[];
    
                if (existingReactionIndex > -1) {
                  newReactions = reactions.filter((_, index) => index !== existingReactionIndex);
                } else {
                  newReactions = [...reactions, { id: `temp-${Date.now()}`, emoji, user_id: user.id, user_name: user.name }];
                }
                return { ...task, reactions: newReactions };
              }
              return task;
            });
    
            queryClient.setQueryData<Project>(queryKey, {
              ...previousProject,
              tasks: updatedTasks,
            });
          }
          return { previousProject };
        },
        onError: (err, variables, context: any) => {
          if (context?.previousProject) {
            queryClient.setQueryData(['project', slug], context.previousProject);
          }
          toast.error("Failed to update reaction.", { description: (err as Error).message });
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ['project', slug] });
        },
    });

    return {
        updateProject: useUpdateProject(),
        addFiles: useAddFiles(),
        deleteFile: useDeleteFile(),
        addTask: useAddTask(),
        updateTask: useUpdateTask(),
        assignUsersToTask: useAssignUsersToTask(),
        deleteTask: useDeleteTask(),
        addComment: useAddComment(),
        updateComment: useUpdateComment(),
        deleteComment: useDeleteComment(),
        deleteProject: useDeleteProject(),
        toggleTaskReaction: useToggleTaskReaction(),
    };
};