import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const emailRedirectTo = import.meta.env.VITE_SITE_URL;
    if (!emailRedirectTo) {
      toast.error('Site URL is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: emailRedirectTo,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="p-8 bg-background rounded-lg shadow-md max-w-sm w-full space-y-6">
        <div className="flex flex-col justify-center items-center gap-2 text-center">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
            <p className="text-muted-foreground">Sign in via magic link with your email below</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>

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