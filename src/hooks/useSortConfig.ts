import { useState, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

export interface SortConfig<K> {
  key: K | null;
  direction: SortDirection;
}

export const useSortConfig = <K extends string | number | symbol>(
  initialConfig: SortConfig<K> = { key: null, direction: 'asc' }
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(initialConfig);

  const requestSort = useCallback((key: K) => {
    setSortConfig((currentConfig) => {
      // If we're sorting by a new key, start with ascending
      if (currentConfig.key !== key) {
        return { key, direction: 'asc' };
      }

      // If we're sorting by the same key, just toggle direction
      // Ascending -> Descending -> Ascending (Loop)
      return {
        key,
        direction: currentConfig.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  }, []);

  return { sortConfig, requestSort };
};