import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { Package } from 'lucide-react';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:flex lg:flex-col items-center justify-center p-10 text-center">
        <Package className="h-16 w-16 mx-auto text-primary" />
        <h1 className="mt-6 text-4xl font-bold">Client Portal</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your all-in-one project management hub.
        </p>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Continue with your Google account below.
            </p>
          </div>
          <div className="pt-4">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              onlyThirdPartyProviders
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;