import { supabase } from '@/integrations/supabase/client';
import { Task, UpsertTaskPayload } from '@/types';

export const getProjectTasks = async (filters: any): Promise<Task[]> => {
  const { data, error } = await supabase.rpc('get_project_tasks', {
    p_project_ids: filters.projectIds || null,
    p_completed: filters.completed,
    p_order_by: filters.orderBy || 'due_date',
    p_order_direction: filters.orderDirection || 'asc',
    p_limit: filters.limit || 1000,
    p_offset: filters.offset || 0,
  });
  if (error) throw error;
  return data as Task[];
};

export const upsertTask = async (taskData: UpsertTaskPayload): Promise<Task> => {
    const { data, error } = await supabase.rpc('upsert_task_with_details', {
        p_id: taskData.id || null,
        p_project_id: taskData.project_id,
        p_title: taskData.title,
        p_description: taskData.description,
        p_due_date: taskData.due_date,
        p_priority: taskData.priority,
        p_status: taskData.status,
        p_completed: taskData.completed,
        p_assignee_ids: taskData.assignee_ids,
        p_tag_ids: taskData.tag_ids,
    }).select().single();
    if (error) throw error;
    return data as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
};

export const toggleTaskCompletion = async ({ taskId, completed }: { taskId: string, completed: boolean }): Promise<void> => {
    const { error } = await supabase.from('tasks').update({ completed, status: completed ? 'Done' : 'In Progress' }).eq('id', taskId);
    if (error) throw error;
};