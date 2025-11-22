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
    if (!user) {
      console.warn("[NOTIF-DEBUG] Listener skipped: No user logged in.");
      return;
    }

    console.log(`[NOTIF-DEBUG] Initializing listener for user: ${user.id} (${user.email})`);

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
          console.log("[NOTIF-DEBUG] 🔔 Realtime event RECEIVED!", payload);

          if (!payload.new || !payload.new.notification_id) {
            console.error("[NOTIF-DEBUG] ❌ Payload missing notification_id", payload);
            return;
          }

          const newNotificationId = payload.new.notification_id;

          // Fetch notification details
          console.log(`[NOTIF-DEBUG] Fetching details for notification: ${newNotificationId}`);
          const { data: notificationData, error } = await supabase
            .from('notifications')
            .select('title, body, type, resource_type, resource_id')
            .eq('id', newNotificationId)
            .single();

          if (error) {
            console.error("[NOTIF-DEBUG] ❌ Error fetching notification details:", error);
            return;
          }

          if (!notificationData) {
            console.error("[NOTIF-DEBUG] ❌ Notification data is null");
            return;
          }

          console.log("[NOTIF-DEBUG] Notification details fetched:", notificationData);

          // Skip broadcast types (handled by BroadcastToast component)
          const isHandledByBroadcastToast = 
              notificationData.type === 'broadcast' || 
              (notificationData.type === 'system' && notificationData.resource_type === 'system');

          if (isHandledByBroadcastToast) {
            console.log("[NOTIF-DEBUG] ⏩ Skipping: Handled by BroadcastToast");
            return;
          }

          // Fetch user preferences
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
             console.error("[NOTIF-DEBUG] ⚠️ Error fetching profile preferences:", profileError);
          }

          const userPreferences = profileData?.notification_preferences || {};
          console.log("[NOTIF-DEBUG] User Preferences:", userPreferences);
          
          // Check global toast enabled (default true)
          if (userPreferences.toast_enabled === false) {
             console.log("[NOTIF-DEBUG] ⏩ Skipping: User has disabled In-App Toasts globally.");
             return;
          }

          // Logic for Chat notifications (don't notify if looking at the specific chat)
          const isChatNotification = notificationData.type === 'comment';
          const conversationIdOfNotification = notificationData.resource_id;
          
          const isChatActiveAndVisible = isChatNotification &&
                                         chatStateRef.current.isChatPageActive &&
                                         chatStateRef.current.selectedConversationId === conversationIdOfNotification;

          if (isChatActiveAndVisible) {
             console.log("[NOTIF-DEBUG] ⏩ Skipping: User is currently viewing this chat.");
             return;
          }

          // IF WE REACH HERE, THE TOAST SHOULD SHOW
          console.log("[NOTIF-DEBUG] ✅ CONDITIONS MET. TRIGGERING TOAST.");

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
              console.log(`[NOTIF-DEBUG] Playing sound: ${tone}`);
              const audio = new Audio(`${TONE_BASE_URL}${tone}`);
              await audio.play().catch(e => console.warn("[NOTIF-DEBUG] Audio play blocked by browser", e));
            } catch (e) {
              console.error("[NOTIF-DEBUG] Error playing sound:", e);
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
      )
      .subscribe((status, err) => {
         console.log(`[NOTIF-DEBUG] Channel Status: ${status}`);
         if (err) {
             console.error("[NOTIF-DEBUG] Channel Error:", err);
         }
      });

    return () => {
      console.log("[NOTIF-DEBUG] Cleaning up listener channel");
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};