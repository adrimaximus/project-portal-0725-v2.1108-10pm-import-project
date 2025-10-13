import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TaskStatus } from '@/types';

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

export const useTaskMutations = (projectId?: string) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-projects'] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  };

  const upsertTaskMutation = useMutation({
    mutationFn: async (taskData: UpsertTaskPayload) => {
      const { new_files, deleted_files, ...taskPayload } = taskData;

      const { data: upsertedTask, error } = await supabase.rpc('upsert_task_with_details', {
        p_id: taskPayload.id,
        p_project_id: taskPayload.project_id,
        p_title: taskPayload.title,
        p_description: taskPayload.description,
        p_due_date: taskPayload.due_date,
        p_priority: taskPayload.priority,
        p_status: taskPayload.status,
        p_completed: taskPayload.completed,
        p_assignee_ids: taskPayload.assignee_ids,
        p_tag_ids: taskPayload.tag_ids,
      }).select().single();

      if (error) throw error;
      if (!upsertedTask) throw new Error("Failed to upsert task. No data returned.");

      const taskId = upsertedTask.id;

      // Handle file uploads
      if (new_files && new_files.length > 0) {
        for (const file of new_files) {
          const fileExt = file.name.split('.').pop() || 'bin';
          const sanitizedFileName = file.name
            .substring(0, file.name.lastIndexOf('.') || file.name.length)
            .toLowerCase()
            .replace(/[^a-z0-9_.\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

          const filePath = `tasks/${taskId}/${Date.now()}-${sanitizedFileName}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project_files')
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`Failed to upload file: ${file.name}. ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('project_files')
            .getPublicUrl(filePath);

          const { error: insertError } = await supabase
            .from('task_attachments')
            .insert({
              task_id: taskId,
              file_name: file.name,
              file_url: publicUrl,
              storage_path: filePath,
              file_type: file.type,
              file_size: file.size,
            });
          
          if (insertError) {
            throw new Error(`Failed to save attachment record for: ${file.name}. ${insertError.message}`);
          }
        }
      }

      // Handle file deletions
      if (deleted_files && deleted_files.length > 0) {
        const { data: attachmentsToDelete, error: fetchError } = await supabase
          .from('task_attachments')
          .select('storage_path')
          .in('id', deleted_files);

        if (fetchError) {
          console.warn('Could not fetch attachments to delete:', fetchError.message);
        } else if (attachmentsToDelete) {
          const pathsToDelete = attachmentsToDelete.map(f => f.storage_path);
          if (pathsToDelete.length > 0) {
            const { error: deleteStorageError } = await supabase.storage
              .from('project_files')
              .remove(pathsToDelete);

            if (deleteStorageError) {
              console.error('Error deleting files from storage:', deleteStorageError);
              toast.error('Failed to delete some attachments from storage.');
            }
          }
        }

        const { error: deleteDbError } = await supabase
          .from('task_attachments')
          .delete()
          .in('id', deleted_files);

        if (deleteDbError) {
          throw new Error(`Failed to delete attachment records: ${deleteDbError.message}`);
        }
      }

      return upsertedTask;
    },
    onSuccess: (data, variables) => {
      toast.success(variables.id ? 'Task updated successfully!' : 'Task created successfully!');
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      return taskId;
    },
    onSuccess: () => {
      toast.success('Task deleted successfully!');
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const updateTaskStatusAndOrderMutation = useMutation({
    mutationFn: async ({ taskId, newStatus, orderedTaskIds }: { taskId: string, newStatus: TaskStatus, orderedTaskIds: string[] }) => {
      const { error: updateStatusError } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (updateStatusError) throw updateStatusError;

      const { error: updateOrderError } = await supabase.rpc('update_task_kanban_order', { p_task_ids: orderedTaskIds });
      if (updateOrderError) throw updateOrderError;
    },
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(`Error updating task: ${error.message}`);
      invalidateQueries(); // Revert optimistic update
    },
  });

  return {
    upsertTask: upsertTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateTaskStatusAndOrder: updateTaskStatusAndOrderMutation.mutate,
    isUpserting: upsertTaskMutation.isPending,
  };
};