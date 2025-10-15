import { useEffect } from "react";
import { toast } from "sonner";

export function useCheckAudioPermission() {
  useEffect(() => {
    const checkAudio = async () => {
      // We only want to check this once per session to not annoy the user.
      if (sessionStorage.getItem('audioPermissionChecked')) {
        return;
      }
      sessionStorage.setItem('audioPermissionChecked', 'true');

      try {
        // We'll try to play a tiny, silent audio file.
        // This is a standard way to check if the browser allows audio playback.
        const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        testAudio.volume = 0;
        await testAudio.play();
      } catch (err: any) {
        // If it fails with 'NotAllowedError', it means the browser blocked it.
        if (err.name === 'NotAllowedError') {
          toast.warning(
            "🔇 Notification sounds might be blocked.",
            {
              description: "Please click anywhere on the page to enable audio for notifications.",
              duration: 10000,
            }
          );
        } else {
          // Log other errors for debugging, but don't bother the user.
          console.warn("Audio permission check failed:", err);
        }
      }
    };

    // We'll wait a couple of seconds before checking, to be less intrusive on page load.
    const timer = setTimeout(checkAudio, 2000);

    return () => clearTimeout(timer);
  }, []);
}