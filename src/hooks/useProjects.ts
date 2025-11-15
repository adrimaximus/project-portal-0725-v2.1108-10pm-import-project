import { useInfiniteQuery, useQuery, InfiniteData } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';
import { useEffect, useMemo } from 'react';
import { Project } from '@/types';

const PAGE_SIZE = 30;

type ProjectsPage = {
  projects: Project[];
  nextPage: number | null;
};

export const useProjects = ({ searchTerm, fetchAll = false, excludeOtherPersonal = false, year, personId }: { searchTerm?: string, fetchAll?: boolean, excludeOtherPersonal?: boolean, year?: number | null, personId?: string | null } = {}) => {
  const queryKeyPrefix = ['projects', { searchTerm, excludeOtherPersonal, year, personId }];

  // 1. Fetch all upcoming projects
  const upcomingQuery = useQuery<Project[], Error>({
    queryKey: [...queryKeyPrefix, 'upcoming'],
    queryFn: async () => {
      return await getDashboardProjects({
        limit: 1000, // A large number to fetch all upcoming
        offset: 0,
        searchTerm: searchTerm || null,
        excludeOtherPersonal,
        year: year === undefined ? null : year,
        timeframe: 'upcoming',
        sortDirection: 'asc',
        personId: personId || null,
      });
    },
  });

  // 2. Fetch past projects with pagination
  const pastQuery = useInfiniteQuery<
    ProjectsPage,
    Error,
    InfiniteData<ProjectsPage, number>,
    any[],
    number
  >({
    queryKey: [...queryKeyPrefix, 'past'],
    queryFn: async ({ pageParam = 0 }) => {
      const projects = await getDashboardProjects({
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
        searchTerm: searchTerm || null,
        excludeOtherPersonal,
        year: year === undefined ? null : year,
        timeframe: 'past',
        sortDirection: 'desc',
        personId: personId || null,
      });
      return {
        projects,
        nextPage: projects.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Auto-fetch all pages if fetchAll is true
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = pastQuery;
  useEffect(() => {
    if (fetchAll && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchAll, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 3. Combine results
  const combinedData = useMemo(() => {
    const upcomingProjects = upcomingQuery.data || [];
    const pastProjectsPages = pastQuery.data?.pages || [];
    
    // Create a structure that mimics InfiniteData<ProjectsPage>
    const combinedPages = [
      { projects: upcomingProjects, nextPage: null }, // All upcoming projects are in the first "page"
      ...pastProjectsPages.map(page => ({ ...page }))
    ];

    return {
      pages: combinedPages,
      pageParams: [0, ...(pastQuery.data?.pageParams || [])],
    };
  }, [upcomingQuery.data, pastQuery.data]);

  return {
    ...pastQuery, // Return infinite query properties for past projects
    data: combinedData,
    isLoading: upcomingQuery.isLoading || pastQuery.isLoading,
    error: upcomingQuery.error || pastQuery.error,
    refetch: () => {
      upcomingQuery.refetch();
      pastQuery.refetch();
    }
  };
};