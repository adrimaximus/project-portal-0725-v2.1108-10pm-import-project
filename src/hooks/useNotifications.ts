import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';

const NOTIFICATIONS_PER_PAGE = 20;

const fetchNotifications = async (userId: string, pageParam: number = 0): Promise<Notification[]> => {
  const from = pageParam * NOTIFICATIONS_PER_PAGE;
  const to = from + NOTIFICATIONS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      body,
      created_at,
      resource_type,
      resource_id,
      data,
      actor:actor_id (id, first_name, last_name, avatar_url, email),
      recipients:notification_recipients!inner (read_at)
    `)
    .eq('recipients.user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

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
    read: n.recipients[0]?.read_at !== null,
    link: n.data?.link || '#',
    actor: {
      id: n.actor.id,
      name: `${n.actor.first_name || ''} ${n.actor.last_name || ''}`.trim() || n.actor.email,
      avatar: n.actor.avatar_url,
    }
  }));
};

const fetchSingleNotification = async (notificationId: string, userId: string): Promise<Notification | null> => {
    const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, type, title, body, created_at, data,
      actor:actor_id (id, first_name, last_name, avatar_url, email),
      recipients:notification_recipients!inner (read_at)
    `)
    .eq('id', notificationId)
    .eq('recipients.user_id', userId)
    .single();

    if (error || !data) {
        console.error("Error fetching single notification:", error);
        return null;
    }

    const n = data as any;
    return {
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.body,
        timestamp: n.created_at,
        read: n.recipients[0]?.read_at !== null,
        link: n.data?.link || '#',
        actor: {
            id: n.actor.id,
            name: `${n.actor.first_name || ''} ${n.actor.last_name || ''}`.trim() || n.actor.email,
            avatar: n.actor.avatar_url,
        }
    };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?.id],
    queryFn: ({ pageParam }) => fetchNotifications(user!.id, pageParam),
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
          const newNotificationId = payload.new.notification_id;
          const newNotification = await fetchSingleNotification(newNotificationId, user.id);

          if (newNotification) {
            toast.info(newNotification.title, {
              description: newNotification.description,
            });

            queryClient.setQueryData(['notifications', user.id], (oldData: any) => {
              if (!oldData) {
                queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                return oldData;
              }
              
              const newPages = [...oldData.pages];
              newPages[0] = [newNotification, ...newPages[0]];
              
              return {
                ...oldData,
                pages: newPages,
              };
            });
          } else {
            queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const notifications = data?.pages.flatMap(page => page) ?? [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('notification_id', notificationId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read.");
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .in('notification_id', unreadIds)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read.");
    }
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};