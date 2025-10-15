const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;
const audioCache: { [key: string]: HTMLAudioElement } = {};

export const playNotificationSound = (tone: string) => {
  if (!tone || tone === 'none' || typeof window === 'undefined') {
    return;
  }

  const audioUrl = `${TONE_BASE_URL}${tone}`;

  // Use a cached audio element if available
  let audio = audioCache[audioUrl];
  if (!audio) {
    audio = new Audio(audioUrl);
    audioCache[audioUrl] = audio;
  }

  // Reset current time to play from the beginning if it's already playing
  audio.currentTime = 0;
  
  audio.play().catch(error => {
    console.error("Error playing notification sound:", error);
    // The useCheckAudioPermission hook should handle prompting the user for interaction.
    // We log here for debugging purposes.
  });
};