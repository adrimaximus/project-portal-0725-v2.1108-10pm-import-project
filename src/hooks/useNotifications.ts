import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { toast } from 'sonner';

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
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
      recipients:notification_recipients (read_at)
    `)
    .eq('notification_recipients.user_id', userId)
    .order('created_at', { ascending: false });

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

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

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
  };
};