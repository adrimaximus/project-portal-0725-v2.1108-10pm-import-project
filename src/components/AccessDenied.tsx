import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingScreen from './LoadingScreen';

const AccessDenied = () => {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("You do not have permission to access this page.");
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return <LoadingScreen />;
};

export default AccessDenied;