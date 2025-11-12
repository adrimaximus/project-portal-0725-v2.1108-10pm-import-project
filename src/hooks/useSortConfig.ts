import { useState, useCallback } from 'react';

type SortDirection = 'asc' | 'desc' | 'ascending' | 'descending';

export interface SortConfig<K> {
  key: K | null;
  direction: SortDirection;
}

export const useSortConfig = <K extends string | number | symbol>(
  initialConfig: SortConfig<K>,
  directions: [SortDirection, SortDirection] = ['asc', 'desc']
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(initialConfig);

  const requestSort = useCallback((key: K) => {
    setSortConfig(prevConfig => {
      let direction: SortDirection = directions[0];
      if (prevConfig.key === key && prevConfig.direction === directions[0]) {
        direction = directions[1];
      }
      return { key, direction };
    });
  }, [directions]);

  return { sortConfig, requestSort };
};