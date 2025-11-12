import { useState, useCallback } from 'react';

type SortDirection = 'ascending' | 'descending';

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
      let direction: SortDirection = 'ascending';
      if (prevConfig.key === key && prevConfig.direction === 'ascending') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);

  return { sortConfig, requestSort };
};