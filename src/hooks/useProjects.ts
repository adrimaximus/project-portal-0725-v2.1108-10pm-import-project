import { useInfiniteQuery } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';
import { useEffect } from 'react';
import SafeLocalStorage from '@/lib/localStorage';

const PAGE_SIZE = 1000;

const fetchProjects = async ({ pageParam = 0, searchTerm, excludeOtherPersonal, year }: { pageParam: number, searchTerm: string, excludeOtherPersonal: boolean, year: number | null }) => {
  const projects = await getDashboardProjects({
    limit: PAGE_SIZE,
    offset: pageParam * PAGE_SIZE,
    searchTerm,
    excludeOtherPersonal,
    year,
  });
  return {
    projects,
    nextPage: projects.length === PAGE_SIZE ? pageParam + 1 : null,
  };
};

export const useProjects = ({ searchTerm, fetchAll = false, excludeOtherPersonal = false, year }: { searchTerm?: string, fetchAll?: boolean, excludeOtherPersonal?: boolean, year?: number | null } = {}) => {
  const queryKey = ['projects', { searchTerm, excludeOtherPersonal, year }];
  const cacheKey = `projects-cache-${JSON.stringify({ searchTerm, excludeOtherPersonal, year })}`;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchProjects({ pageParam: pageParam as number, searchTerm: searchTerm || "", excludeOtherPersonal, year: year === undefined ? null : year }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    placeholderData: () => {
      const cachedData = SafeLocalStorage.getItem(cacheKey);
      if (cachedData && (cachedData as any).pages && (cachedData as any).pageParams) {
        return cachedData;
      }
      return undefined;
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData) {
      SafeLocalStorage.setItem(cacheKey, query.data, 5 * 60 * 1000); // 5 minute cache
    }
  }, [query.data, query.isPlaceholderData, cacheKey]);

  useEffect(() => {
    if (fetchAll && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [fetchAll, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return query;
};