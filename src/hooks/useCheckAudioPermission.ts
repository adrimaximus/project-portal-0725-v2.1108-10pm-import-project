import { useEffect } from "react";
import { toast } from "sonner";

export function useCheckAudioPermission() {
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        testAudio.volume = 0;
        await testAudio.play();
        // If successful, we can remove the listener
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        return true;
      } catch (err) {
        // It will fail if not allowed, that's expected.
        return false;
      }
    };

    const checkAudio = async () => {
      if (sessionStorage.getItem('audioPermissionChecked')) {
        return;
      }
      sessionStorage.setItem('audioPermissionChecked', 'true');

      const unlocked = await unlockAudio();

      if (!unlocked) {
        toast.warning(
          "🔇 Suara notifikasi mungkin diblokir.",
          {
            description: "Silakan klik di mana saja pada halaman untuk mengaktifkan audio untuk notifikasi.",
            duration: 10000,
          }
        );
        // Add listeners to try unlocking on the first user interaction
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchend', unlockAudio, { once: true });
      }
    };

    const timer = setTimeout(checkAudio, 2000);

    return () => {
      clearTimeout(timer);
      // Clean up listeners on component unmount, just in case
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
    };
  }, []);
}