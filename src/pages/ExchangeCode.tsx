import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';

const ExchangeCode = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const exchange = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error_description') || url.searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login', { replace: true });
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError);
        }
        // Navigasi akan ditangani oleh onAuthStateChange di AuthContext
        navigate('/dashboard', { replace: true });
      } else {
        // Jika tidak ada kode, kembali ke halaman utama
        navigate('/', { replace: true });
      }
    };

    exchange();
  }, [navigate]);

  return <LoadingScreen />;
};

export default ExchangeCode;