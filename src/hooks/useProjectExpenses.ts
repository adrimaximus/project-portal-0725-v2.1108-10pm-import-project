import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types';

export const useProjectExpenses = (projectId: string) => {
  return useQuery({
    queryKey: ['project_expenses', projectId],
    queryFn: async () => {
      // The RLS policy we just created will automatically filter this
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Expense[];
    },
    enabled: !!projectId,
  });
};