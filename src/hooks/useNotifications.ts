import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/data/notifications';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      timestamp: n.created_at,
      read: n.read,
      link: n.link,
  }));
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotificationRaw = payload.new;
          const newNotification: Notification = {
              id: newNotificationRaw.id,
              type: newNotificationRaw.type,
              title: newNotificationRaw.title,
              description: newNotificationRaw.description,
              timestamp: newNotificationRaw.created_at,
              read: newNotificationRaw.read,
              link: newNotificationRaw.link,
          };

          if (location.pathname !== '/notifications') {
            toast.info(newNotification.title, {
              description: newNotification.description,
              action: {
                label: 'View',
                onClick: () => {
                  if (newNotification.link) {
                    navigate(newNotification.link);
                  }
                },
              },
            });
          }
          
          queryClient.setQueryData(['notifications', user.id], (oldData: Notification[] | undefined) => {
            if (oldData) {
              if (oldData.some(n => n.id === newNotification.id)) {
                return oldData;
              }
              return [newNotification, ...oldData];
            }
            return [newNotification];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, navigate, location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};