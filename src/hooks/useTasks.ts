import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Task } from '../types/task';

interface UseTasksOptions {
  projectIds?: string[];
  completed?: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  enabled?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const {
    projectIds,
    completed,
    limit = 100,
    page = 0,
    orderBy = 'kanban_order',
    orderDirection = 'asc',
    enabled = true,
  } = options;
  
  const queryKey = ['tasks', { projectIds, completed, limit, page, orderBy, orderDirection }];

  const fetchTasks = async () => {
    const { data, error } = await supabase.rpc('get_project_tasks', {
      p_project_ids: projectIds || null,
      p_completed: completed === undefined ? null : completed,
      p_limit: limit,
      p_offset: page * limit,
      p_order_by: orderBy,
      p_order_direction: orderDirection
    });
    
    if (error) throw new Error(error.message);
    
    const formattedTasks: Task[] = data?.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      due_date: task.due_date,
      priority: task.priority,
      project_id: task.project_id,
      projects: {
        id: task.project_id,
        name: task.project_name,
        slug: task.project_slug,
        status: task.project_status,
        created_by: null
      },
      assignees: task.assignees,
      created_by: task.created_by,
      created_at: task.created_at,
      status: task.status,
      tags: task.tags,
      originTicketId: task.origin_ticket_id,
    }));
    
    return formattedTasks || [];
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery<Task[], Error>({
    queryKey,
    queryFn: fetchTasks,
    enabled,
  });

  return { tasks: data ?? [], loading: isLoading, error, refetch, isFetching };
}