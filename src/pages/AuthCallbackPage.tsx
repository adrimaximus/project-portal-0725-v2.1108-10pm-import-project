import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // URL saat ini berisi kode otorisasi dari Google
      const currentUrl = window.location.href;

      // Coba tukarkan kode untuk sesi
      const { error } = await supabase.auth.exchangeCodeForSession(currentUrl);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        // Jika gagal, arahkan kembali ke halaman login
        navigate("/login");
      } else {
        // Jika berhasil, AuthContext akan mendeteksi sesi baru
        // dan mengarahkan ke halaman utama
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Please wait, authenticating...</p>
    </div>
  );
};

export default AuthCallbackPage;