import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  isArcBrowser?: boolean;
}

export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { 
    redirectTo = '/dashboard', 
    requireAuth = true,
    isArcBrowser = false 
  } = options;
  
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const from = (location.state as any)?.from?.pathname || redirectTo;

    if (requireAuth && session) {
      console.log('Auth redirect: User authenticated, redirecting to:', from);
      
      // Use hard redirect for Arc browser or if stuck on login page
      if (isArcBrowser || window.location.pathname === '/login') {
        window.location.replace(from);
      } else {
        navigate(from, { replace: true });
      }
    } else if (!requireAuth && !session) {
      console.log('Auth redirect: User not authenticated, staying on current page');
    }
  }, [session, loading, navigate, redirectTo, requireAuth, isArcBrowser, location]);

  return {
    isRedirecting: loading || (requireAuth && !!session),
    session,
    loading,
  };
};