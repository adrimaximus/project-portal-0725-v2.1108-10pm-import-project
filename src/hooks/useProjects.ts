import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const fetchProjects = async ({ limit = 50, offset = 0, searchTerm = '' }: { limit?: number; offset?: number; searchTerm?: string }) => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: limit,
    p_offset: offset,
    p_search_term: searchTerm || null,
  });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Could not fetch projects');
  }

  return (data || []) as Project[];
};

export const useProjects = ({ limit = 50, offset = 0, searchTerm = '' } = {}) => {
  return useQuery<Project[], Error>({
    queryKey: ['projects', { limit, offset, searchTerm }],
    queryFn: () => fetchProjects({ limit, offset, searchTerm }),
    // Keep data fresh for 5 minutes, but refetch in the background every minute
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60,
  });
};