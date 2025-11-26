import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

const AuthCallbackPage = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        // If no session after loading, something went wrong or user is not logged in
        navigate('/login', { replace: true });
      }
      // If session exists, AuthHandler in App.tsx will handle the redirect
      // preserving any query parameters.
    }
  }, [session, isLoading, navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;