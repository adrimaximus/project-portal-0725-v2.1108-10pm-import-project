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
        navigate('/reset-password', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && user && session) {
      const searchParams = new URLSearchParams(location.search);
      const serviceParam = searchParams.get('service');
      
      let targetPath = (location.state as any)?.from?.pathname;
      let targetSearch = (location.state as any)?.from?.search || '';

      // If 'service' query param exists, prioritize sending user to Request page
      if (serviceParam) {
        targetPath = '/request';
        // Keep the service param in the query string for the Request page to read
        if (!targetSearch.includes('service=')) {
            targetSearch = targetSearch ? `${targetSearch}&service=${serviceParam}` : `?service=${serviceParam}`;
        }
      } else if (!targetPath) {
        targetPath = '/dashboard';
      }

      // Only redirect if we are on auth-related pages (prevent redirect loop if already on correct page)
      if (['/login', '/', '/auth/callback'].includes(location.pathname)) {
        navigate(targetPath + targetSearch, { replace: true });
      }
    }
  }, [user, isLoading, session, navigate, location]);

  return null; // This component does not render anything
};

export default AuthHandler;