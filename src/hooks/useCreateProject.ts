import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project } from '@/types';

type NewProjectData = {
    name: string;
    description?: string;
    category?: string;
    startDate?: string;
    dueDate?: string;
    budget?: number;
    origin_event_id?: string;
    venue?: string;
    client_company_id?: string | null;
};

const createProject = async (projectData: NewProjectData): Promise<Project> => {
    const { data, error } = await supabase
      .rpc('create_project', {
        p_name: projectData.name,
        p_description: projectData.description,
        p_category: projectData.category,
        p_start_date: projectData.startDate,
        p_due_date: projectData.dueDate,
        p_budget: projectData.budget,
        p_origin_event_id: projectData.origin_event_id,
        p_venue: projectData.venue,
        p_client_company_id: projectData.client_company_id,
      })
      .single();

    if (error) {
        console.error('Error creating project via RPC:', error);
        throw new Error(error.message);
    }

    return data as Project;
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProject,
        onSuccess: (data) => {
            toast.success(`Proyek "${data.name}" berhasil dibuat.`);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: Error) => {
            toast.error(`Gagal membuat proyek: ${error.message}`);
        },
    });
};