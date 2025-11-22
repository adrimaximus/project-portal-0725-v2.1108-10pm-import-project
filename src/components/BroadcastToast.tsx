import { useEffect, useRef } from "react";
import { CheckCircle2, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import InteractiveText from "./InteractiveText";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Helper to fetch notification details
const fetchNotificationDetails = async (notificationId: string) => {
  // Retry logic for robustness
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();
    
    if (!error && data) return data;
    await new Promise(r => setTimeout(r, 1000));
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
      className="w-full max-w-md bg-background text-foreground shadow-2xl rounded-xl border border-border p-4 flex gap-4 relative cursor-pointer hover:bg-muted/30 transition-colors group"
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
          <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {title}
          </h4>
        </div>
        <div className="text-sm text-muted-foreground leading-normal line-clamp-4">
          <InteractiveText text={body} />
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
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
          className="text-green-600 hover:text-green-700 transition-colors p-1 rounded-full hover:bg-green-50"
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
        const { data } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
        const tone = data?.notification_preferences?.tone || 'positive-alert-ding.mp3';
        if (tone && tone !== 'none') {
          audioRef.current = new Audio(`${TONE_BASE_URL}${tone}`);
        }
      } catch (e) { console.error(e); }
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
          // Check global toast preference
          const { data: profile } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
          if (profile?.notification_preferences?.toast_enabled === false) return;

          // Fetch details
          const notification = await fetchNotificationDetails(payload.new.notification_id);
          
          // Only show for 'broadcast' type OR if explicitly targeted as system broadcast
          if (notification && (notification.type === 'broadcast' || (notification.type === 'system' && notification.resource_type === 'system'))) {
            
            // Play sound
            audioRef.current?.play().catch(() => {});

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
                  await supabase.rpc('update_my_notification_status', {
                    notification_id: notification.id,
                    is_read: true
                  });
                }}
              />
            ), {
              duration: Infinity, // Broadcasts stay until dismissed
              position: 'bottom-right',
              className: 'bg-transparent border-0 shadow-none p-0 pointer-events-auto'
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