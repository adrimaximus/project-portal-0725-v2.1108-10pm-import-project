import { useState, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

export interface SortConfig<K> {
  key: K | null;
  direction: SortDirection;
}

export const useSortConfig = <K extends string | number | symbol>(
  initialConfig: SortConfig<K>
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(initialConfig);

  const requestSort = useCallback((key: K) => {
    setSortConfig(prevConfig => {
      // If the key is the same and direction is 'desc', reset the sort
      if (prevConfig.key === key && prevConfig.direction === 'desc') {
        return { key: null, direction: 'asc' }; // Reset to no key, default direction asc
      }
      
      let direction: SortDirection = 'asc';
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  }, []);

  return { sortConfig, requestSort };
};