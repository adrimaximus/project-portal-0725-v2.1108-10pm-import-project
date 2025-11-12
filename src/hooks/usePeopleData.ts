import { useState, useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person, Tag } from '@/types';
import debounce from 'lodash.debounce';
import { useSortConfig } from './useSortConfig';

const PAGE_SIZE = 30;

const fetchPeople = async ({ pageParam = 0, searchTerm = '' }): Promise<{ people: Person[], nextPage: number | null }> => {
  const { data, error } = await supabase.rpc('get_people_with_details', {
    p_limit: PAGE_SIZE,
    p_offset: pageParam * PAGE_SIZE,
    p_search_term: searchTerm,
  });

  if (error) throw error;

  const people = (data as Person[]).map(person => ({
    ...person,
    tags: person.tags ? [...person.tags].sort((a, b) => a.name.localeCompare(b.name)) : [],
  }));

  return {
    people,
    nextPage: data.length === PAGE_SIZE ? pageParam + 1 : null,
  };
};

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw error;
  return data as Tag[];
};

export const usePeopleData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const { sortConfig, requestSort } = useSortConfig<keyof Person>({ key: 'updated_at', direction: 'descending' });

  const debouncedSetSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isLoadingPeople 
  } = useInfiniteQuery({
    queryKey: ['people', 'with-slug', debouncedSearchTerm],
    queryFn: ({ pageParam }) => fetchPeople({ pageParam, searchTerm: debouncedSearchTerm }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const people = useMemo(() => data ? data.pages.flatMap(page => page.people) : [], [data]);

  const sortedPeople = useMemo(() => {
    let sortableItems = [...people];
    if (sortConfig.key !== null && sortConfig.key !== 'kanban_order' && sortConfig.key !== 'updated_at') {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const compareResult = String(aValue).localeCompare(String(bValue));

        return sortConfig.direction === 'ascending' ? compareResult : -compareResult;
      });
    }
    return sortableItems;
  }, [people, sortConfig]);

  return {
    people: sortedPeople,
    tags,
    isLoading: isLoadingPeople || isLoadingTags,
    searchTerm,
    setSearchTerm,
    sortConfig,
    requestSort,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  };
};