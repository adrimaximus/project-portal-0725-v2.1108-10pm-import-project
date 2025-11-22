import { useEffect, useRef } from "react";
import { CheckCircle2, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveText from "./InteractiveText";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Helper to fetch notification details with retry
const fetchNotificationDetails = async (notificationId: string) => {
  // Retry logic to handle potential race conditions where the recipient row exists
  // but the notification row visibility lags slightly due to RLS/replication
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();
    
    if (!error && data) return data;
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
  }
  return null;
};

// The UI component for the toast
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

export const BroadcastToast = () => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio
  useEffect(() => {
    if (!user) return;
    const setupAudio = async () => {
      try {
        // Default to positive alert if preference fetch fails or is missing
        let tone = 'positive-alert-ding.mp3';
        
        const { data } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
        if (data?.notification_preferences?.tone && data.notification_preferences.tone !== 'none') {
          tone = data.notification_preferences.tone;
        }
        
        audioRef.current = new Audio(`${TONE_BASE_URL}${tone}`);
      } catch (e) { 
        console.error("Error setting up notification audio:", e); 
      }
    };
    setupAudio();
  }, [user?.id]);

  // Listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`broadcast-listener:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // 1. Check global toast preference
          const { data: profile } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
          // Default to TRUE if the setting is missing/undefined. Only block if explicitly FALSE.
          if (profile?.notification_preferences?.toast_enabled === false) return;

          // 2. Fetch full notification details
          const notificationId = payload.new.notification_id;
          const notification = await fetchNotificationDetails(notificationId);
          
          if (!notification) {
            console.warn("Could not fetch notification details for broadcast.");
            return;
          }

          // 3. Check type - explicitly handle 'broadcast'
          const isBroadcast = notification.type === 'broadcast';
          const isSystemBroadcast = notification.type === 'system' && notification.resource_type === 'system';

          if (isBroadcast || isSystemBroadcast) {
            // Play sound
            audioRef.current?.play().catch((e) => console.log("Audio play blocked:", e));

            // Show custom toast via Sonner
            toast.custom((t) => (
              <BroadcastNotificationUI
                t={t}
                title={notification.title}
                body={notification.body || ''}
                link={notification.data?.link}
                timestamp={notification.created_at}
                onDismiss={() => toast.dismiss(t)}
                onRead={async () => {
                  // Optimistically dismiss
                  toast.dismiss(t);
                  await supabase.rpc('update_my_notification_status', {
                    notification_id: notification.id,
                    is_read: true
                  });
                }}
              />
            ), {
              duration: Infinity, // Broadcasts stay until dismissed
              position: 'bottom-right',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return null; // Headless component that triggers toasts
};