import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Task } from '@/types';

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

  return useMutation(
    async (taskData: UpsertTaskPayload) => {
      // This is a placeholder for more complex file handling logic if needed.
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

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Task saved successfully.');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
      onError: (error: Error) => {
        toast.error(`Failed to save task: ${error.message}`);
      },
    }
  );
};

export const useToggleTaskCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ task, completed }: { task: Task; completed: boolean }) => {
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

      if (error) {
        throw new Error(error.message);
      }
    },
    {
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
    }
  );
};