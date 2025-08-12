import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const LoginTransitionPage = () => {
  const { user, clearFreshLoginFlag } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the flag as soon as this page is loaded
    clearFreshLoginFlag();

    // If user data is available, set a timer to navigate to the dashboard.
    if (user) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2500); // Wait 2.5 seconds before redirecting

      return () => clearTimeout(timer);
    }
    // If no user, the component will show the loader. 
    // The AuthContext will eventually provide a user or redirect.
  }, [user, navigate, clearFreshLoginFlag]);

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-center p-4">
      <h1
        className="text-3xl md:text-5xl font-bold animate-fade-in"
      >
        Hey {user.name}, have a good day! 👋
      </h1>
    </div>
  );
};

export default LoginTransitionPage;