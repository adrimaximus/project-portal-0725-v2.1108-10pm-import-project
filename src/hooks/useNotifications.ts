import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';

const fetchNotifications = async ({ pageParam = 0, userId }: { pageParam?: number, userId: string }) => {
  const { data, error } = await supabase.rpc('get_user_notifications', {
    p_limit: 10,
    p_offset: pageParam * 10,
  });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error(error.message);
  }
  return data as Notification[];
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?.id],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam, userId: user!.id }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('update_my_notification_status', {
        notification_id: notificationId,
        is_read: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read.');
      console.error(error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_my_notifications_as_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to mark all notifications as read.');
      console.error(error);
    },
  });

  const sendTestNotificationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('send_test_notification');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Test notification sent!');
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to send test notification.');
      console.error(error);
    },
  });

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
    isMarkingAllRead: markAllAsReadMutation.isPending,
    sendTestNotification: sendTestNotificationMutation.mutate,
  };
};