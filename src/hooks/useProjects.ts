import { useInfiniteQuery, useQuery, InfiniteData } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';
import { useEffect, useMemo } from 'react';
import { Project, AdvancedFiltersState } from '@/types';
import { DateRange } from 'react-day-picker';

const PAGE_SIZE = 30;

type ProjectsPage = {
  projects: Project[];
  nextPage: number | null;
};

export const useProjects = ({ 
  searchTerm, 
  fetchAll = false, 
  excludeOtherPersonal = false, 
  advancedFilters,
  dateRange,
  sortConfig,
}: { 
  searchTerm?: string, 
  fetchAll?: boolean, 
  excludeOtherPersonal?: boolean, 
  advancedFilters?: AdvancedFiltersState,
  dateRange?: DateRange,
  sortConfig?: { key: string | null, direction: 'asc' | 'desc' }
} = {}) => {
  const queryKey = ['projects', { searchTerm, excludeOtherPersonal, advancedFilters, dateRange, sortConfig }];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } = useInfiniteQuery<
    ProjectsPage,
    Error,
    InfiniteData<ProjectsPage, number>,
    any[],
    number
  >({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const projects = await getDashboardProjects({
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
        searchTerm: searchTerm || null,
        excludeOtherPersonal,
        ownerIds: advancedFilters?.ownerIds,
        memberIds: advancedFilters?.memberIds,
        excludedStatus: advancedFilters?.excludedStatus,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
        sortKey: sortConfig?.key,
        sortDirection: sortConfig?.direction,
      });
      return {
        projects,
        nextPage: projects.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (fetchAll && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchAll, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest };
};