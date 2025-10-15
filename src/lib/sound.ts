const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

export const playNotificationSound = (tone: string) => {
  if (!tone || tone === 'none' || typeof window === 'undefined') {
    return;
  }

  try {
    const audioUrl = `${TONE_BASE_URL}${tone}`;
    // Create a new Audio object for each play call to prevent race conditions
    // where one play() call interrupts another. The browser will still cache
    // the underlying audio data, so this is efficient.
    const audio = new Audio(audioUrl);
    
    audio.play().catch(error => {
      // This error is often a "NotAllowedError" if the user hasn't interacted with the page yet.
      // The useCheckAudioPermission hook is designed to handle this scenario by prompting the user.
      // We log other errors for debugging.
      if (error.name !== 'NotAllowedError') {
        console.error("Error playing notification sound:", error);
      }
    });
  } catch (e) {
    console.error("Could not create or play audio element:", e);
  }
};