import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const nonSavablePaths = ['/login', '/reset-password', '/'];

export const useLocationSaver = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !nonSavablePaths.includes(location.pathname)) {
      localStorage.setItem('lastVisitedPage', location.pathname);
    }
  }, [location.pathname, user]);
};