import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase.rpc('get_user_goals');
    
  if (error) {
    console.error('Error fetching goals:', error);
    toast.error('Failed to fetch goals.');
    throw new Error(error.message);
  }
  
  return data as Goal[];
};

export const useGoals = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-goals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        (payload) => {
          console.log('Goals table change received, refetching goals.', payload);
          queryClient.invalidateQueries({ queryKey: ['goals', user.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goal_collaborators' },
        (payload) => {
          console.log('Goal collaborators change received, refetching goals.', payload);
          queryClient.invalidateQueries({ queryKey: ['goals', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery<Goal[], Error>({
    queryKey: ['goals', user?.id],
    queryFn: fetchGoals,
    enabled: !!user,
  });
};