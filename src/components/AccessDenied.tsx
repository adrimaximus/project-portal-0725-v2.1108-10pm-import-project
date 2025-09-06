import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingScreen from './LoadingScreen';

const AccessDenied = () => {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("You do not have permission to access this page.");
    // Redirect to a safe page that all users should have access to, like their profile.
    navigate('/profile', { replace: true }); 
  }, [navigate]);
  return <LoadingScreen />;
};

export default AccessDenied;