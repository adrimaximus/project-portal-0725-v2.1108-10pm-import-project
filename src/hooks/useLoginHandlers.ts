import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoginHandlers = (isArcBrowser: boolean) => {
  const navigate = useNavigate();
  const [forceRefreshCount, setForceRefreshCount] = useState(0);

  const handleForceRefresh = useCallback(async () => {
    setForceRefreshCount(prev => prev + 1);
    console.log('Force refreshing session...');
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      console.log('Force refresh result:', { 
        session: !!currentSession, 
        error: error?.message,
        userEmail: currentSession?.user?.email 
      });
      
      if (currentSession?.user) {
        console.log('Session found after force refresh, redirecting...');
        // Force hard redirect for Arc browser
        if (isArcBrowser) {
          window.location.href = '/dashboard';
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast.info('No active session found');
      }
    } catch (error: any) {
      console.error('Force refresh error:', error);
      toast.error('Failed to refresh session');
    }
  }, [isArcBrowser, navigate]);

  const handleArcBrowserFix = useCallback(async () => {
    console.log('Applying Arc browser fix...');
    
    try {
      // Clear any cached auth state
      await supabase.auth.signOut();
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload
      window.location.reload();
    } catch (error: any) {
      console.error('Arc browser fix error:', error);
      toast.error('Failed to apply Arc browser fix');
    }
  }, []);

  const handleNavigateToDashboard = useCallback(() => {
    if (isArcBrowser) {
      window.location.href = '/dashboard';
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [isArcBrowser, navigate]);

  const handleLoginSuccess = useCallback(() => {
    // Force hard navigation for better compatibility
    if (isArcBrowser || window.location.pathname === '/login') {
      console.log('Using hard redirect for Arc browser or stuck on login page');
      window.location.replace('/dashboard');
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [isArcBrowser, navigate]);

  return {
    forceRefreshCount,
    handleForceRefresh,
    handleArcBrowserFix,
    handleNavigateToDashboard,
    handleLoginSuccess,
  };
};