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
    description: n.body,
    timestamp: n.created_at,
    read: n.read_at !== null,
    link: n.data?.link || '#',
    actor: {
      id: n.actor.id,
      name: n.actor.name,
      avatar: n.actor.avatar_url,
    }
  }));
};

// A simple lock to prevent multiple sounds from playing at once.
let isSoundPlaying = false;
const audio = new Audio();
audio.onended = () => {
  isSoundPlaying = false;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['notifications', user?.id];

  const {
    data,
    isLoading,
    error,
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
          
          // 1. Fetch latest user preferences to avoid stale data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('[Dyad Debug] Could not fetch latest profile for notification sound.', profileError);
            queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
            return;
          }
          
          const userPreferences = profileData.notification_preferences || {};

          // 2. Fetch notification details
          const newNotificationId = payload.new.notification_id;
          const { data: notificationData } = await supabase.from('notifications').select('title, body, type').eq('id', newNotificationId).single();
          
          if (notificationData) {
            console.log('[Dyad Debug] Fetched notification details:', notificationData);

            // 3. Handle Toast Notification
            const toastsEnabled = userPreferences.toast_enabled !== false;
            let canShowToast = toastsEnabled;
            if (notificationData.type === 'comment' && window.location.pathname.startsWith('/chat')) {
              canShowToast = false;
              console.log('[Dyad Debug] Suppressing chat toast because user is on chat page.');
            }

            if (canShowToast) {
              toast.info(notificationData.title, {
                description: notificationData.body,
              });
            }

            // 4. Handle Sound Notification with Lock
            const isNotificationTypeEnabled = userPreferences?.[notificationData.type] !== false;
            const tone = userPreferences?.tone;
            console.log(`[Dyad Debug] Type enabled: ${isNotificationTypeEnabled}, Tone: ${tone}`);

            let canPlaySound = true;
            if (notificationData.type === 'comment' && window.location.pathname.startsWith('/chat')) {
              canPlaySound = false;
              console.log('[Dyad Debug] Suppressing chat sound because user is on chat page.');
            }

            if (isNotificationTypeEnabled && tone && tone !== 'none' && canPlaySound) {
              if (!isSoundPlaying) {
                isSoundPlaying = true;
                const audioUrl = `${TONE_BASE_URL}${tone}`;
                console.log(`[Dyad Debug] Attempting to play sound: ${audioUrl}`);
                audio.src = audioUrl;
                audio.play().catch(e => {
                  console.error("[Dyad Debug] Error playing notification sound:", e);
                  isSoundPlaying = false; // Release lock on error
                  if (e.name === 'NotAllowedError') {
                    toast.error("Could not play notification sound.", {
                      description: "Browser security may have blocked it. Please click anywhere on the page to enable sound for notifications.",
                      duration: 10000,
                    });
                  }
                });
              } else {
                console.log('[Dyad Debug] Sound playback skipped, another sound is already playing.');
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
  const unreadCount = notifications.filter(n => !n.read).length;

  const updateNotificationStatus = (notificationId: string, read: boolean) => {
    queryClient.setQueryData<InfiniteData<Notification[]>>(queryKey, (oldData) => {
      if (!oldData) return undefined;
      return {
        ...oldData,
        pages: oldData.pages.map(page =>
          page.map(notification =>
            notification.id === notificationId
              ? { ...notification, read }
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
            page.map(notification => ({ ...notification, read: true }))
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
    error,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};