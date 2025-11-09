import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const PROJECTS_PER_PAGE = 20;

const fetchProjects = async ({ pageParam = 0, fetchAll = false, year = null, searchTerm = null }: { pageParam?: number, fetchAll?: boolean, year?: number | null, searchTerm?: string | null }) => {
  const limit = fetchAll ? 1000 : PROJECTS_PER_PAGE;
  const offset = fetchAll ? 0 : pageParam * PROJECTS_PER_PAGE;

  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: limit,
    p_offset: offset,
    p_search_term: searchTerm,
    p_exclude_other_personal: true,
    p_year: year,
  });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }

  return {
    projects: (data as Project[]) || [],
    nextPage: !fetchAll && data && data.length === PROJECTS_PER_PAGE ? pageParam + 1 : undefined,
  };
};

export const useProjects = ({ fetchAll = false, year = null, searchTerm = null }: { fetchAll?: boolean, year?: number | null, searchTerm?: string | null } = {}) => {
  return useInfiniteQuery({
    queryKey: ['projects', { fetchAll, year, searchTerm }],
    queryFn: ({ pageParam }) => fetchProjects({ pageParam, fetchAll, year, searchTerm }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
};