import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person, Tag } from '@/types';

const fetchPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase.rpc('get_people_with_details');
  if (error) throw error;
  return data as Person[];
};

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw error;
  return data as Tag[];
};

export const usePeople = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });

  const { data: people = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const requestSort = (key: keyof Person) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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
    people: filteredPeople,
    tags,
    isLoading: isLoadingPeople || isLoadingTags,
    searchTerm,
    setSearchTerm,
    sortConfig,
    requestSort,
  };
};