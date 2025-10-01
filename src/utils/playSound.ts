import { supabase } from "@/integrations/supabase/client";

export const playNotificationSound = (soundFile: string) => {
  if (soundFile === 'None' || !soundFile) return;

  const { data } = supabase.storage.from('General').getPublicUrl(`Notification/${soundFile}`);
  
  if (data.publicUrl) {
    const audio = new Audio(data.publicUrl);
    audio.play().catch(e => {
      console.error("Error playing audio. User may need to interact with the page first.", e);
    });
  } else {
    console.error(`Could not get public URL for sound file: ${soundFile}`);
  }
};