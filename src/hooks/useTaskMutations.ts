import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types';

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
}

export const useUpsertTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: UpsertTaskPayload) => {
      const { new_files = [], deleted_files = [], ...taskDetails } = taskData;
      const payload = {
        p_id: taskDetails.id || null,
        p_project_id: taskDetails.project_id,
        p_title: taskDetails.title,
        p_description: taskDetails.description,
        p_due_date: taskDetails.due_date,
        p_priority: taskDetails.priority,
        p_status: taskDetails.status,
        p_completed: taskDetails.completed,
        p_assignee_ids: taskDetails.assignee_ids,
        p_tag_ids: taskDetails.tag_ids,
      };
      const { data, error } = await supabase.rpc('upsert_task_with_details', payload);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('Task saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save task: ${error.message}`);
    },
  });
};

export const useToggleTaskCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task, completed }: { task: Task; completed: boolean }) => {
      const newStatus = completed ? 'Done' : (task.status === 'Done' ? 'To do' : task.status);
      const payload = {
        p_id: task.id,
        p_project_id: task.project_id,
        p_title: task.title,
        p_description: task.description,
        p_due_date: task.due_date,
        p_priority: task.priority,
        p_status: newStatus,
        p_completed: completed,
        p_assignee_ids: task.assignees?.map(a => a.id) || [],
        p_tag_ids: task.tags?.map(t => t.id) || [],
      };
      const { error } = await supabase.rpc('upsert_task_with_details', payload);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ task, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map(t => t.id === task.id ? { ...t, completed, status: completed ? 'Done' : (task.status === 'Done' ? 'To do' : task.status) } : t)
      );

      return { previousTasks };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error(`Failed to update task status: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task deleted.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
};

const useUpdateTaskStatusAndOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newStatus, orderedTaskIds }: { taskId: string, newStatus: TaskStatus, orderedTaskIds: string[] }) => {
      // 1. Update status of the moved task
      const { error: statusError } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (statusError) throw statusError;

      // 2. Update the order of all tasks
      const { error: orderError } = await supabase.rpc('update_task_kanban_order', {
        p_task_ids: orderedTaskIds,
      });

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the updated state
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Invalidate projects too as tasks are nested
    },
    onError: (error: any) => {
      toast.error(`Failed to move task: ${error.message}`);
      // Revert optimistic update by refetching
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useTaskMutations = () => {
  const { mutate: upsertTask, isPending: isUpserting } = useUpsertTask();
  const { mutate: toggleTaskCompletion, isPending: isToggling } = useToggleTaskCompletion();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: updateTaskStatusAndOrder } = useUpdateTaskStatusAndOrder();

  return {
    upsertTask,
    isUpserting,
    toggleTaskCompletion,
    isToggling,
    deleteTask,
    isDeleting,
    updateTaskStatusAndOrder,
  };
};