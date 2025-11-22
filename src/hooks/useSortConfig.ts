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
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  return { sortConfig, requestSort };
};