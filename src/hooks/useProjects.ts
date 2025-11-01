import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchProjects = async ({ queryKey }: { queryKey: readonly (string | { searchTerm?: string, excludeOtherPersonal?: boolean } | undefined)[] }): Promise<Project[]> => {
  const [_key, _userId, options] = queryKey;
  const { searchTerm, excludeOtherPersonal } = (options as { searchTerm?: string, excludeOtherPersonal?: boolean }) || {};
  
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: 1000,
    p_offset: 0,
    p_search_term: searchTerm || null,
    p_exclude_other_personal: excludeOtherPersonal || false,
  });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.', { description: error.message });
    throw new Error(error.message);
  }
  
  // Manually parse JSONB fields which might be returned as strings by RPC
  return (data as any[]).map(p => ({
    ...p,
    assignedTo: p.assignedTo || [],
    tags: p.tags || [],
    tasks: p.tasks || [],
    comments: p.comments || [],
    briefFiles: p.briefFiles || [],
    activities: p.activities || [],
    reactions: p.reactions || [],
    invoice_attachments: p.invoice_attachments || [],
    services: p.services || [],
  })) as Project[];
};

export const useProjects = (options: { searchTerm?: string, excludeOtherPersonal?: boolean } = {}) => {
  const { searchTerm, excludeOtherPersonal } = options;
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
    queryKey: ['projects', user?.id, { searchTerm, excludeOtherPersonal }],
    queryFn: fetchProjects,
    enabled: !!user,
  });
};