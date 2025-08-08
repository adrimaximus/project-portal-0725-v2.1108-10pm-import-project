import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Package } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/');
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          theme="light"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default LoginPage;