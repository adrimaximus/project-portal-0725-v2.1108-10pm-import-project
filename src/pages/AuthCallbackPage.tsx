import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

const AuthCallbackPage = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        // Jika tidak ada sesi setelah memuat, ada yang salah.
        // Kembali ke halaman login.
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;