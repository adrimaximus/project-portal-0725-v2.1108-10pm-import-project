import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Task, TaskStatus, Reaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: string;
  status?: string;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
};

type UpdateTaskOrderPayload = {
  taskId: string;
  newStatus: TaskStatus;
  orderedTaskIds: string[];
  newTasks: Task[]; // For optimistic update
  queryKey: any[]; // For optimistic update
};

export const useTaskMutations = (refetch?: () => void) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    if (refetch) {
      refetch();
    }
  };

  const { mutate: upsertTask, isPending: isUpserting } = useMutation({
    mutationFn: async (taskData: UpsertTaskPayload) => {
      // Step 1: Upsert the task details and get the task ID
      const { data: taskResult, error: rpcError } = await supabase.rpc('upsert_task_with_details', {
        p_id: taskData.id || null,
        p_project_id: taskData.project_id,
        p_title: taskData.title,
        p_description: taskData.description || null,
        p_due_date: taskData.due_date || null,
        p_priority: taskData.priority || 'Normal',
        p_status: taskData.status || 'To do',
        p_completed: taskData.completed || false,
        p_assignee_ids: taskData.assignee_ids || [],
        p_tag_ids: taskData.tag_ids || [],
      }).select().single();

      if (rpcError) throw rpcError;
      const taskId = taskResult.id;

      // Step 2: Handle deleted files
      if (taskData.deleted_files && taskData.deleted_files.length > 0) {
        const { data: filesToDelete, error: fetchFilesError } = await supabase
          .from('task_attachments')
          .select('id, storage_path')
          .in('id', taskData.deleted_files);

        if (fetchFilesError) throw new Error(`Could not fetch files to delete: ${fetchFilesError.message}`);

        if (filesToDelete && filesToDelete.length > 0) {
          const storagePaths = filesToDelete.map(f => f.storage_path);
          if (storagePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from('project-files').remove(storagePaths);
            if (storageError) console.warn("Failed to delete some files from storage:", storageError.message);
          }

          const { error: dbError } = await supabase.from('task_attachments').delete().in('id', taskData.deleted_files);
          if (dbError) throw new Error(`Failed to delete file records: ${dbError.message}`);
        }
      }

      // Step 3: Handle new file uploads
      if (taskData.new_files && taskData.new_files.length > 0) {
        const uploadPromises = taskData.new_files.map(async (file) => {
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${taskData.project_id}/${taskId}/${Date.now()}-${sanitizedFileName}`;
          
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);

          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          
          return {
            task_id: taskId,
            uploaded_by: user?.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            file_type: file.type,
            file_size: file.size,
          };
        });

        const newAttachmentRecords = await Promise.all(uploadPromises);
        const { error: insertError } = await supabase.from('task_attachments').insert(newAttachmentRecords);
        if (insertError) throw new Error(`Failed to save attachment records: ${insertError.message}`);
      }
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

  const { mutate: updateTaskStatusAndOrder } = useMutation<
    void,
    Error,
    UpdateTaskOrderPayload,
    { previousTasks: Task[] | undefined }
  >({
    mutationFn: async ({ taskId, newStatus, orderedTaskIds }) => {
      const { error } = await supabase.rpc('update_task_status_and_order', {
        p_task_id: taskId,
        p_new_status: newStatus,
        p_ordered_task_ids: orderedTaskIds,
      });
      if (error) throw error;
    },
    onMutate: async ({ newTasks, queryKey }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, newTasks);
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(variables.queryKey, context.previousTasks);
      }
      toast.error('Failed to update task position.', { description: err.message });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const { mutate: toggleTaskReaction } = useMutation<
    void,
    Error,
    { taskId: string; emoji: string },
    { previousDataMap: Map<any[], any> }
  >({
    mutationFn: async ({ taskId, emoji }) => {
      const { error } = await supabase.rpc('toggle_task_reaction', {
        p_task_id: taskId,
        p_emoji: emoji,
      });
      if (error) throw error;
    },
    onMutate: async ({ taskId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      await queryClient.cancelQueries({ queryKey: ['project'] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousDataMap = new Map();
      if (!user) return { previousDataMap };

      const optimisticallyUpdateTaskReactions = (data: any) => {
        if (!data) return data;

        const updateReactions = (task: Task): Task => {
          if (task.id !== taskId) return task;

          const newReactions: Reaction[] = task.reactions ? [...task.reactions] : [];
          const existingReactionIndex = newReactions.findIndex(r => r.user_id === user.id);

          if (existingReactionIndex > -1) {
            const existingReaction = newReactions[existingReactionIndex];
            if (existingReaction.emoji === emoji) {
              newReactions.splice(existingReactionIndex, 1);
            } else {
              newReactions[existingReactionIndex] = { ...existingReaction, emoji };
            }
          } else {
            newReactions.push({
              id: `temp-${Date.now()}`,
              emoji,
              user_id: user.id,
              user_name: user.user_metadata?.full_name || user.email || 'You',
            });
          }
          return { ...task, reactions: newReactions };
        };

        if (Array.isArray(data)) {
          return data.map(item => item.id === taskId ? updateReactions(item) : item);
        }
        if (data.tasks && Array.isArray(data.tasks)) {
          return {
            ...data,
            tasks: data.tasks.map(task => task.id === taskId ? updateReactions(task) : task),
          };
        }
        if (data.id === taskId) {
          return updateReactions(data);
        }
        return data;
      };

      const queryCache = queryClient.getQueryCache();
      const relevantQueryKeys = queryCache.findAll()
        .map(q => q.queryKey)
        .filter(key => ['projects', 'project', 'tasks'].includes(key[0] as string));

      for (const queryKey of relevantQueryKeys) {
        const previousData = queryClient.getQueryData(queryKey);
        if (previousData) {
          previousDataMap.set(queryKey, previousData);
          const updatedData = optimisticallyUpdateTaskReactions(previousData);
          queryClient.setQueryData(queryKey, updatedData);
        }
      }

      return { previousDataMap };
    },
    onError: (err, variables, context) => {
      if (context?.previousDataMap) {
        for (const [queryKey, previousData] of context.previousDataMap.entries()) {
          queryClient.setQueryData(queryKey, previousData);
        }
      }
      toast.error("Failed to update reaction.", { description: err.message });
    },
    onSettled: () => {
      invalidateQueries();
    },
  });

  return { upsertTask, isUpserting, deleteTask, toggleTaskCompletion, isToggling, updateTaskStatusAndOrder, toggleTaskReaction };
};