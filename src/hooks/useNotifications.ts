import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notification_recipients')
    .select(`
      read_at,
      notification:notifications (
        id,
        type,
        title,
        description,
        link,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { foreignTable: 'notifications', ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(item => ({
    ...(item.notification as any),
    read_at: item.read_at,
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
        { event: 'INSERT', schema: 'public', table: 'notification_recipients', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const { data: notif, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single();

          if (error || !notif) return;

          const newNotification: Notification = {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            description: notif.description,
            link: notif.link,
            created_at: notif.created_at,
            read_at: payload.new.read_at,
          };

          if (location.pathname !== '/notifications') {
            toast.info(newNotification.title, {
              description: newNotification.description,
              action: {
                label: 'View',
                onClick: () => {
                  if (newNotification.link) navigate(newNotification.link);
                },
              },
            });
          }
          
          queryClient.setQueryData(['notifications', user.id], (oldData: Notification[] | undefined) => {
            return [newNotification, ...(oldData || [])];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, navigate, location.pathname]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications', user?.id], (oldData: Notification[] | undefined) => 
        oldData?.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications', user?.id], (oldData: Notification[] | undefined) => 
        oldData?.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
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