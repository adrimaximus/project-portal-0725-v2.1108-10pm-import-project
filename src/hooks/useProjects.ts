import { useInfiniteQuery } from '@tanstack/react-query';
import { getDashboardProjects } from '@/api/projects';

const PAGE_SIZE = 20;

const fetchProjects = async ({ pageParam = 0, searchTerm }: { pageParam: number, searchTerm: string }) => {
  const projects = await getDashboardProjects({
    limit: PAGE_SIZE,
    offset: pageParam * PAGE_SIZE,
    searchTerm,
  });
  return {
    projects,
    nextPage: projects.length === PAGE_SIZE ? pageParam + 1 : null,
  };
};

export const useProjects = ({ searchTerm }: { searchTerm: string } = { searchTerm: "" }) => {
  return useInfiniteQuery({
    queryKey: ['projects', { searchTerm }],
    queryFn: ({ pageParam }) => fetchProjects({ pageParam, searchTerm }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
};