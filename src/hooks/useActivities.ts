import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';

export interface ProjectActivity {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string;
  user_initials: string;
  type: string;
  details: {
    description: string;
  };
  created_at: string;
}

const fetchActivities = async () => {
  const { data, error } = await supabase.rpc('get_global_project_activities', {
    p_limit: 10,
    p_offset: 0,
  });

  if (error) {
    console.error('Error fetching activities:', error);
    throw new Error(error.message);
  }
  return data as ProjectActivity[];
};

export const useActivities = () => {
  return useQuery<ProjectActivity[], Error>({
    queryKey: ['activities'],
    queryFn: fetchActivities,
  });
};