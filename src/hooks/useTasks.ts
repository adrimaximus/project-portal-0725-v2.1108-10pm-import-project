import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Task } from '../types/task';
import { useAuth } from '@/contexts/AuthContext';

interface UseTasksOptions {
  projectIds?: string[];
  completed?: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useTasks(options: UseTasksOptions = {}) {
  const {
    projectIds,
    completed,
    limit = 100,
    page = 0,
    orderBy = 'kanban_order',
    orderDirection = 'asc',
  } = options;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  const fetchTasksUsingFunction = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setTasks(formattedTasks || []);
      setCount(formattedTasks?.length || 0);
      
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [projectIds, completed, limit, page, orderBy, orderDirection]);

  useEffect(() => {
    fetchTasksUsingFunction();
  }, [fetchTasksUsingFunction]);

  useEffect(() => {
    if (!user) return;

    const tasksChannel = supabase
      .channel('realtime-tasks-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          console.log('Tasks table change detected, refetching tasks.');
          fetchTasksUsingFunction();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignees' },
        () => {
          console.log('Task assignees table change detected, refetching tasks.');
          fetchTasksUsingFunction();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [user, fetchTasksUsingFunction]);

  return { tasks, loading, error, count, refetch: fetchTasksUsingFunction };
}