import { useEffect } from "react";
import { toast } from "sonner";

// A tiny, silent audio file encoded in base64.
const silentAudio = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// This function attempts to play a silent audio. It's designed to be called
// by a user interaction (like a click) to unlock the browser's audio context.
const unlockAudio = () => {
  try {
    const audio = new Audio(silentAudio);
    audio.volume = 0;
    audio.play().catch(e => console.warn("Silent audio playback failed on unlock:", e));
  } catch (e) {
    console.error("Could not create audio element for unlocking:", e);
  }
};

export function useCheckAudioPermission() {
  useEffect(() => {
    const checkAudioPermission = async () => {
      // We only want to check this once per session to not annoy the user.
      if (sessionStorage.getItem('audioPermissionChecked')) {
        return;
      }
      sessionStorage.setItem('audioPermissionChecked', 'true');

      try {
        // We'll try to play a tiny, silent audio file automatically.
        // This will likely fail on the first load in many browsers.
        const testAudio = new Audio(silentAudio);
        testAudio.volume = 0;
        await testAudio.play();
      } catch (err: any) {
        // If it fails with 'NotAllowedError', it means the browser blocked autoplay.
        // This is the expected behavior we need to handle.
        if (err.name === 'NotAllowedError') {
          // Show a toast asking the user to enable sound with a button.
          toast.warning(
            "🔇 Notification sounds are muted by your browser.",
            {
              description: "Click the button to enable sound for this session.",
              duration: Infinity, // Keep the toast until the user interacts
              action: {
                label: "Enable Sound",
                onClick: () => {
                  unlockAudio();
                  toast.success("Sounds enabled!");
                },
              },
            }
          );
        } else {
          // Log other, unexpected errors for debugging, but don't bother the user.
          console.warn("Audio permission check failed with an unexpected error:", err);
        }
      }
    };

    // Wait a couple of seconds before checking, to be less intrusive on page load.
    const timer = setTimeout(checkAudioPermission, 2000);

    return () => clearTimeout(timer);
  }, []);
}