import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, User, Task } from '@/types';
import { useNavigate } from 'react-router-dom';

export const useProjectMutations = (slug: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const invalidateProjectQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const useUpdateProject = () => useMutation({
        mutationFn: async (editedProject: Project) => {
            const { id, name, description, category, status, budget, start_date, due_date, payment_status, payment_due_date, services, assignedTo, venue, tags, person_ids, invoice_number, po_number, paid_date, email_sending_date, hardcopy_sending_date, channel } = editedProject;
            const { data, error } = await supabase
                .rpc('update_project_details', {
                    p_project_id: id, p_name: name, p_description: description || null,
                    p_category: category || null, p_status: status, p_budget: budget || null,
                    p_start_date: start_date || null, p_due_date: due_date || null,
                    p_payment_status: payment_status, p_payment_due_date: payment_due_date || null,
                    p_members: assignedTo,
                    p_service_titles: services || [],
                    p_venue: venue || null,
                    p_existing_tags: (tags || []).filter(t => !t.isNew).map(t => t.id),
                    p_custom_tags: (tags || []).filter(t => t.isNew).map(({ name, color }) => ({ name, color })),
                    p_invoice_number: invoice_number || null,
                    p_po_number: po_number || null,
                    p_paid_date: paid_date || null,
                    p_email_sending_date: email_sending_date || null,
                    p_hardcopy_sending_date: hardcopy_sending_date || null,
                    p_channel: channel || null,
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
                    const linksToInsert = person_ids.map(personId => ({
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
                const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
                if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                
                const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                
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
            const { error: storageError } = await supabase.storage.from('project-files').remove([file.storage_path]);
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
        mutationFn: async ({ project, user, title }: { project: Project, user: User, title: string }) => {
            const { data, error } = await supabase.from('tasks').insert({ project_id: project.id, title, created_by: user.id }).select().single();
            if (error) throw error;
            return data;
        },
        onMutate: async ({ project, user, title }) => {
            await queryClient.cancelQueries({ queryKey: ['project', slug] });
            const previousProject = queryClient.getQueryData<Project>(['project', slug]);
            if (previousProject) {
                const newTask: Partial<Task> = {
                    id: `temp-${Date.now()}`,
                    title,
                    completed: false,
                    created_by: { id: user.id, name: user.name, avatar_url: user.avatar_url, initials: user.initials, email: user.email },
                    assignees: [],
                    project_id: project.id,
                    created_at: new Date().toISOString(),
                };
                const updatedProject = { ...previousProject, tasks: [...previousProject.tasks, newTask as Task] };
                queryClient.setQueryData(['project', slug], updatedProject);
            }
            return { previousProject };
        },
        onError: (err: any, variables, context) => {
            if (context?.previousProject) queryClient.setQueryData(['project', slug], context.previousProject);
            toast.error("Failed to add task", { description: err.message });
        },
        onSettled: () => invalidateProjectQueries(),
    });

    const useUpdateTask = () => useMutation({
        mutationFn: async ({ taskId, updates }: { taskId: string, updates: any }) => {
            const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
            if (error) throw error;
        },
        onMutate: async ({ taskId, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['project', slug] });
            const previousProject = queryClient.getQueryData<Project>(['project', slug]);
            if (previousProject) {
                const updatedProject = { ...previousProject, tasks: previousProject.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task) };
                queryClient.setQueryData(['project', slug], updatedProject);
            }
            return { previousProject };
        },
        onSuccess: () => toast.success("Task updated."),
        onError: (err: any, vars, context) => {
            if (context?.previousProject) queryClient.setQueryData(['project', slug], context.previousProject);
            toast.error("Failed to update task", { description: err.message });
        },
        onSettled: () => invalidateProjectQueries(),
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
            const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select();
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error("Task not found or you don't have permission to delete it.");
            }
        },
        onMutate: async (taskId: string) => {
            await queryClient.cancelQueries({ queryKey: ['project', slug] });
            const previousProject = queryClient.getQueryData<Project>(['project', slug]);
            if (previousProject) {
                const updatedProject = { ...previousProject, tasks: previousProject.tasks.filter(task => task.id !== taskId) };
                queryClient.setQueryData(['project', slug], updatedProject);
            }
            return { previousProject };
        },
        onSuccess: () => toast.success("Task deleted."),
        onError: (err: any, taskId, context) => {
            if (context?.previousProject) queryClient.setQueryData(['project', slug], context.previousProject);
            toast.error("Failed to delete task", { description: err.message });
        },
        onSettled: () => invalidateProjectQueries(),
    });

    const useAddComment = () => useMutation({
        mutationFn: async ({ project, user, text, isTicket, attachment }: { project: Project, user: User, text: string, isTicket: boolean, attachment: File | null }) => {
            let attachment_url = null, attachment_name = null;
            if (attachment) {
                const sanitizedFileName = attachment.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                const filePath = `${project.id}/comments/${Date.now()}-${sanitizedFileName}`;
                const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, attachment);
                if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
                
                const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
                attachment_url = urlData.publicUrl;
                attachment_name = attachment.name;
            }

            const { data: commentData, error: commentError } = await supabase.from('comments').insert({
                project_id: project.id, author_id: user.id, text, is_ticket: isTicket, attachment_url, attachment_name,
            }).select().single();
            if (commentError) throw commentError;

            if (isTicket && commentData) {
                const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
                const mentionedUserIds: string[] = [];
                let match;
                while ((match = mentionRegex.exec(text)) !== null) {
                    mentionedUserIds.push(match[1]);
                }

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

    return {
        updateProject: useUpdateProject(),
        addFiles: useAddFiles(),
        deleteFile: useDeleteFile(),
        addTask: useAddTask(),
        updateTask: useUpdateTask(),
        assignUsersToTask: useAssignUsersToTask(),
        deleteTask: useDeleteTask(),
        addComment: useAddComment(),
        deleteProject: useDeleteProject(),
    };
};