import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

export const GlobalNotificationListener = () => {
  const { user } = useAuth();
  const { selectedConversationId, isChatPageActive } = useChatContext();
  
  // Refs to access latest state inside effect without re-triggering subscription
  const chatStateRef = useRef({ selectedConversationId, isChatPageActive });

  useEffect(() => {
    chatStateRef.current = { selectedConversationId, isChatPageActive };
  }, [selectedConversationId, isChatPageActive]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`global-notifications:${user.id}`)
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

          // Fetch notification details
          const { data: notificationData, error } = await supabase
            .from('notifications')
            .select('title, body, type, resource_type, resource_id')
            .eq('id', newNotificationId)
            .single();

          if (error || !notificationData) {
            console.error("Error fetching notification details:", error);
            return;
          }

          // Skip broadcast types (handled by BroadcastToast component)
          const isHandledByBroadcastToast = 
              notificationData.type === 'broadcast' || 
              (notificationData.type === 'system' && notificationData.resource_type === 'system');

          if (isHandledByBroadcastToast) return;

          // Fetch user preferences
          const { data: profileData } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', user.id)
            .single();
          
          const userPreferences = profileData?.notification_preferences || {};
          
          // Check global toast enabled (default true)
          if (userPreferences.toast_enabled === false) return;

          // Logic for Chat notifications (don't notify if looking at the specific chat)
          const isChatNotification = notificationData.type === 'comment';
          const conversationIdOfNotification = notificationData.resource_id;
          
          const isChatActiveAndVisible = isChatNotification &&
                                         chatStateRef.current.isChatPageActive &&
                                         chatStateRef.current.selectedConversationId === conversationIdOfNotification;

          if (!isChatActiveAndVisible) {
            // Show Toast
            toast.info(notificationData.title, {
              description: notificationData.body,
            });

            // Play Sound
            const typePref = userPreferences?.[notificationData.type];
            const isNotificationTypeEnabled = typeof typePref === 'object' ? typePref.enabled !== false : typePref !== false;
            const tone = userPreferences?.tone;

            if (isNotificationTypeEnabled && tone && tone !== 'none') {
              try {
                const audio = new Audio(`${TONE_BASE_URL}${tone}`);
                await audio.play().catch(e => console.warn("Audio play blocked", e));
              } catch (e) {
                console.error("Error playing sound:", e);
              }
            }

            // Desktop Notification
            if (Notification.permission === 'granted' && document.hidden) {
              new Notification(notificationData.title, {
                body: notificationData.body,
                icon: "/favicon.ico",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};