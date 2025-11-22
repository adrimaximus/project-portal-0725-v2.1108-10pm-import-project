import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProjectStatusDef } from '@/types';

export const useProjectStatuses = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['project_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_statuses')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as ProjectStatusDef[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const updatePositionsMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      const { error } = await supabase.rpc('update_project_status_positions', {
        status_updates: updates,
      });
      if (error) throw error;
    },
    onMutate: async (newOrder) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project_statuses'] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<ProjectStatusDef[]>(['project_statuses']);

      // Optimistically update
      if (previousStatuses) {
        const newStatuses = [...previousStatuses].sort((a, b) => {
          const posA = newOrder.find(u => u.id === a.id)?.position ?? a.position;
          const posB = newOrder.find(u => u.id === b.id)?.position ?? b.position;
          return posA - posB;
        });
        queryClient.setQueryData(['project_statuses'], newStatuses);
      }

      return { previousStatuses };
    },
    onError: (err, newOrder, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(['project_statuses'], context.previousStatuses);
      }
      toast.error("Failed to reorder statuses.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project_statuses'] });
    },
  });

  return { ...query, updatePositions: updatePositionsMutation.mutate };
};