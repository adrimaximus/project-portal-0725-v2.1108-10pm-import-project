import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchProjects = async (): Promise<Project[]> => {
  // Fetch up to 1000 projects in a single call for dashboard efficiency.
  // The previous loop was causing performance issues.
  const { data, error } = await supabase
    .rpc('get_dashboard_projects', { p_limit: 1000, p_offset: 0, p_search_term: null });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.');
    throw new Error(error.message);
  }
  
  return data as Project[];
};

export const useProjects = () => {
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
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Projects table change received, refetching projects.', payload);
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery<Project[], Error>({
    queryKey: ['projects', user?.id],
    queryFn: fetchProjects,
    enabled: !!user,
  });
};