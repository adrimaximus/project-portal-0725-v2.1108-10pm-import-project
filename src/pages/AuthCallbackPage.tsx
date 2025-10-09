import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

const AuthCallbackPage = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        // If no session after loading, something went wrong
        // Go back to login page
        navigate('/login', { replace: true });
      }
    }
  }, [session, isLoading, navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;