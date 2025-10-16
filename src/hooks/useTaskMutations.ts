import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types';

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
};

export const useTaskMutations = (refetch?: () => void) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    if (refetch) {
      refetch();
    }
  };

  const { mutate: upsertTask, isPending: isUpserting } = useMutation({
    mutationFn: async (taskData: UpsertTaskPayload) => {
      const { error } = await supabase.rpc('upsert_task_with_details', {
        p_id: taskData.id,
        p_project_id: taskData.project_id,
        p_title: taskData.title,
        p_description: taskData.description,
        p_due_date: taskData.due_date,
        p_priority: taskData.priority,
        p_status: taskData.status,
        p_completed: taskData.completed,
        p_assignee_ids: taskData.assignee_ids,
        p_tag_ids: taskData.tag_ids,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.id ? 'Task updated successfully' : 'Task created successfully');
      invalidateQueries();
    },
    onError: (error: any) => {
      toast.error('Failed to save task', { description: error.message });
    },
  });

  const { mutate: deleteTask } = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
      invalidateQueries();
    },
    onError: (error: any) => {
      toast.error('Failed to delete task', { description: error.message });
    },
  });

  const { mutate: toggleTaskCompletion, isPending: isToggling } = useMutation({
    mutationFn: async ({ task, completed }: { task: Task, completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed, status: completed ? 'Done' : 'In progress' })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: (_, { completed }) => {
      toast.success(completed ? 'Task marked as complete' : 'Task marked as incomplete');
      invalidateQueries();
    },
    onError: (error: any) => {
      toast.error('Failed to update task', { description: error.message });
    },
  });

  const { mutate: updateTaskStatusAndOrder } = useMutation({
    mutationFn: async ({ taskId, newStatus, orderedTaskIds }: { taskId: string, newStatus: TaskStatus, orderedTaskIds: string[] }) => {
      // 1. Update the status of the moved task
      const { error: statusError } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed: newStatus === 'Done' })
        .eq('id', taskId);
      
      if (statusError) throw statusError;

      // 2. Update the order of all tasks
      const { error: orderError } = await supabase.rpc('update_task_kanban_order', {
        p_task_ids: orderedTaskIds,
      });

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      toast.success('Task position updated.');
      invalidateQueries();
    },
    onError: (error: any) => {
      toast.error('Failed to update task position.', { description: error.message });
      invalidateQueries();
    },
  });

  return { upsertTask, isUpserting, deleteTask, toggleTaskCompletion, isToggling, updateTaskStatusAndOrder };
};