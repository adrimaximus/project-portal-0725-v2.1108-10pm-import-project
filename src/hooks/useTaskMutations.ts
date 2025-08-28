import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipe untuk membuat/memperbarui tugas
export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string;
  assignee_ids?: string[];
  tag_ids?: string[];
};

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const upsertTaskMutation = useMutation({
    mutationFn: async (taskData: UpsertTaskPayload) => {
      const { assignee_ids, tag_ids, id, ...taskFields } = taskData;
      
      // 1. Upsert tugas itu sendiri
      const { data: taskResult, error: taskError } = await supabase
        .from('tasks')
        .upsert({ id, ...taskFields, completed: taskFields.status === 'Done' })
        .select()
        .single();

      if (taskError) throw taskError;
      if (!taskResult) throw new Error('Operasi tugas gagal.');

      const taskId = taskResult.id;

      // 2. Tangani penerima tugas jika disediakan
      if (assignee_ids !== undefined) {
        // Hapus penerima tugas yang ada untuk tugas ini
        const { error: deleteError } = await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', taskId);
        if (deleteError) throw deleteError;

        // Masukkan penerima tugas baru
        if (assignee_ids.length > 0) {
          const newAssignees = assignee_ids.map(userId => ({
            task_id: taskId,
            user_id: userId,
          }));
          const { error: insertError } = await supabase
            .from('task_assignees')
            .insert(newAssignees);
          if (insertError) throw insertError;
        }
      }

      // 3. Handle tags if provided
      if (tag_ids !== undefined) {
        const { error: deleteTagsError } = await supabase
          .from('task_tags')
          .delete()
          .eq('task_id', taskId);
        if (deleteTagsError) throw deleteTagsError;

        if (tag_ids.length > 0) {
          const newTaskTags = tag_ids.map(tagId => ({
            task_id: taskId,
            tag_id: tagId,
          }));
          const { error: insertTagsError } = await supabase
            .from('task_tags')
            .insert(newTaskTags);
          if (insertTagsError) throw insertTagsError;
        }
      }
      
      return taskResult;
    },
    onSuccess: (data, variables) => {
      toast.success(variables.id ? 'Tugas berhasil diperbarui!' : 'Tugas berhasil dibuat!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Juga batalkan validasi proyek karena tugas bersarang
    },
    onError: (error) => {
      toast.error('Gagal menyimpan tugas', { description: error.message });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tugas berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Gagal menghapus tugas', { description: error.message });
    },
  });

  const updateTaskOrderMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const { error } = await supabase.rpc('update_task_kanban_order', { p_task_ids: taskIds });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Gagal memperbarui urutan tugas', { description: error.message });
    },
  });

  return {
    upsertTask: upsertTaskMutation.mutate,
    isUpserting: upsertTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
    updateTaskOrder: updateTaskOrderMutation.mutate,
    isUpdatingOrder: updateTaskOrderMutation.isPending,
  };
};