import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, User, Reaction, Comment as CommentType, PaymentStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { addHours } from 'date-fns';

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

    const updatePaymentStatus = useMutation({
        mutationFn: async ({ projectId, status }: { projectId: string, status: PaymentStatus }) => {
            const { error } = await supabase
                .from('projects')
                .update({ payment_status: status })
                .eq('id', projectId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Payment status updated');
            invalidateProjectQueries();
        },
        onError: (err: any) => {
            toast.error('Failed to update payment status', { description: getErrorMessage(err) });
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
        onError: (err: any) => toast.error("File upload failed.", { description: getErrorMessage(err) }),
    });

    const deleteFile = useMutation({
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
        onError: (err: any) => toast.error(getErrorMessage(err)),
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
        deleteProject,
        updateProjectStatus,
        updatePaymentStatus,
        toggleProjectReaction,
    };
};