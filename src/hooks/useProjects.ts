import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define a type for the project data returned by the RPC
// This is a simplified version based on the Dashboard's usage
export type DashboardProject = {
  id: string;
  name: string;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  assignedTo: { id: string; name: string; avatar_url: string; }[];
  // Add other fields from the RPC as needed
  [key: string]: any;
};

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

  return data as DashboardProject[];
};

export const useProjects = ({ limit = 50, offset = 0, searchTerm = '' } = {}) => {
  return useQuery<DashboardProject[], Error>({
    queryKey: ['projects', { limit, offset, searchTerm }],
    queryFn: () => fetchProjects({ limit, offset, searchTerm }),
    // Keep data fresh for 5 minutes, but refetch in the background every minute
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60,
  });
};