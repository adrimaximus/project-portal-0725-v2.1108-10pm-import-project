import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROJECTS_PER_PAGE = 20;

const fetchProjects = async ({ pageParam, queryKey }: { pageParam: unknown, queryKey: readonly (string | { searchTerm?: string, excludeOtherPersonal?: boolean } | undefined)[] }): Promise<Project[]> => {
  const page = (pageParam as number) || 0;
  const [_key, _userId, options] = queryKey;
  const { searchTerm, excludeOtherPersonal } = (options as { searchTerm?: string, excludeOtherPersonal?: boolean }) || {};
  
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: PROJECTS_PER_PAGE,
    p_offset: page * PROJECTS_PER_PAGE,
    p_search_term: searchTerm || null,
    p_exclude_other_personal: excludeOtherPersonal || false,
  });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.', { description: error.message });
    throw new Error(error.message);
  }
  
  return data as Project[];
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useInfiniteQuery<Project[], Error, InfiniteData<Project[]>, readonly (string | { searchTerm?: string; excludeOtherPersonal?: boolean; } | undefined)[] | undefined, number>({
    queryKey: ['projects', user?.id, { searchTerm, excludeOtherPersonal }],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PROJECTS_PER_PAGE) {
        return undefined; // No more pages
      }
      return allPages.length;
    },
    enabled: !!user,
  });
};