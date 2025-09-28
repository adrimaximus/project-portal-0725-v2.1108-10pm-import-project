import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing auth callback...');
      
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed. Please try logging in again.');
          navigate('/login', { replace: true });
          return;
        }

        if (data.session) {
          console.log('Auth callback successful, session found');
          toast.success('Successfully authenticated!');
          // Force redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.log('Auth callback completed but no session found');
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error('Unexpected error in auth callback:', error);
        toast.error('An unexpected error occurred during authentication.');
        navigate('/login', { replace: true });
      }
    };

    // Only run if not already loading from AuthContext
    if (!loading) {
      if (session) {
        console.log('Session already exists, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        handleAuthCallback();
      }
    }
  }, [session, loading, navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;