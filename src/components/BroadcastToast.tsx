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

    if (!error && data) return data;
    
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

  // Load notification sound preference
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
        console.error("Failed to load notification sound preference", e);
      }
    };
    setupAudio();
  }, [user?.id]); // Only re-run if user ID changes

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return;

    console.log("BroadcastToast: Initializing subscription for user", user.id);

    const channel = supabase
      .channel(`broadcast-toast:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          // We rely on RLS to filter events for the current user. 
          // Adding an explicit filter string can sometimes cause issues if UUID formats vary.
        },
        async (payload) => {
          console.log("BroadcastToast: Received notification event", payload);
          
          // Verify the event is for the current user (double check)
          if (payload.new.user_id !== user.id) {
            return;
          }

          // Fetch notification details with retry to handle potential race conditions
          const notifData = await fetchNotificationWithRetry(payload.new.notification_id);

          if (notifData && notifData.type === 'broadcast') {
            console.log("BroadcastToast: Displaying broadcast", notifData);
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log("Audio play failed", e));
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
          }
        }
      )
      .subscribe((status) => {
        console.log("BroadcastToast: Subscription status:", status);
      });

    return () => {
      console.log("BroadcastToast: Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Update "time ago" text
  useEffect(() => {
    if (!activeMessage) return;

    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(new Date(activeMessage.created_at), { addSuffix: true }));
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
      }).catch(console.error);
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
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[380px] transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div 
        className="bg-background text-foreground shadow-xl rounded-xl border border-border p-4 flex gap-4 relative cursor-pointer hover:bg-muted/30 transition-colors ring-1 ring-black/5 dark:ring-white/10"
        onClick={handleClick}
      >
        {/* Icon */}
        <div className="flex-shrink-0 pt-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
            <Megaphone className="h-5 w-5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-semibold text-foreground leading-tight pr-6">
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
        
        {/* Mark Read Button */}
        <div className="absolute bottom-4 right-4" title="Mark as read">
             <button 
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-green-600 hover:text-green-700 transition-colors bg-green-50 dark:bg-green-900/20 rounded-full p-0.5"
             >
                 <CheckCircle2 className="h-5 w-5" />
             </button>
        </div>
      </div>
    </div>
  );
};