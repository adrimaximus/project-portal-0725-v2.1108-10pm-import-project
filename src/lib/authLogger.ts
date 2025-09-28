import { supabase } from '@/integrations/supabase/client';

type AuthEventType = 
  | 'login_attempt' 
  | 'signup_attempt' 
  | 'magic_link_sent' 
  | 'password_reset_requested'
  | 'logout';

interface AuthLogData {
  event_type: AuthEventType;
  email: string;
  success: boolean;
  error_message?: string;
  additional_data?: Record<string, any>;
}

export const logAuthEvent = async (data: AuthLogData) => {
  try {
    const { error } = await supabase.functions.invoke('auth-logger', {
      body: {
        ...data,
        user_agent: navigator.userAgent,
        ip_address: null, // Will be detected by the edge function
      },
    });

    if (error) {
      console.warn('Failed to log auth event:', error);
    }
  } catch (error) {
    console.warn('Auth logging failed:', error);
    // Don't throw - logging failure shouldn't break auth flow
  }
};