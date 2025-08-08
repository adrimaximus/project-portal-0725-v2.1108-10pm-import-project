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
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl lg:grid lg:grid-cols-2 rounded-2xl shadow-lg overflow-hidden bg-white">
        {/* Left side: Login Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-8 flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
          </div>
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your projects and collaborate with your team.
            </p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            view="sign_in"
          />
        </div>

        {/* Right side: Image Panel */}
        <div className="hidden lg:flex items-center justify-center p-8 bg-muted">
          <div className="text-center">
            <img src="/placeholder.svg" alt="Abstract illustration" className="w-full max-w-sm mx-auto" />
            <h3 className="mt-8 text-2xl font-bold text-foreground">
              Streamline Your Workflow
            </h3>
            <p className="mt-2 text-muted-foreground">
              Our platform helps you manage every detail of your projects from start to finish.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;