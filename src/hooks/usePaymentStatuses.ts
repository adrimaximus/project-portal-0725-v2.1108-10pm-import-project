import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentStatusDefinition } from '@/types';

export const usePaymentStatuses = () => {
  return useQuery<PaymentStatusDefinition[]>({
    queryKey: ['payment_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_statuses')
        .select('id, name, color, position')
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
  });
};