import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import InteractiveText from "./InteractiveText";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface BroadcastMessage {
  id: string; // notification_recipients id
  notification_id: string;
  title: string;
  body: string;
  link?: string;
  created_at: string;
}

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Helper for simple retry logic
const fetchNotificationWithRetry = async (notificationId: string, attempts = 3, delay = 500): Promise<any> => {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from('notifications')
      .select('title, body, type, data, created_at')
      .eq('id', notificationId)
      .single();

    if (!error && data) return data;
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

  useEffect(() => {
    if (!user) return;

    // Preload sound preference
    const setupAudio = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();
      
      const tone = data?.notification_preferences?.tone || 'positive-alert-ding.mp3';
      if (tone && tone !== 'none') {
        audioRef.current = new Audio(`${TONE_BASE_URL}${tone}`);
      }
    };
    setupAudio();

    console.log("BroadcastToast: Subscribing to notifications...");

    // Subscribe to new notifications for this user
    // We rely on RLS to filter for the current user, removing the explicit filter string
    // to avoid potential syntax issues with UUIDs.
    const channel = supabase
      .channel('broadcast-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
        },
        async (payload) => {
          console.log("BroadcastToast: Received event", payload);
          
          // Use retry logic to fetch notification details to handle potential race conditions
          const notifData = await fetchNotificationWithRetry(payload.new.notification_id);

          if (notifData && notifData.type === 'broadcast') {
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }

            // Replace existing toast immediately (no stacking)
            const link = (notifData.data as any)?.link;
            
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
             console.log("BroadcastToast: Notification data missing or not broadcast type", notifData);
          }
        }
      )
      .subscribe((status) => {
        console.log("BroadcastToast: Subscription status", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update time ago every minute
  useEffect(() => {
    if (!activeMessage) return;

    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(new Date(activeMessage.created_at), { addSuffix: true }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [activeMessage]);

  const handleDismiss = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsVisible(false);
    
    if (activeMessage?.notification_id) {
      // Mark as read in DB using RPC
      await supabase.rpc('update_my_notification_status', {
        notification_id: activeMessage.notification_id,
        is_read: true
      }).catch(console.error);
    }
    
    // Wait for animation then clear
    setTimeout(() => setActiveMessage(null), 300);
  };

  const handleClick = () => {
    handleDismiss(); // Mark read and close on click
    
    if (activeMessage?.link) {
      if (activeMessage.link.startsWith('http')) {
        window.open(activeMessage.link, '_blank');
      } else {
        navigate(activeMessage.link);
      }
    } else {
      // If no link, go to notifications page
      navigate('/notifications');
    }
  };

  if (!activeMessage) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-[9999] max-w-[400px] w-full transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "bg-background text-foreground border shadow-xl rounded-lg p-4 flex gap-4 items-start relative cursor-pointer hover:bg-muted/50 transition-colors",
          "border-l-4 border-l-blue-500" // Added subtle accent like in standard notification toasts
        )}
        onClick={handleClick}
      >
        {/* Info Icon (Left) */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
            <Info className="h-5 w-5" />
          </div>
        </div>

        {/* Content (Middle) */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-base font-bold leading-tight flex items-center gap-2 text-foreground">
            {activeMessage.title}
          </h4>
          <div className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            <InteractiveText text={activeMessage.body} />
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {timeAgo}
          </p>
        </div>

        {/* Check Icon (Right) */}
        <div className="flex-shrink-0 self-start pl-2">
          <button
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors p-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Mark as read"
          >
            <CheckCircle2 className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};