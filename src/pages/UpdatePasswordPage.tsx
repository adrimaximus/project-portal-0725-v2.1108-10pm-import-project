import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (session) {
          // User is in password recovery mode
        } else {
          setError("Invalid or expired password recovery link.");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        setError(error.message);
      } else {
        toast.success('Password updated successfully! You can now sign in.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred.');
      console.error('Password update error:', error);
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
          Update Your Password
        </h1>
        <p className="text-white/80 mb-8">
          Enter a new password for your account.
        </p>
        
        {error ? (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-md mb-4">
            <p>{error}</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
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
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePasswordPage;