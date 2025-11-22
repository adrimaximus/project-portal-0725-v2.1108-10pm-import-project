import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";
import { CheckCircle2, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InteractiveText from "./InteractiveText";
import { formatDistanceToNow } from "date-fns";

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Custom UI for Broadcast/System Notifications
const BroadcastNotificationUI = ({ 
  title, 
  body, 
  link, 
  timestamp, 
  onDismiss, 
  onRead, 
  t 
}: { 
  title: string; 
  body: string; 
  link?: string; 
  timestamp: string; 
  onDismiss: () => void; 
  onRead: () => void; 
  t: string | number;
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    onDismiss();
    if (link) {
      if (link.startsWith('http')) window.open(link, '_blank');
      else navigate(link);
    }
  };

  return (
    <div 
      className="w-full max-w-md bg-background text-foreground shadow-2xl rounded-xl border border-border p-4 flex gap-4 relative cursor-pointer hover:bg-muted/30 transition-colors group pointer-events-auto ring-1 ring-black/5"
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-1">
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
          <Megaphone className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 pr-6">
            {title}
          </h4>
        </div>
        <div className="text-sm text-muted-foreground leading-normal line-clamp-4">
          <InteractiveText text={body} />
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">
          {timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : 'Just now'}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Mark as Read Button */}
      <div className="absolute bottom-3 right-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onRead(); onDismiss(); }}
          className="text-green-600 hover:text-green-700 transition-colors p-1.5 rounded-full hover:bg-green-50"
          title="Mark as read"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export const GlobalNotificationListener = () => {
  const { user } = useAuth();
  const { selectedConversationId, isChatPageActive } = useChatContext();
  
  const chatStateRef = useRef({ selectedConversationId, isChatPageActive });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatStateRef.current = { selectedConversationId, isChatPageActive };
  }, [selectedConversationId, isChatPageActive]);

  useEffect(() => {
    if (!user) return;

    // Preload audio
    const setupAudio = async () => {
      try {
        const { data } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
        let tone = 'positive-alert-ding.mp3'; // Default
        if (data?.notification_preferences?.tone && data.notification_preferences.tone !== 'none') {
          tone = data.notification_preferences.tone;
        }
        audioRef.current = new Audio(`${TONE_BASE_URL}${tone}`);
      } catch (e) {
        console.error("Audio setup failed:", e);
      }
    };
    setupAudio();

    // Force cleanup of any existing channels with this name to prevent duplicates
    const channelName = `global-notifications:${user.id}`;
    try {
      supabase.removeChannel(supabase.channel(channelName));
    } catch (e) {
      // ignore cleanup error
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (!payload.new || !payload.new.notification_id) {
            return;
          }

          const newNotificationId = payload.new.notification_id;

          // Fetch notification details with retry logic for consistency
          let notificationData = null;
          for (let i = 0; i < 3; i++) {
            const { data, error } = await supabase
              .from('notifications')
              .select('id, title, body, type, resource_type, resource_id, created_at, data')
              .eq('id', newNotificationId)
              .single();
            
            if (!error && data) {
              notificationData = data;
              break;
            }
            await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
          }

          if (!notificationData) {
            console.error("Failed to fetch notification data after retries");
            return;
          }

          // Fetch user preferences
          const { data: profileData } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', user.id)
            .single();
          
          const userPreferences = profileData?.notification_preferences || {};
          
          // Check global toast enabled (default true)
          if (userPreferences.toast_enabled === false) {
             return;
          }

          // Logic for Chat notifications (don't notify if looking at the specific chat)
          const isChatNotification = notificationData.type === 'comment';
          const conversationIdOfNotification = notificationData.resource_id;
          
          const isChatActiveAndVisible = isChatNotification &&
                                         chatStateRef.current.isChatPageActive &&
                                         chatStateRef.current.selectedConversationId === conversationIdOfNotification;

          if (isChatActiveAndVisible) {
             return;
          }

          // === DISPLAY LOGIC ===

          // Play Sound
          const typePref = userPreferences?.[notificationData.type];
          const isNotificationTypeEnabled = typeof typePref === 'object' ? typePref.enabled !== false : typePref !== false;
          
          if (isNotificationTypeEnabled) {
             audioRef.current?.play().catch(e => console.warn("Audio play blocked:", e));
          }

          // Render correct Toast type
          const isBroadcast = notificationData.type === 'broadcast' || 
                            (notificationData.type === 'system' && notificationData.resource_type === 'system');

          if (isBroadcast) {
            // Persistent Custom Toast for Broadcasts
            toast.custom((t) => (
              <BroadcastNotificationUI
                t={t}
                title={notificationData.title}
                body={notificationData.body || ''}
                link={notificationData.data?.link}
                timestamp={notificationData.created_at}
                onDismiss={() => toast.dismiss(t)}
                onRead={async () => {
                  toast.dismiss(t);
                  await supabase.rpc('update_my_notification_status', {
                    notification_id: notificationData.id,
                    is_read: true
                  });
                }}
              />
            ), {
              duration: Infinity,
              position: 'bottom-right',
            });
          } else {
            // Standard Toast for everything else
            toast.info(notificationData.title, {
              description: notificationData.body,
            });
          }

          // Desktop Notification fallback
          if (Notification.permission === 'granted' && document.hidden) {
            new Notification(notificationData.title, {
              body: notificationData.body,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe((status, err) => {
         if (err) {
             console.error("Notification channel error:", err);
         }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};