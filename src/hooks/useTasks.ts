import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types";

const TASKS_PER_PAGE = 50;

export const useTasks = (filters: { 
  projectIds?: string[] | null; 
  completed?: boolean; 
  orderBy?: string; 
  orderDirection?: 'asc' | 'desc'; 
}) => {
  return useInfiniteQuery({
    queryKey: ['tasks', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('get_project_tasks', {
        p_project_ids: filters.projectIds,
        p_completed: filters.completed,
        p_order_by: filters.orderBy,
        p_order_direction: filters.orderDirection,
        p_limit: TASKS_PER_PAGE,
        p_offset: pageParam * TASKS_PER_PAGE,
      });

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }
      
      return data as Task[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < TASKS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
  });
};