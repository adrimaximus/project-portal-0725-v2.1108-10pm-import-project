import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800">
        
        {/* Left side: Login Form */}
        <div className="flex flex-col justify-between p-8 sm:p-12">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Client Portal</h1>
            </div>
            <div className="mt-12">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome to Client Portal</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Streamlining project management to optimize your business reality.
              </p>
            </div>
            
            <div className="mt-8">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#06b6d4',
                        brandAccent: '#0891b2',
                        defaultButtonBackgroundHover: '#f8fafc'
                      },
                      radii: {
                        inputBorderRadius: '8px',
                        buttonBorderRadius: '8px',
                      },
                    },
                  },
                  className: {
                    button: 'py-3 text-base',
                    input: 'py-3 text-base',
                    divider: 'my-8',
                    label: 'text-sm font-medium text-gray-700 dark:text-gray-300'
                  }
                }}
                providers={['google']}
                theme="light"
                view="sign_in"
                localization={{
                  variables: {
                    sign_up: {
                      confirmation_text: 'Check your email for the confirmation link. If you don\'t receive it, the email provider may not be configured in your Supabase project.'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-12 p-4 border rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://i.pravatar.cc/150?u=b" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://i.pravatar.cc/150?u=c" />
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-sm">Join with 20k+ Users!</p>
                <p className="text-xs text-gray-500">Let's see our happy customers</p>
              </div>
            </div>
            <button className="p-2 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right side: Video Panel */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-black relative overflow-hidden">
          <iframe
            src="https://player.cloudinary.com/embed/?cloud_name=dxqonns7y&public_id=Pin_on_Disen%CC%83adora_ui5u0u&profile=cld-default&player[autoplay]=true&player[loop]=true&player[muted]=true&player[controls]=false&player[show_logo]=false"
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
          <div className="absolute bottom-12 left-12 right-12 p-6 bg-white/30 dark:bg-black/30 backdrop-blur-lg rounded-xl border border-white/20 z-10">
            <h3 className="text-2xl font-bold text-white">
              Revolutionizing the way we create, manage, and deliver projects.
            </h3>
            <p className="mt-4 text-gray-200">
              Create project briefs with AI voice commands to generate awesome project plans that suit your needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;