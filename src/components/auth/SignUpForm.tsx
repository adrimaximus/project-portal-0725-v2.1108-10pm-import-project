import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/lib/authLogger';

interface SignUpFormProps {
  isArcBrowser: boolean;
}

const SignUpForm = ({ isArcBrowser }: SignUpFormProps) => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting sign up for:', email);
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
          email: email,
          success: false,
          error_message: error.message,
        });
      } else if (data.user) {
        if (data.session) {
          toast.success("Account created successfully!");
          // Force redirect to dashboard for successful signup
          if (isArcBrowser) {
            window.location.href = '/dashboard';
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          toast.success("Please check your email to verify your account.");
        }
        
        // Log successful signup
        await logAuthEvent({
          event_type: 'signup_attempt',
          email: email,
          success: true,
          additional_data: {
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            needs_verification: !data.session,
            browser: isArcBrowser ? 'Arc' : 'Other',
          },
        });
      }
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
      
      // Log unexpected signup error
      await logAuthEvent({
        event_type: 'signup_attempt',
        email: email,
        success: false,
        error_message: `Unexpected error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pl-10 h-12 bg-gray-800/50 border-gray-700 text-white focus:ring-primary"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          id="signUpPassword"
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
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
      </Button>
    </form>
  );
};

export default SignUpForm;