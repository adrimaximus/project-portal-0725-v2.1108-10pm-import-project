import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';

const fetchProjects = async (): Promise<Project[]> => {
  const batchSize = 10;
  let offset = 0;
  let allData: Project[] = [];
  
  while (true) {
    const { data, error } = await supabase
      .rpc('get_dashboard_projects', { p_limit: batchSize, p_offset: offset });
      
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects.');
      throw new Error(error.message);
    }
    
    if (data) {
      allData = allData.concat(data as Project[]);
      if ((data as any[]).length < batchSize) {
        break;
      }
      offset += batchSize;
    } else {
      break;
    }
  }
  
  return allData;
};

export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
};