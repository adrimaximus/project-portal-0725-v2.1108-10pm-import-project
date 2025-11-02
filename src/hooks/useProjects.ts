import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjects() {
  const fetchProjects = async () => {
    // Using the get_dashboard_projects function which is optimized for dashboard views
    const { data, error } = await supabase
      .rpc('get_dashboard_projects', {
        p_limit: 100,
        p_offset: 0,
      });

    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(error.message);
    }
    return data || [];
  };

  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
}