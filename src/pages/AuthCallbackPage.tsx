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
        // If no session after loading, something went wrong
        // Go back to login page
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;