import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';

const NOTIFICATIONS_PER_PAGE = 20;
const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

const fetchNotifications = async (pageParam: number = 0): Promise<Notification[]> => {
  const { data, error } = await supabase
    .rpc('get_user_notifications', { p_limit: NOTIFICATIONS_PER_PAGE, p_offset: pageParam * NOTIFICATIONS_PER_PAGE });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error(error.message);
  }

  return data.map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    created_at: n.created_at,
    read_at: n.read_at,
    link: n.data?.link || '#',
    actor: {
      id: n.actor.id,
      name: n.actor.name,
      avatar: n.actor.avatar_url,
    }
  }));
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['notifications', user?.id];

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Notification[], Error, InfiniteData<Notification[]>, (string | undefined)[] | undefined, number>({
    queryKey,
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === NOTIFICATIONS_PER_PAGE ? allPages.length : undefined;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[Dyad Debug] Notification received:', payload);
          const newNotificationId = payload.new.notification_id;
          const { data } = await supabase.from('notifications').select('title, body, type').eq('id', newNotificationId).single();
          
          if (data) {
            console.log('[Dyad Debug] Fetched notification details:', data);
            toast.info(data.title, {
              description: data.body,
            });

            // Play sound logic
            const userPreferences = (user as any).notification_preferences;
            console.log('[Dyad Debug] User preferences:', userPreferences);

            const isNotificationTypeEnabled = userPreferences?.[data.type] !== false; // default to true
            const tone = userPreferences?.tone;
            console.log(`[Dyad Debug] Type enabled: ${isNotificationTypeEnabled}, Tone: ${tone}`);

            if (isNotificationTypeEnabled && tone && tone !== 'none') {
              const audioUrl = `${TONE_BASE_URL}${tone}`;
              console.log(`[Dyad Debug] Attempting to play sound: ${audioUrl}`);
              try {
                const audio = new Audio(audioUrl);
                await audio.play();
                console.log('[Dyad Debug] Sound played successfully.');
              } catch (e: any) {
                console.error("[Dyad Debug] Error playing notification sound:", e);
                if (e.name === 'NotAllowedError') {
                  toast.error("Could not play notification sound.", {
                    description: "Browser security may have blocked it. Please click anywhere on the page to enable sound for notifications.",
                    duration: 10000,
                  });
                } else {
                  toast.error("An error occurred while trying to play the notification sound.");
                }
              }
            }
          }
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const notifications = data?.pages.flatMap(page => page) ?? [];
  const unreadCount = notifications.filter(n => !n.read_at).length;

  const updateNotificationStatus = (notificationId: string, read: boolean) => {
    queryClient.setQueryData<InfiniteData<Notification[]>>(queryKey, (oldData) => {
      if (!oldData) return undefined;
      return {
        ...oldData,
        pages: oldData.pages.map(page =>
          page.map(notification =>
            notification.id === notificationId
              ? { ...notification, read_at: read ? new Date().toISOString() : null }
              : notification
          )
        )
      };
    });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('update_my_notification_status', {
        notification_id: notificationId,
        is_read: true,
      });
      if (error) throw error;
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData<InfiniteData<Notification[]>>(queryKey);
      updateNotificationStatus(notificationId, true);
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      toast.error("Failed to mark notification as read.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('update_my_notification_status', {
        notification_id: notificationId,
        is_read: false,
      });
      if (error) throw error;
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData<InfiniteData<Notification[]>>(queryKey);
      updateNotificationStatus(notificationId, false);
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      toast.error("Failed to mark notification as unread.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.rpc('mark_all_my_notifications_as_read');
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData<InfiniteData<Notification[]>>(queryKey);
      queryClient.setQueryData<InfiniteData<Notification[]>>(queryKey, (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          pages: oldData.pages.map(page =>
            page.map(notification => ({ ...notification, read_at: new Date().toISOString() }))
          )
        };
      });
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("All notifications marked as read.");
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      toast.error("Failed to mark all notifications as read.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};