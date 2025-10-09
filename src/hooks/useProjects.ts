import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchProjects = async ({ queryKey }: { queryKey: any[] }): Promise<Project[]> => {
  const [_key, _userId, { searchTerm }] = queryKey;
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: 1000,
    p_offset: 0,
    p_search_term: searchTerm || null,
  });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.', { description: error.message });
    throw new Error(error.message);
  }
  
  return data as Project[];
};

export const useProjects = (options: { searchTerm?: string } = {}) => {
  const { searchTerm } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-projects-and-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members' },
        (payload) => {
          console.log('Project members change received, refetching projects.', payload);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Projects table change received, refetching projects.', payload);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery<Project[], Error>({
    queryKey: ['projects', user?.id, { searchTerm }],
    queryFn: fetchProjects,
    enabled: !!user,
  });
};