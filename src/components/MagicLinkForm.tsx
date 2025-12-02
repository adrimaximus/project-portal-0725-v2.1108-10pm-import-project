import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

const MagicLinkForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) {
      toast.info(`Please wait ${cooldown} more seconds before trying again.`);
      return;
    }
    setLoading(true);
    setSubmitted(false);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${window.location.search}`,
        }
      });
      if (error) throw error;
      setSubmitted(true);
      setCooldown(60); 
    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center text-white/90 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
        <h3 className="font-medium text-green-300">Check your email</h3>
        <p className="text-sm mt-2 text-green-100/70">We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pl-10 h-11 bg-[#1A1D26] border-white/5 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20"
        />
      </div>
      <Button type="submit" className="w-full h-11 text-base bg-white text-black hover:bg-slate-200 rounded-xl font-medium transition-all" disabled={loading || cooldown > 0}>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : cooldown > 0 ? (
          `Try again in ${cooldown}s`
        ) : (
          'Send Magic Link'
        )}
      </Button>
    </form>
  );
};

export default MagicLinkForm;