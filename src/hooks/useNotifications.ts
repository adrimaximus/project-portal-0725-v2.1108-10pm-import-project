import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchNotifications = async ({ pageParam = 0 }) => {
    const { data, error } = await supabase.rpc('get_user_notifications', {
      p_limit: 10,
      p_offset: pageParam * 10,
    });

    if (error) {
      throw new Error(error.message);
    }
    return data as Notification[];
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery(['notifications', user?.id], fetchNotifications, {
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation(
    async (notificationId: string) => {
      const { error } = await supabase.rpc('update_my_notification_status', {
        notification_id: notificationId,
        is_read: true,
      });
      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications', user?.id]);
      },
      onError: (err: Error) => {
        toast.error(`Failed to mark as read: ${err.message}`);
      },
    }
  );

  const markAllAsReadMutation = useMutation(
    async () => {
      const { error } = await supabase.rpc('mark_all_my_notifications_as_read');
      if (error) throw new Error(error.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications', user?.id]);
      },
      onError: (err: Error) => {
        toast.error(`Failed to mark all as read: ${err.message}`);
      },
    }
  );

  const notifications = data?.pages.flatMap(page => page) ?? [];
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};