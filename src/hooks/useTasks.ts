import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Task } from '../types/task';

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
    orderBy = 'due_date',
    orderDirection = 'asc',
  } = options;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  // Method 1: Using a database function (recommended for complex queries)
  const fetchTasksUsingFunction = async () => {
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
      
      // Transform the flattened data back to the expected structure
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
          created_by: null // Note: This isn't returned by our function for security
        },
        assignees: task.assignees,
        created_by: task.created_by,
        created_at: task.created_at,
        status: task.status,
        tags: task.tags,
      }));
      
      setTasks(formattedTasks || []);
      setCount(formattedTasks?.length || 0);
      
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Using Edge Function (alternative approach for very complex queries)
  const fetchTasksUsingEdgeFunction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('project-tasks', {
        body: {
          projectIds: projectIds || [],
          completed,
          limit,
          page,
          orderBy,
          orderDirection
        }
      });
      
      if (error) throw new Error(error.message);
      
      setTasks(data?.tasks || []);
      setCount(data?.count || 0);
      
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Using smaller batched queries to reduce URL length (fallback approach)
  const fetchTasksInBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // No project IDs provided
      if (!projectIds || projectIds.length === 0) {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            completed,
            description,
            due_date,
            priority,
            project_id,
            projects (
              id,
              name,
              slug,
              status,
              created_by
            ),
            task_assignees!inner (
              profiles (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            )
          `)
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range(page * limit, (page + 1) * limit - 1);
        
        if (error) throw new Error(error.message);
        setTasks(data as any[] || []);
        setCount(data?.length || 0);
        return;
      }
      
      // Split project IDs into batches of 5 to avoid URL length issues
      const batchSize = 5;
      let allTasks: any[] = [];
      
      for (let i = 0; i < projectIds.length; i += batchSize) {
        const batchIds = projectIds.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            completed,
            description,
            due_date,
            priority,
            project_id,
            projects (
              id,
              name,
              slug,
              status,
              created_by
            ),
            task_assignees (
              profiles (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            )
          `)
          .in('project_id', batchIds)
          .order(orderBy, { ascending: orderDirection === 'asc' });
        
        if (error) throw new Error(error.message);
        
        if (data && data.length > 0) {
          allTasks = [...allTasks, ...data];
        }
      }
      
      // Manual pagination after fetching all results
      const paginatedTasks = allTasks.slice(page * limit, (page + 1) * limit);
      
      setTasks(paginatedTasks);
      setCount(paginatedTasks.length);
      
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Choose which method to use based on your needs
    // Option 1: Database function (recommended)
    fetchTasksUsingFunction();
    
    // Option 2: Edge Function
    // fetchTasksUsingEdgeFunction();
    
    // Option 3: Batched queries
    // fetchTasksInBatches();
    
  }, [projectIds?.join(','), completed, limit, page, orderBy, orderDirection]);

  return { tasks, loading, error, count, refetch: fetchTasksUsingFunction };
}