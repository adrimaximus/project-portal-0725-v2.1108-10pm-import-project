import { useQuery, useQueryClient, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';

const NOTIFICATIONS_PER_PAGE = 10;

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
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_limit: NOTIFICATIONS_PER_PAGE,
        p_offset: pageParam * NOTIFICATIONS_PER_PAGE,
      });
      if (error) throw error;
      return data as Notification[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < NOTIFICATIONS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
    enabled: !!user,
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
      toast.error(`Failed to mark notification as read: ${error.message}`);
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
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
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
  };
};