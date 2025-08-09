import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
      toast.success(`Welcome back!`);
    }
  }, [session, navigate, from]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="p-8 bg-background rounded-lg shadow-md max-w-sm w-full space-y-6">
        <div className="flex flex-col justify-center items-center gap-2 text-center">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
            <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          theme="light"
          redirectTo={`${window.location.origin}/auth/callback`}
        />
        <p className="px-8 text-center text-sm text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link
            to="/terms-of-service"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy-policy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginPage;