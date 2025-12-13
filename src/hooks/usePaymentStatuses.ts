import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentStatusDefinition } from '@/types';

const fetchPaymentStatuses = async (): Promise<PaymentStatusDefinition[]> => {
  const { data, error } = await supabase
    .from('payment_statuses')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const usePaymentStatuses = () => {
  return useQuery<PaymentStatusDefinition[]>({
    queryKey: ['payment_statuses'],
    queryFn: fetchPaymentStatuses,
  });
};