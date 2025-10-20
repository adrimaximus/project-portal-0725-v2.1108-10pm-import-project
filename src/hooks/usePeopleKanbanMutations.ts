import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person } from '@/types';

type UpdatePeopleOrderPayload = {
    newPeopleState: Person[];
    activeId: string;
    sourceContainerId: string;
    destContainerId: string;
    sourceColumnIds: string[];
    destColumnIds: string[];
};

export const usePeopleKanbanMutations = () => {
    const queryClient = useQueryClient();

    const { mutate: updatePeopleOrder } = useMutation({
        mutationFn: async (payload: UpdatePeopleOrderPayload) => {
            const { activeId, sourceContainerId, destContainerId, sourceColumnIds, destColumnIds } = payload;
            if (sourceContainerId !== destContainerId) {
                const { error: tagError } = await supabase.rpc('update_person_tags', {
                    p_person_id: activeId,
                    p_tag_to_remove_id: sourceContainerId === 'uncategorized' ? null : sourceContainerId,
                    p_tag_to_add_id: destContainerId === 'uncategorized' ? null : destContainerId,
                });
                if (tagError) throw tagError;
            }

            const promises = [];
            if (sourceContainerId !== destContainerId && sourceColumnIds.length > 0) {
                promises.push(supabase.rpc('update_person_kanban_order', { p_person_ids: sourceColumnIds }));
            }
            if (destColumnIds.length > 0) {
                promises.push(supabase.rpc('update_person_kanban_order', { p_person_ids: destColumnIds }));
            }
            
            const results = await Promise.all(promises);
            for (const result of results) {
                if (result.error) throw result.error;
            }
        },
        onMutate: async ({ newPeopleState }) => {
            await queryClient.cancelQueries({ queryKey: ['people', 'with-slug'] });
            const previousPeople = queryClient.getQueryData<Person[]>(['people', 'with-slug']);
            queryClient.setQueryData<Person[]>(['people', 'with-slug'], newPeopleState);
            return { previousPeople };
        },
        onError: (err: any, variables, context) => {
            if (context?.previousPeople) {
                queryClient.setQueryData(['people', 'with-slug'], context.previousPeople);
            }
            toast.error(`Failed to move person: ${err.message}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['people', 'with-slug'] });
        },
    });

    return { updatePeopleOrder };
};