import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import MagicLinkForm from '@/components/MagicLinkForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SafeLocalStorage from '@/lib/localStorage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeProvider';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.59 0-8.34-3.82-8.34-8.5s3.75-8.5 8.34-8.5c2.56 0 4.21.98 5.2 1.9l2.78-2.78C19.02 1.62 16.25 0 12.48 0 5.88 0 0 5.96 0 12.48s5.88 12.48 12.48 12.48c7.28 0 12.12-5.04 12.12-12.48 0-.83-.09-1.62-.24-2.4z" />
    </svg>
);

const quotes = [
  {
    title: "Get Everything You Want",
    text: "You can get everything you want if you work hard, trust the process, and stick to the plan."
  },
  {
    title: "The Secret of Getting Ahead",
    text: "The secret of getting ahead is getting started."
  },
  {
    title: "The Best Way to Predict the Future",
    text: "The best way to predict the future is to create it."
  },
  {
    title: "Success is Not Final",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts."
  }
];

const LoginPage = () => {
  const { isLoading: authContextLoading } = useAuth();
  const { theme } = useTheme();
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [videoSrc, setVideoSrc] = useState('');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Google login state
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const storedName = SafeLocalStorage.getItem<string>('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useEffect(() => {
    const darkVideo = "https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Abstract%20futuristic%20technology%20particles%20background%20royal.mp4";
    const lightVideo = "https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Degradado%20en%20movimiento.mp4";

    const updateVideoSrc = () => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const effectiveTheme = theme === "system" ? systemTheme : theme;
      
      const isDark = effectiveTheme.includes('dark') || effectiveTheme === 'claude' || effectiveTheme === 'nature' || effectiveTheme === 'corporate' || effectiveTheme === 'ahensi' || effectiveTheme === 'brand-activator';
      setVideoSrc(isDark ? darkVideo : lightVideo);
    };

    updateVideoSrc();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener('change', updateVideoSrc);
    return () => mediaQuery.removeEventListener('change', updateVideoSrc);
  }, [theme]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        const firstName = data.user.user_metadata?.first_name || data.user.email?.split('@')[0];
        if (firstName) {
          SafeLocalStorage.setItem('lastUserName', firstName);
          setLastUserName(firstName);
        }
        toast.success("Welcome back! Redirecting...");
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback${window.location.search}`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success("Please check your email to verify your account.");
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred during sign up");
      console.error("Sign up error:", error);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${window.location.search}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred with Google sign-in.");
      console.error("Google login error:", error);
      setGoogleLoading(false);
    }
  };

  if (authContextLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden">
      {videoSrc && (
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl z-20 relative">
        {/* Left Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 text-white bg-gradient-to-r from-black/20 to-black/30 backdrop-blur-md">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-white/80">A Wise Quote</p>
            <div className="w-16 h-px bg-white/50 mt-2"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-serif font-bold">{currentQuote.title}</h2>
            <p className="text-white/80">{currentQuote.text}</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-black/80 backdrop-blur-md p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-white">7i Portal</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2 text-white">
              Welcome Back{lastUserName ? `, ${lastUserName}` : ''}!👋
            </h1>
            <p className="text-white/80 mb-8">Sign in or create an account to access your portal.</p>
            
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="password" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">Password</TabsTrigger>
                <TabsTrigger value="magic-link" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">Magic Link</TabsTrigger>
                <TabsTrigger value="signup" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="password" className="pt-6">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-gray-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-right">
                      <Button asChild variant="link" className="px-0 text-gray-400 hover:text-white h-auto text-sm">
                        <Link to="/forgot-password">
                          Forgot Password?
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="magic-link" className="pt-6">
                <MagicLinkForm />
              </TabsContent>
              <TabsContent value="signup" className="pt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary px-3"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signUpEmail"
                      type="email"
                      placeholder="name@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signUpPassword"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-gray-400 hover:text-white" onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={signUpLoading}>
                    {signUpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="my-6"></div>

            <Button variant="outline" className="w-full h-12 text-base bg-transparent border-gray-700 text-white hover:bg-gray-800/50 hover:text-white" onClick={handleGoogleLogin}>
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-5 w-5 fill-white" />
                  Sign in with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;