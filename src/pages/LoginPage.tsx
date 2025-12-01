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
import { cn } from '@/lib/utils';

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
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-background text-foreground font-sans">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden border border-border shadow-2xl z-20 relative bg-card/50 backdrop-blur-xl">
        {/* Left Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 text-white bg-gradient-to-br from-primary/20 to-blue-600/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-foreground/80 mb-6">
              <span>Daily Inspiration</span>
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full mb-6"></div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4 font-serif">{currentQuote.title}</h2>
            <p className="text-base xl:text-lg text-white/80 leading-relaxed">"{currentQuote.text}"</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-sm text-white/60 mt-8">
             <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                        <img 
                            src={`https://i.pravatar.cc/150?u=${i + 20}`} 
                            alt={`User ${i}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
             </div>
             <span className="ml-2">Be happy users with us</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-background/40">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-border mb-4">
                <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome Back{lastUserName ? `, ${lastUserName}` : ''}!
              </h1>
              <p className="text-muted-foreground text-sm">Sign in or create an account to access your portal.</p>
            </div>
            
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg mb-6">
                <TabsTrigger value="password" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground text-xs rounded-md transition-all shadow-sm">Password</TabsTrigger>
                <TabsTrigger value="magic-link" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground text-xs rounded-md transition-all shadow-sm">Magic Link</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground text-xs rounded-md transition-all shadow-sm">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-right">
                      <Button asChild variant="link" className="px-0 text-primary hover:text-primary/80 h-auto text-xs">
                        <Link to="/forgot-password">
                          Forgot Password?
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base rounded-xl font-medium transition-all" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="magic-link">
                <MagicLinkForm />
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
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
                        className="h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 px-3"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signUpEmail"
                      type="email"
                      placeholder="name@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signUpPassword"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      className="pl-10 h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base rounded-xl font-medium transition-all" disabled={signUpLoading}>
                    {signUpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
            </div>

            <Button variant="outline" className="w-full h-11 text-base bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-all" onClick={handleGoogleLogin}>
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-5 w-5 fill-current" />
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