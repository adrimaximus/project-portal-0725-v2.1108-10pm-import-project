import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import InteractiveText from "./InteractiveText";
import { formatDistanceToNow } from "date-fns";

interface BroadcastMessage {
  id: string; // notification_recipients id
  notification_id: string;
  title: string;
  body: string;
  link?: string;
  created_at: string;
}

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Helper for retry logic
const fetchNotificationWithRetry = async (notificationId: string, attempts = 5, delay = 1000): Promise<any> => {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from('notifications')
      .select('title, body, type, data, created_at')
      .eq('id', notificationId)
      .single();

    if (!error && data) {
      return data;
    }
    
    if (error) {
      console.log(`[BroadcastToast] Attempt ${i + 1} failed to fetch notification:`, error.message);
    }
    
    // Wait before retrying
    if (i < attempts - 1) await new Promise(res => setTimeout(res, delay));
  }
  return null;
};

export const BroadcastToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMessage, setActiveMessage] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [timeAgo, setTimeAgo] = useState("Just now");

  // Load notification sound preference and check enabled state
  useEffect(() => {
    if (!user) return;

    const setupAudio = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();
        
        const tone = data?.notification_preferences?.tone || 'positive-alert-ding.mp3';
        if (tone && tone !== 'none') {
          audioRef.current = new Audio(`${TONE_BASE_URL}${tone}`);
        }
      } catch (e) {
        console.error("[BroadcastToast] Failed to load notification sound preference", e);
      }
    };
    setupAudio();
  }, [user?.id]);

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return;

    const channelName = `broadcast-listener:${user.id}`;
    console.log("[BroadcastToast] Subscribing to channel:", channelName);

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
          console.log("[BroadcastToast] Received event:", payload);
          
          // Check global toast preference first
          const { data: profile } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', user.id)
            .single();
          
          const prefs = profile?.notification_preferences || {};
          if (prefs.toast_enabled === false) {
            console.log("[BroadcastToast] Toasts are disabled in user settings. Skipping.");
            return;
          }

          // Fetch notification details with retry
          const notifData = await fetchNotificationWithRetry(payload.new.notification_id);

          if (notifData && notifData.type === 'broadcast') {
            console.log("[BroadcastToast] Displaying broadcast:", notifData);
            
            // Play sound safely
            if (audioRef.current) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => console.warn("[BroadcastToast] Audio play failed (likely browser policy):", e));
              }
            }

            const link = (notifData.data as any)?.link;
            
            // Set message and show
            setActiveMessage({
              id: payload.new.id,
              notification_id: payload.new.notification_id,
              title: notifData.title,
              body: notifData.body || '',
              link: link,
              created_at: notifData.created_at
            });
            setIsVisible(true);
          } else {
            console.log("[BroadcastToast] Notification data not found or type mismatch:", notifData?.type);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[BroadcastToast] Channel status for ${channelName}:`, status);
      });

    return () => {
      console.log(`[BroadcastToast] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Update "time ago" text
  useEffect(() => {
    if (!activeMessage) return;

    const updateTime = () => {
      try {
        setTimeAgo(formatDistanceToNow(new Date(activeMessage.created_at), { addSuffix: true }));
      } catch (e) {
        setTimeAgo("Just now");
      }
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [activeMessage]);

  const handleDismiss = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsVisible(false);
    
    if (activeMessage?.notification_id) {
      // Mark as read in DB
      await supabase.rpc('update_my_notification_status', {
        notification_id: activeMessage.notification_id,
        is_read: true
      }).catch(err => console.error("[BroadcastToast] Failed to mark as read:", err));
    }
    
    // Clear message after animation
    setTimeout(() => setActiveMessage(null), 500);
  };

  const handleClick = () => {
    handleDismiss();
    
    if (activeMessage?.link) {
      if (activeMessage.link.startsWith('http')) {
        window.open(activeMessage.link, '_blank');
      } else {
        navigate(activeMessage.link);
      }
    } else {
      navigate('/notifications');
    }
  };

  if (!activeMessage) return null;

  return (
    <div 
      data-dyad-broadcast-toast="true"
      className={cn(
        "fixed bottom-6 right-6 z-[9999] w-full max-w-[380px] transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div 
        className="bg-background text-foreground shadow-2xl rounded-xl border border-border p-4 flex gap-4 relative cursor-pointer hover:bg-muted/30 transition-colors"
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
            <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
              {activeMessage.title}
            </h4>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
              {timeAgo}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground leading-normal line-clamp-3">
            <InteractiveText text={activeMessage.body} />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-background border shadow-sm rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
        
        <div className="absolute bottom-3 right-3">
             <button 
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-green-600 hover:text-green-700 transition-colors"
                title="Mark as read"
             >
                 <CheckCircle2 className="h-5 w-5" />
             </button>
        </div>
      </div>
    </div>
  );
};