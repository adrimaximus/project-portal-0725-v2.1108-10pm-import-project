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

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_tasks_as_read');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All tasks marked as read');
      refetch();
      // Invalidate tasks to refresh UI
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
          // When we view a task, refresh the list immediately
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
           // When tasks are updated/created, refresh
           refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => {
           // New comments make tasks unread
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