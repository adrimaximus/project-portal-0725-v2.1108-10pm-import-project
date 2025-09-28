import { supabase } from '@/integrations/supabase/client';

interface AuthEventData {
  event_type: string;
  email: string;
  success: boolean;
  error_message?: string;
  additional_data?: Record<string, any>;
}

export const logAuthEvent = async (eventData: AuthEventData) => {
  try {
    const { error } = await supabase.from('auth_logs').insert({
      event_type: eventData.event_type,
      email: eventData.email,
      success: eventData.success,
      error_message: eventData.error_message,
      user_agent: navigator.userAgent,
      ip_address: null, // Will be filled by server if needed
      additional_data: eventData.additional_data || {},
    });

    if (error) {
      console.error('Failed to log auth event:', error);
    }
  } catch (error) {
    console.error('Auth logging error:', error);
  }
};