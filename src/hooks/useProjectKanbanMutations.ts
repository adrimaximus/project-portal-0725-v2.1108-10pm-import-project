import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project } from '@/types';
import { getErrorMessage } from '@/lib/utils';

type GroupBy = 'status' | 'payment_status';

type UpdateProjectOrderPayload = {
    newProjects: Project[];
    finalUpdates: any[];
    groupBy: GroupBy;
    activeProjectName: string;
    newStatusLabel: string;
    movedColumns: boolean;
};

export const useProjectKanbanMutations = () => {
    const queryClient = useQueryClient();

    const { mutate: updateProjectOrder } = useMutation<
        void,
        Error,
        UpdateProjectOrderPayload,
        { previousProjects: Project[] | undefined }
    >({
        mutationFn: async ({ finalUpdates, groupBy }) => {
            const { error } = await supabase.rpc('update_project_kanban_order', {
                updates: finalUpdates,
                group_by_key: groupBy,
            });
            if (error) throw error;
        },
        onMutate: async ({ newProjects }) => {
            await queryClient.cancelQueries({ queryKey: ['projects'] });
            const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
            queryClient.setQueryData(['projects'], newProjects);
            return { previousProjects };
        },
        onError: (err: any, variables, context) => {
            if (context?.previousProjects) {
                queryClient.setQueryData(['projects'], context.previousProjects);
            }
            toast.error(`Failed to move project`, { description: getErrorMessage(err) });
        },
        onSuccess: (_, { activeProjectName, newStatusLabel, movedColumns }) => {
            if (movedColumns) {
                toast.success(`Project "${activeProjectName}" moved to ${newStatusLabel}.`);
            } else {
                toast.success(`Project order updated in ${newStatusLabel}.`);
            }
        },
        onSettled: () => {
            // Do not invalidate the query to prevent flickering.
            // The optimistic update in onMutate is sufficient.
        },
    });

    return { updateProjectOrder };
};