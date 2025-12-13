import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaymentStatus = {
  id: string;
  name: string;
  color: string;
  position: number;
};

const fetchPaymentStatuses = async (): Promise<PaymentStatus[]> => {
  const { data, error } = await supabase
    .from('payment_statuses')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

export const usePaymentStatuses = () => {
  return useQuery<PaymentStatus[]>({
    queryKey: ['payment_statuses'],
    queryFn: fetchPaymentStatuses,
  });
};