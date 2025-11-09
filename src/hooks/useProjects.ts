import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const fetchProjects = async () => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: 1000,
    p_offset: 0,
  });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }

  return data as Project[];
};

export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
};