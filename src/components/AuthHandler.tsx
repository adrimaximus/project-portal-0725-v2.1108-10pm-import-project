import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AuthHandler = () => {
  const { session, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event) => {
      if (_event === 'PASSWORD_RECOVERY') {
        // This event is fired when the user clicks the password recovery link.
        // The new URL will contain a hash with the access token.
        // Supabase client handles this, and the onAuthStateChange will fire again with a new session.
        // We can navigate to the reset page.
        navigate('/reset-password', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && user && session) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      if (['/login', '/', '/auth/callback'].includes(location.pathname)) {
        navigate(from, { replace: true });
      }
    }
  }, [user, isLoading, session, navigate, location]);

  return null; // This component does not render anything
};

export default AuthHandler;