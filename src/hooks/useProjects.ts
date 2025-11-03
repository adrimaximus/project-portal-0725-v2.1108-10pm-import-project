import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';
import { useEffect } from 'react';
import SafeLocalStorage from '@/lib/localStorage';
import { Project } from '@/types';

const PAGE_SIZE = 1000;

type ProjectsPage = {
  projects: Project[];
  nextPage: number | null;
};

const fetchProjects = async ({ pageParam = 0, searchTerm, excludeOtherPersonal, year }: { pageParam: number, searchTerm: string, excludeOtherPersonal: boolean, year: number | null }): Promise<ProjectsPage> => {
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

  const query = useInfiniteQuery<ProjectsPage, Error, InfiniteData<ProjectsPage>, (string | { searchTerm?: string; excludeOtherPersonal: boolean; year: number | null; })[], number>({
    queryKey,
    queryFn: ({ pageParam }) => fetchProjects({ pageParam, searchTerm: searchTerm || "", excludeOtherPersonal, year: year === undefined ? null : year }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    placeholderData: () => {
      const cachedData = SafeLocalStorage.getItem<InfiniteData<ProjectsPage>>(cacheKey);
      if (cachedData && cachedData.pages && cachedData.pageParams) {
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