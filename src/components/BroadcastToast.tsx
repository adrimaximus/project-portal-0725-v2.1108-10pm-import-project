import { useEffect, useState, useRef } from "react";
import { Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import InteractiveText from "./InteractiveText";

interface BroadcastMessage {
  id: string; // notification_recipients id
  notification_id: string;
  title: string;
  body: string;
  link?: string;
}

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

export const BroadcastToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMessage, setActiveMessage] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel('broadcast-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the actual notification details
          const { data: notifData, error } = await supabase
            .from('notifications')
            .select('title, body, type, data')
            .eq('id', payload.new.notification_id)
            .single();

          if (notifData && !error && notifData.type === 'broadcast') {
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }

            // Replace existing toast immediately (no stacking)
            const link = (notifData.data as any)?.link;
            
            setActiveMessage({
              id: payload.new.id, // This is the notification_recipient ID needed for the RPC
              notification_id: payload.new.notification_id,
              title: notifData.title,
              body: notifData.body || '',
              link: link
            });
            setIsVisible(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
    if (activeMessage?.link) {
      handleDismiss();
      if (activeMessage.link.startsWith('http')) {
        window.open(activeMessage.link, '_blank');
      } else {
        navigate(activeMessage.link);
      }
    }
  };

  if (!activeMessage) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-[9999] max-w-[350px] w-full transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "bg-card text-card-foreground border border-border shadow-2xl rounded-lg p-3 flex gap-3 items-start relative overflow-hidden cursor-pointer group",
          activeMessage.link && "hover:border-primary/50 transition-colors"
        )}
        onClick={handleClick}
      >
        {/* Left colored accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

        <div className="flex-1 ml-2 space-y-1 min-w-0">
          <h4 className="text-xs font-bold leading-tight flex items-center gap-2 truncate">
            {activeMessage.title}
            {activeMessage.link && <ExternalLink className="h-3 w-3 opacity-50 flex-shrink-0" />}
          </h4>
          <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
            <InteractiveText text={activeMessage.body} />
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={handleDismiss}
            className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors shadow-sm"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};