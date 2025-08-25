import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const LoginPage = () => {
  const { session, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();
  const [lastUserName, setLastUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
  }, []);

  useEffect(() => {
    if (authContextLoading) return;

    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, authContextLoading, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === 's' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey
      ) {
        event.preventDefault();
        const signInButton = document.querySelector(
          '.supabase-auth-ui_ui-button[type="submit"]'
        ) as HTMLElement | null;
        
        if (signInButton) {
          signInButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2940&auto=format&fit=crop')"}}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 text-white bg-black/50 backdrop-blur-md">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-white/80">A Wise Quote</p>
            <div className="w-16 h-px bg-white/50 mt-2"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-serif font-bold">Get Everything You Want</h2>
            <p className="text-white/80">You can get everything you want if you work hard, trust the process, and stick to the plan.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-black/50 backdrop-blur-md p-8 sm:p-12 flex flex-col justify-center text-white">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Package className="h-7 w-7 text-white" />
              <span className="text-xl font-bold">Client Portal</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">
              Welcome Back{lastUserName ? `, ${lastUserName}` : ''}!👋
            </h1>
            <p className="text-white/80 mb-8">Enter your credentials to access your account.</p>
            
            <Auth
              supabaseClient={supabase}
              theme="dark"
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                    },
                  },
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/dashboard`}
              socialLayout="horizontal"
            />
            <p className="text-center text-xs text-white/50 mt-6">
              Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/80">S</kbd> to sign in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;