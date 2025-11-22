import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

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
      // 1. Jika klik kolom baru, mulai dengan Ascending
      if (currentConfig.key !== key) {
        return { key, direction: 'asc' };
      }

      // 2. Jika klik kolom yang sama dan sedang Ascending -> ubah ke Descending
      if (currentConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      }

      // 3. Jika klik kolom yang sama dan sedang Descending -> Reset (Matikan sort)
      return { key: null, direction: 'asc' }; // Kembali ke default
    });
  }, []);

  return { sortConfig, requestSort };
};