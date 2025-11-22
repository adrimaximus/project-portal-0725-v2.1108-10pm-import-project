import { useEffect, useState } from "react";
import { X, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface BroadcastMessage {
  id: string; // notification_recipient id or notification id
  title: string;
  body: string;
  link?: string;
}

export const BroadcastToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMessage, setActiveMessage] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

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
            .select('title, body, data')
            .eq('id', payload.new.notification_id)
            .single();

          if (notifData && !error) {
            // Replace existing toast immediately (no stacking)
            const link = (notifData.data as any)?.link;
            
            setActiveMessage({
              id: payload.new.id,
              title: notifData.title,
              body: notifData.body || '',
              link: link
            });
            setIsVisible(true);
            
            // Play a subtle sound
            const audio = new Audio('/notification.mp3'); // Ensure this exists or remove
            audio.volume = 0.5;
            audio.play().catch(() => {}); // Ignore auto-play errors
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
    
    if (activeMessage?.id) {
      // Mark as read in DB
      await supabase.functions.invoke('mark-notification-read', {
        body: { id: activeMessage.id }
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
        "fixed bottom-4 right-4 z-[9999] max-w-sm w-full transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg p-3 flex gap-3 items-start relative overflow-hidden cursor-pointer group",
          activeMessage.link && "hover:border-primary/50 transition-colors"
        )}
        onClick={handleClick}
      >
        {/* Left colored accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

        <div className="flex-1 ml-2 space-y-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2">
            {activeMessage.title}
            {activeMessage.link && <ExternalLink className="h-3 w-3 opacity-50" />}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {activeMessage.body}
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={handleDismiss}
            className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};