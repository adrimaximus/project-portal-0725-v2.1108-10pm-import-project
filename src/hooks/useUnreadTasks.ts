import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useUnreadTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadTaskIds = [], refetch } = useQuery({
    queryKey: ['unread_tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_unread_task_ids');
      if (error) {
        console.error('Error fetching unread tasks:', error);
        return [];
      }
      return (data || []).map((t: { task_id: string }) => t.task_id);
    },
    enabled: !!user,
    // Refetch more aggressively to keep UI in sync
    staleTime: 0, 
  });

  const undoMarkReadMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      if (!taskIds || taskIds.length === 0) return;
      const { error } = await supabase.rpc('mark_tasks_as_unread', { p_task_ids: taskIds });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Undo successful. Notifications restored.');
      refetch();
      // Invalidate tasks to refresh UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to undo action.');
      console.error(error);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('mark_all_tasks_as_read');
      if (error) throw error;
      return data as string[];
    },
    onSuccess: (markedTaskIds) => {
      if (markedTaskIds && markedTaskIds.length > 0) {
        toast.success('All tasks marked as read', {
          action: {
            label: 'Undo',
            onClick: () => undoMarkReadMutation.mutate(markedTaskIds),
          },
          duration: 5000,
        });
      } else {
        toast.success('All tasks marked as read');
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to mark tasks as read');
      console.error(error);
    }
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('unread-tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_views', filter: `user_id=eq.${user.id}` },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
           refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => {
           refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return { 
    unreadTaskIds, 
    refetch,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending
  };
};