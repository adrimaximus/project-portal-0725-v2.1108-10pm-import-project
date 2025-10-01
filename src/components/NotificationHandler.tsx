import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const NotificationHandler = () => {
  const { user } = useAuth();

  const playSound = (soundFile: string) => {
    if (!soundFile || soundFile === 'None') return;
    const { data } = supabase.storage.from('General').getPublicUrl(`Notification/${soundFile}`);
    if (data.publicUrl) {
      const audio = new Audio(data.publicUrl);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  useEffect(() => {
    if (!user?.id || !user.notification_preferences) return;

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
          const { data: notification, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single();

          if (error || !notification) {
            console.error('Error fetching notification details:', error);
            return;
          }
          
          toast(notification.title, {
            description: notification.body,
          });

          const preferences = user.notification_preferences;
          const notificationType = notification.type;
          const setting = preferences[notificationType];

          if (setting && typeof setting === 'object' && setting.enabled && setting.sound) {
            playSound(setting.sound);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null; // This component does not render anything
};

export default NotificationHandler;