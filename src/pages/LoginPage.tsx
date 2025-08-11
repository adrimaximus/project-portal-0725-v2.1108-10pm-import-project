import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [view, setView] = useState<'password' | 'magiclink'>('password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Periksa email Anda untuk tautan ajaib!');
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="p-8 bg-background rounded-lg shadow-md max-w-sm w-full space-y-6">
        <div className="flex flex-col justify-center items-center gap-2 text-center">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
        </div>

        {view === 'password' ? (
          <>
            <p className="text-muted-foreground text-center">Masuk ke akun Anda untuk melanjutkan</p>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              theme="light"
              view="sign_in"
            />
            <div className="text-center">
              <Button variant="link" onClick={() => setView('magiclink')}>
                Kirim saya tautan ajaib (magic link)
              </Button>
            </div>
          </>
        ) : (
          <Card className="border-none shadow-none">
            <CardHeader className="text-center p-0">
              <CardTitle>Masuk dengan Magic Link</CardTitle>
              <CardDescription>
                Masukkan email Anda di bawah ini untuk menerima tautan login.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleMagicLinkSignIn}>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Mengirim..." : "Kirim Magic Link"}
                </Button>
                <Button variant="link" onClick={() => setView('password')}>
                  Masuk dengan kata sandi
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        <p className="px-8 text-center text-sm text-muted-foreground">
          Dengan masuk, Anda menyetujui{" "}
          <Link
            to="/terms-of-service"
            className="underline underline-offset-4 hover:text-primary"
          >
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link
            to="/privacy-policy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginPage;