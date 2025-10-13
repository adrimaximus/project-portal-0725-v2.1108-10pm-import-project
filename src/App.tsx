import { useEffect, useRef } from 'react';
import { Outlet } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import NotificationToast from './components/NotificationToast';

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

function App() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      // This is a common trick to allow audio playback by playing a silent sound on user interaction.
      const audio = new Audio();
      audio.play().catch(() => {});
      window.removeEventListener('mousedown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('mousedown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('mousedown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`realtime:notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        
        const { data: notification, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', (payload.new as any).notification_id)
          .single();

        if (error || !notification) {
          console.error("Could not fetch notification details", error);
          return;
        }

        const prefs = user.notification_preferences || {};
        const isToastEnabled = prefs.toast_enabled !== false;
        const notificationTypeEnabled = prefs[notification.type] !== false;

        if (isToastEnabled && notificationTypeEnabled) {
          // Play sound
          if (prefs.tone && prefs.tone !== 'none') {
            if (audioRef.current) {
              audioRef.current.src = `${TONE_BASE_URL}${prefs.tone}`;
              audioRef.current.play().catch(e => console.error("Error playing notification sound:", e));
            } else {
              audioRef.current = new Audio(`${TONE_BASE_URL}${prefs.tone}`);
              audioRef.current.play().catch(e => console.error("Error playing notification sound:", e));
            }
          }

          // Show toast
          toast.custom(() => <NotificationToast title={notification.title} body={notification.body} />);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      <Toaster richColors position="bottom-right" />
      <Outlet />
    </>
  );
}

export default App;