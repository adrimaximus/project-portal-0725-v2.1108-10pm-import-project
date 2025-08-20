import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type NewProjectData = {
    name: string;
    description?: string;
    category?: string;
    startDate?: string;
    dueDate?: string;
    budget?: number;
    origin_event_id?: string;
    venue?: string;
    status?: string;
};

const createProject = async (projectData: NewProjectData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak diautentikasi");

    const dataToInsert = {
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        start_date: projectData.startDate,
        due_date: projectData.dueDate,
        budget: projectData.budget,
        origin_event_id: projectData.origin_event_id,
        venue: projectData.venue,
        status: projectData.status || 'Requested',
    };

    const { data, error } = await supabase.from('projects').insert(dataToInsert).select().single();

    if (error) {
        console.error('Error creating project:', error);
        throw new Error(error.message);
    }
    return data;
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