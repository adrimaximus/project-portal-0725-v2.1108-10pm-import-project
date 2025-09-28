import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Mail, Lock, Eye, EyeOff, Loader2, User as UserIcon, RefreshCw } from 'lucide-react';
import MagicLinkForm from '@/components/MagicLinkForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AuthDebugger from '@/components/AuthDebugger';
import AuthTest from '@/components/AuthTest';
import { logAuthEvent } from '@/lib/authLogger';

const LoginPage = () => {
  const { session, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugger, setShowDebugger] = useState(false);
  const [showAuthTest, setShowAuthTest] = useState(false);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);

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

  useEffect(() => {
    const storedName = localStorage.getItem('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
  }, []);

  // Force refresh session check
  const handleForceRefresh = async () => {
    setForceRefreshCount(prev => prev + 1);
    console.log('Force refreshing session...');
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      console.log('Force refresh result:', { 
        session: !!currentSession, 
        error: error?.message,
        userEmail: currentSession?.user?.email 
      });
      
      if (currentSession?.user) {
        console.log('Session found after force refresh, redirecting...');
        navigate('/dashboard', { replace: true });
      } else {
        toast.info('No active session found');
      }
    } catch (error: any) {
      console.error('Force refresh error:', error);
      toast.error('Failed to refresh session');
    }
  };

  useEffect(() => {
    console.log('LoginPage: Auth context loading:', authContextLoading, 'Session:', !!session);
    
    if (authContextLoading) return;

    if (session) {
      console.log('LoginPage: Session found, redirecting to dashboard');
      // Add a small delay to ensure state is fully updated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  }, [session, authContextLoading, navigate]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting password login for:', email);
    
    setLoading(true);
    setDebugInfo('Starting login process...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Login response:', { 
        user: !!data.user, 
        session: !!data.session, 
        error: error?.message,
        userEmail: data.user?.email,
        sessionAccessToken: data.session?.access_token ? 'present' : 'missing'
      });
      
      if (error) {
        console.error('Login error:', error);
        setDebugInfo(`Login error: ${error.message}`);
        toast.error(error.message);
        
        // Log failed login attempt
        await logAuthEvent({
          event_type: 'login_attempt',
          email,
          success: false,
          error_message: error.message,
        });
      } else if (data.user && data.session) {
        console.log('Login successful, user authenticated');
        setDebugInfo(`Login successful! User: ${data.user.email}, Session: ${!!data.session}`);
        toast.success('Login successful!');
        
        // Log successful login
        await logAuthEvent({
          event_type: 'login_attempt',
          email,
          success: true,
          additional_data: {
            user_id: data.user.id,
            login_method: 'password',
          },
        });
        
        // Force redirect to dashboard immediately with a delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        console.error('Login returned no error but no user/session');
        setDebugInfo('Login returned no error but no user/session data');
        toast.error('Login failed - no user data returned');
        
        // Log unexpected login failure
        await logAuthEvent({
          event_type: 'login_attempt',
          email,
          success: false,
          error_message: 'No user/session data returned',
        });
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      setDebugInfo(`Unexpected error: ${error.message}`);
      toast.error('An unexpected error occurred during login');
      
      // Log unexpected error
      await logAuthEvent({
        event_type: 'login_attempt',
        email,
        success: false,
        error_message: `Unexpected error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting sign up for:', signUpEmail);
    
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
        },
      });

      console.log('Sign up response:', { user: !!data.user, session: !!data.session, error: error?.message });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        
        // Log failed signup attempt
        await logAuthEvent({
          event_type: 'signup_attempt',
          email: signUpEmail,
          success: false,
          error_message: error.message,
        });
      } else if (data.user) {
        if (data.session) {
          toast.success("Account created successfully!");
          // Force redirect to dashboard for successful signup
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          toast.success("Please check your email to verify your account.");
        }
        
        // Log successful signup
        await logAuthEvent({
          event_type: 'signup_attempt',
          email: signUpEmail,
          success: true,
          additional_data: {
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            needs_verification: !data.session,
          },
        });
      }
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
      
      // Log unexpected signup error
      await logAuthEvent({
        event_type: 'signup_attempt',
        email: signUpEmail,
        success: false,
        error_message: `Unexpected error: ${error.message}`,
      });
    } finally {
      setSignUpLoading(false);
    }
  };

  if (showDebugger) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <Button onClick={() => setShowDebugger(false)} variant="outline" className="text-white border-white/20">
              Back to Login
            </Button>
          </div>
          <AuthDebugger />
        </div>
      </div>
    );
  }

  if (showAuthTest) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <Button onClick={() => setShowAuthTest(false)} variant="outline" className="text-white border-white/20">
              Back to Login
            </Button>
          </div>
          <AuthTest />
        </div>
      </div>
    );
  }

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
        <div className="bg-black/50 backdrop-blur-md p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Package className="h-7 w-7 text-white" />
              <span className="text-xl font-bold text-white">Client Portal</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2 text-white">
              Welcome Back{lastUserName ? `, ${lastUserName}` : ''}!👋
            </h1>
            <p className="text-white/80 mb-8">Sign in or create an account to access your portal.</p>
            
            {/* Debug info with force refresh */}
            <div className="mb-4 p-3 bg-yellow-500/20 rounded text-yellow-200 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <div>Debug: Loading={String(authContextLoading)}, Session={String(!!session)}</div>
                  <div>Environment: {window.location.hostname}</div>
                  <div>Refresh Count: {forceRefreshCount}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleForceRefresh}
                  className="text-yellow-200 border-yellow-200/50 hover:bg-yellow-200/10"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              {debugInfo && <div className="mt-2 whitespace-pre-wrap">{debugInfo}</div>}
            </div>
            
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
            
            {/* Enhanced debug section */}
            <div className="mt-4 space-y-2">
              {session && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/dashboard', { replace: true })}
                >
                  Go to Dashboard (Session Active)
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-white border-white/20 hover:bg-white/10"
                onClick={handleForceRefresh}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Force Refresh Session
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-white border-white/20 hover:bg-white/10"
                onClick={() => setShowAuthTest(true)}
              >
                Run Auth Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-white border-white/20 hover:bg-white/10"
                onClick={() => setShowDebugger(true)}
              >
                Open Full Debugger
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {showDebugger && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="mb-4">
              <Button onClick={() => setShowDebugger(false)}>Close Debugger</Button>
            </div>
            <AuthDebugger />
          </div>
        </div>
      )}
      
      {showAuthTest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="mb-4">
              <Button onClick={() => setShowAuthTest(false)}>Close Auth Test</Button>
            </div>
            <AuthTest />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;