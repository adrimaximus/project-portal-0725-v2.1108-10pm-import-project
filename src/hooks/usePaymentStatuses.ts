import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentStatuses = () => {
  return useQuery({
    queryKey: ['payment_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_statuses')
        .select('*')
        .order('position');
      
      if (error) throw error;
      return data;
    },
  });
};