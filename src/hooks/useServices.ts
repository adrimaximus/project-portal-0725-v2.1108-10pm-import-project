import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types';

const fetchServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*').order('title');
  if (error) throw new Error(error.message);
  return data as Service[];
};

export const useServices = () => {
  return useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: fetchServices,
  });
};