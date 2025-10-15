const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Create a Set to hold references to active audio objects.
// This prevents them from being garbage-collected prematurely when played from a non-user-initiated event.
const activeAudios = new Set<HTMLAudioElement>();

export const playNotificationSound = (tone: string) => {
  if (!tone || tone === 'none' || typeof window === 'undefined') {
    return;
  }

  try {
    const audioUrl = `${TONE_BASE_URL}${tone}`;
    const audio = new Audio(audioUrl);

    // When the sound finishes playing, remove it from our active set.
    audio.onended = () => {
      activeAudios.delete(audio);
    };

    // Also remove it if there's an error.
    audio.onerror = () => {
      console.error(`Error playing sound: ${tone}`);
      activeAudios.delete(audio);
    };

    // Add the audio object to the set to keep a reference to it.
    activeAudios.add(audio);
    
    audio.play().catch(error => {
      // This error is often a "NotAllowedError" if the user hasn't interacted with the page yet.
      // The useCheckAudioPermission hook is designed to handle this scenario by prompting the user.
      // We log other errors for debugging.
      if (error.name !== 'NotAllowedError') {
        console.error("Error playing notification sound:", error);
      }
      // Make sure to clean up if play() fails immediately.
      activeAudios.delete(audio);
    });
  } catch (e) {
    console.error("Could not create or play audio element:", e);
  }
};