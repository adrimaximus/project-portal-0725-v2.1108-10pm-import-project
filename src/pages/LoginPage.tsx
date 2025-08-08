import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

const LoginPage = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        
        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();
        
        const user = {
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          avatar: userInfo.picture,
          initials: userInfo.name.split(' ').map((n: string) => n[0]).join(''),
        };

        login(user);
        navigate('/');
        toast.success(`Welcome back, ${user.name}!`);
      } catch (error) {
        console.error('Login Error:', error);
        toast.error('An error occurred during login. Please try again.');
      }
    },
    onError: () => {
      toast.error('Google login failed. Please try again.');
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="text-center p-8 bg-background rounded-lg shadow-md max-w-sm w-full">
        <div className="flex justify-center items-center gap-2 mb-4">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-semibold">Client Portal</h1>
        </div>
        <p className="text-muted-foreground mb-6">Please sign in to continue</p>
        <Button onClick={() => handleLogin()} className="w-full">
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.7 92 248.4 92c-82.8 0-150.5 66.6-150.5 148.4s67.7 148.4 150.5 148.4c97.2 0 130.3-72.9 134.6-110.3H248.4v-91.1h235.5c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;