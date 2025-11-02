import { useInfiniteQuery } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';
import { useEffect } from 'react';

const PAGE_SIZE = 50; // Increase page size for faster full load

const fetchProjects = async ({ pageParam = 0, searchTerm, excludeOtherPersonal }: { pageParam: number, searchTerm: string, excludeOtherPersonal: boolean }) => {
  const projects = await getDashboardProjects({
    limit: PAGE_SIZE,
    offset: pageParam * PAGE_SIZE,
    searchTerm,
    excludeOtherPersonal,
  });
  return {
    projects,
    nextPage: projects.length === PAGE_SIZE ? pageParam + 1 : null,
  };
};

export const useProjects = ({ searchTerm, fetchAll = false, excludeOtherPersonal = false }: { searchTerm?: string, fetchAll?: boolean, excludeOtherPersonal?: boolean } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ['projects', { searchTerm, excludeOtherPersonal }],
    queryFn: ({ pageParam }) => fetchProjects({ pageParam: pageParam as number, searchTerm: searchTerm || "", excludeOtherPersonal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (fetchAll && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [fetchAll, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return query;
};