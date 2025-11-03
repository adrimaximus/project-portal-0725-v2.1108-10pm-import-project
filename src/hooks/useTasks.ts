import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';

type UseTasksProps = {
  projectIds?: string[];
  hideCompleted?: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  enabled?: boolean;
};

export const useTasks = ({ projectIds, hideCompleted, sortConfig, enabled = true }: UseTasksProps) => {
  return useQuery<Task[], Error>({
    queryKey: ['tasks', { projectIds, hideCompleted, sortConfig }],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_tasks', {
        p_project_ids: projectIds,
        p_completed: hideCompleted ? false : undefined,
        p_order_by: sortConfig.key,
        p_order_direction: sortConfig.direction,
        p_limit: 1000, // A reasonable limit for tasks display
        p_offset: 0,
      });

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }
      return data || [];
    },
    enabled,
  });
};