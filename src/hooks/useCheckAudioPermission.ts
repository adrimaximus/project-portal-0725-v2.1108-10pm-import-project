import { useEffect } from "react";
import { toast } from "sonner";

export function useCheckAudioPermission() {
  useEffect(() => {
    const checkAudio = async () => {
      // Kami hanya ingin memeriksa ini sekali per sesi agar tidak mengganggu pengguna.
      if (sessionStorage.getItem('audioPermissionChecked')) {
        return;
      }
      sessionStorage.setItem('audioPermissionChecked', 'true');

      try {
        // Kami akan mencoba memutar file audio kecil yang senyap.
        // Ini adalah cara standar untuk memeriksa apakah browser mengizinkan pemutaran audio.
        const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        testAudio.volume = 0;
        await testAudio.play();
      } catch (err: any) {
        // Jika gagal dengan 'NotAllowedError', berarti browser memblokirnya.
        if (err.name === 'NotAllowedError') {
          toast.warning(
            "🔇 Suara notifikasi mungkin diblokir.",
            {
              description: "Silakan klik di mana saja pada halaman untuk mengaktifkan audio untuk notifikasi.",
              duration: 10000,
            }
          );
        } else {
          // Catat error lain untuk debugging, tetapi jangan ganggu pengguna.
          console.warn("Pemeriksaan izin audio gagal:", err);
        }
      }
    };

    // Kami akan menunggu beberapa detik sebelum memeriksa, agar tidak terlalu mengganggu saat halaman dimuat.
    const timer = setTimeout(checkAudio, 2000);

    return () => clearTimeout(timer);
  }, []);
}