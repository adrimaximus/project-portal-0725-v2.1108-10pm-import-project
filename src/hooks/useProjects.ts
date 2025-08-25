import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';

const fetchProjects = async (): Promise<Project[]> => {
  // Fetch up to 1000 projects in a single call for dashboard efficiency.
  // The previous loop was causing performance issues.
  const { data, error } = await supabase
    .rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0 });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.');
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