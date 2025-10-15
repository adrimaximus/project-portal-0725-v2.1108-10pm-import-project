let audioContext: AudioContext | null = null;
let audioBufferCache: { [key: string]: AudioBuffer } = {};

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

// Function to initialize (or resume) the AudioContext on user interaction
const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
      return false;
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return true;
};

// Add a global click listener to initialize the context on the first user interaction
if (typeof window !== 'undefined') {
  document.addEventListener('click', initAudioContext, { once: true });
  document.addEventListener('touchstart', initAudioContext, { once: true });
}

const fetchAndDecodeAudio = async (url: string): Promise<AudioBuffer | null> => {
  if (audioBufferCache[url]) {
    return audioBufferCache[url];
  }
  if (!audioContext) {
    if (!initAudioContext()) return null;
  }
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
    audioBufferCache[url] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error('Error loading or decoding audio file:', error);
    delete audioBufferCache[url]; // Clear cache on error
    return null;
  }
};

export const playNotificationSound = async (tone: string) => {
  if (!tone || tone === 'none' || typeof window === 'undefined') {
    return;
  }

  if (!initAudioContext() || !audioContext) {
    return;
  }

  const audioUrl = `${TONE_BASE_URL}${tone}`;
  const audioBuffer = await fetchAndDecodeAudio(audioUrl);

  if (audioBuffer && audioContext) {
    try {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }
};