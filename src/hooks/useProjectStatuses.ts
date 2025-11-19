import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectStatusDef {
  id: string;
  name: string;
  color: string;
  position: number;
}

export const useProjectStatuses = () => {
  return useQuery({
    queryKey: ['project_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_statuses')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as ProjectStatusDef[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};