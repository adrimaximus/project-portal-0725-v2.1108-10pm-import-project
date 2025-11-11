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
      // If an empty array is passed for projectIds, it means no projects matched the filters.
      // In this case, we should return no tasks without making an RPC call.
      // If projectIds is undefined or null, we proceed to fetch all tasks for the user.
      if (projectIds && projectIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_project_tasks', {
        p_project_ids: projectIds || null,
        p_completed: hideCompleted ? false : null,
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