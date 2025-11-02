import { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person, Tag } from '@/types';

const PAGE_SIZE = 30;

const fetchPeople = async ({ pageParam = 0 }): Promise<{ people: Person[], nextPage: number | null }> => {
  const { data, error } = await supabase.rpc('get_people_with_details', {
    p_limit: PAGE_SIZE,
    p_offset: pageParam * PAGE_SIZE,
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });

  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isLoadingPeople 
  } = useInfiniteQuery({
    queryKey: ['people', 'with-slug'],
    queryFn: fetchPeople,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const people = useMemo(() => data ? data.pages.flatMap(page => page.people) : [], [data]);

  const requestSort = useCallback((key: keyof Person) => {
    setSortConfig(prevConfig => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, [sortConfig]);

  const sortedPeople = useMemo(() => {
    let sortableItems = [...people];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [people, sortConfig]);

  const filteredPeople = useMemo(() => {
    return sortedPeople.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.job_title && person.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedPeople, searchTerm]);

  return {
    people,
    tags,
    isLoading: isLoadingPeople || isLoadingTags,
    searchTerm,
    setSearchTerm,
    sortConfig,
    requestSort,
    filteredPeople,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  };
};