import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset link sent! Please check your email.');
        setMessageSent(true);
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred.');
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Abstract%20futuristic%20technology%20particles%20background%20royal.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
      <div className="w-full max-w-md bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl z-20 relative p-8 sm:p-12">
        <div className="flex items-center gap-2 mb-8">
          <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-white">7i Portal</span>
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2 text-white">
          Forgot Password?
        </h1>
        <p className="text-white/80 mb-8">
          {messageSent 
            ? "If an account with that email exists, we've sent instructions to reset your password."
            : "No worries, we'll send you reset instructions."
          }
        </p>
        
        {!messageSent ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
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
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
            </Button>
          </form>
        ) : null}

        <div className="mt-6 text-center">
          <Button asChild variant="link" className="text-gray-400 hover:text-white">
            <Link to="/login">
              &larr; Back to Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;