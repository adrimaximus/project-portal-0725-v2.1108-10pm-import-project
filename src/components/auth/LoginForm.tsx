import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/lib/authLogger';

interface LoginFormProps {
  onSuccess: () => void;
  isArcBrowser: boolean;
  onDebugUpdate: (info: string) => void;
  onError: (error: string) => void;
}

const LoginForm = ({ onSuccess, isArcBrowser, onDebugUpdate, onError }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting password login for:', email);
    
    setLoading(true);
    onError('');
    onDebugUpdate('Starting login process...');
    
    try {
      // Clear any stale sessions first for clean state
      await supabase.auth.signOut();
      onDebugUpdate('Cleared any existing sessions...');
      
      // Fresh login attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
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
        onError(error.message);
        onDebugUpdate(`Login error: ${error.message}`);
        toast.error(error.message);
        
        // Log failed login attempt
        await logAuthEvent({
          event_type: 'login_attempt',
          email,
          success: false,
          error_message: error.message,
        });
        return;
      }

      if (!data.user || !data.session) {
        const errorMsg = 'Login returned no user/session data';
        console.error(errorMsg);
        onError(errorMsg);
        onDebugUpdate(errorMsg);
        toast.error('Login failed - no user data returned');
        
        await logAuthEvent({
          event_type: 'login_attempt',
          email,
          success: false,
          error_message: errorMsg,
        });
        return;
      }

      console.log('Login successful, user authenticated');
      onDebugUpdate(`Login successful! User: ${data.user.email}, Session: ${!!data.session}`);
      toast.success('Login successful!');
      
      // Log successful login
      await logAuthEvent({
        event_type: 'login_attempt',
        email,
        success: true,
        additional_data: {
          user_id: data.user.id,
          login_method: 'password',
          browser: isArcBrowser ? 'Arc' : 'Other',
        },
      });

      // Wait for session to be properly set in browser
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify session is accessible after login
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      
      if (verifySession) {
        console.log('Session verified, redirecting...');
        onDebugUpdate('Session verified, redirecting to dashboard...');
        onSuccess();
      } else {
        throw new Error('Session not persisted in browser - try disabling strict cookie blocking');
      }

    } catch (error: any) {
      console.error('Login process error:', error);
      onError(error.message || 'Failed to sign in. Try disabling strict cookie blocking.');
      onDebugUpdate(`Error: ${error.message}`);
      toast.error(error.message || 'An unexpected error occurred during login');
      
      // Log unexpected error
      await logAuthEvent({
        event_type: 'login_attempt',
        email,
        success: false,
        error_message: `Process error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="absolute inset-y-0 right-0 h-full px-3 text-gray-400 hover:text-white" 
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
      </Button>
    </form>
  );
};

export default LoginForm;