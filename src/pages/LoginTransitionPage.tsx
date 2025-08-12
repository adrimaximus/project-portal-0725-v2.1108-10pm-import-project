import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const LoginTransitionPage = () => {
  const { user, clearFreshLoginFlag } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    // Clear the flag as soon as this page is loaded
    clearFreshLoginFlag();
  }, [clearFreshLoginFlag]);

  const slides = user ? [
    `Hey ${user.name}, have a good day!`,
    'How are you today?',
    'Ready to rock?',
    "Don't forget your coffee or tea to start your work!",
  ] : [];

  useEffect(() => {
    if (!user) {
      // If user data is not yet available, wait.
      return;
    }

    if (currentSlide >= slides.length) {
      // After the last slide, navigate to the dashboard
      navigate('/dashboard', { replace: true });
      return;
    }

    const fadeTimeout = setTimeout(() => {
      setFade(false); // Start fade out
    }, 800); // Time the slide is visible

    const slideTimeout = setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
      setFade(true); // Start fade in for the next slide
    }, 1200); // Total time for slide + fade out

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(slideTimeout);
    };
  }, [currentSlide, navigate, slides, user]);

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
        className={`text-3xl md:text-5xl font-bold transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {slides[currentSlide]}
      </h1>
    </div>
  );
};

export default LoginTransitionPage;