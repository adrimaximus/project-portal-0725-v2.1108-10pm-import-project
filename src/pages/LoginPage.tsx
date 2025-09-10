import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import MagicLinkForm from '@/components/MagicLinkForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const { session, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    }
    // onAuthStateChange in AuthContext will handle navigation
    setLoading(false);
  };

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
            <p className="text-white/80 mb-8">Sign in to access your portal.</p>
            
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                <TabsTrigger value="password" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">Password</TabsTrigger>
                <TabsTrigger value="magic-link" className="text-gray-400 data-[state=active]:bg-gray-700/50 data-[state=active]:text-white">Magic Link</TabsTrigger>
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
            </Tabs>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;