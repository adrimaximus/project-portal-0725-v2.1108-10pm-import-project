import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types';
import { toast } from 'sonner';

const fetchGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase.rpc('get_user_goals');
  
  if (error) {
    console.error('Error fetching goals:', error);
    toast.error('Failed to fetch goals.');
    throw new Error(error.message);
  }
  
  return (data as Goal[]) || [];
};

export const useGoals = () => {
  return useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });
};