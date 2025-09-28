import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SessionManagerProps {
  children: React.ReactNode;
  onSessionExpired?: () => void;
}

const SessionManager = ({ children, onSessionExpired }: SessionManagerProps) => {
  const { session, user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!session || !user) return;

    // Set up session refresh monitoring
    const checkSessionHealth = async () => {
      try {
        setIsValidating(true);
        
        // Test if we can make authenticated requests
        const { error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error && error.message.includes('JWT')) {
          console.warn('Session appears to be invalid, attempting refresh...');
          
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            console.error('Session refresh failed:', refreshError);
            toast.error('Your session has expired. Please log in again.');
            onSessionExpired?.();
            await supabase.auth.signOut();
          } else {
            console.log('Session refreshed successfully');
          }
        }
      } catch (error: any) {
        console.error('Session health check failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    // Check session health every 5 minutes
    const interval = setInterval(checkSessionHealth, 5 * 60 * 1000);
    
    // Initial check
    checkSessionHealth();

    return () => clearInterval(interval);
  }, [session, user, onSessionExpired]);

  if (isValidating) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Validating session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionManager;