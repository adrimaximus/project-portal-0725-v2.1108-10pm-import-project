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
      // If clicking the same key
      if (prevConfig.key === key) {
        // If currently ascending, go descending
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        // If currently descending, go ascending (cycle back)
        return { key, direction: 'asc' };
      }
      // If clicking a new key, start with ascending
      return { key, direction: 'asc' };
    });
  }, []);

  return { sortConfig, requestSort };
};