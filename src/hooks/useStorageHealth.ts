import { useState, useEffect, useCallback } from 'react';
import SafeLocalStorage from '@/lib/localStorage';
import { toast } from 'sonner';

interface StorageHealth {
  isHealthy: boolean;
  usagePercentage: number;
  itemCount: number;
  lastCleanup: number | null;
  warnings: string[];
}

const useStorageHealth = () => {
  const [health, setHealth] = useState<StorageHealth>({
    isHealthy: true,
    usagePercentage: 0,
    itemCount: 0,
    lastCleanup: null,
    warnings: [],
  });

  const checkHealth = useCallback(() => {
    const info = SafeLocalStorage.getStorageInfo();
    const usagePercentage = info.total > 0 ? (info.used / info.total) * 100 : 0;
    const lastCleanup = SafeLocalStorage.getItem<number>('last_cleanup_timestamp');
    
    const warnings: string[] = [];
    let isHealthy = true;

    // Check usage percentage
    if (usagePercentage > 90) {
      warnings.push('Storage is critically full (>90%)');
      isHealthy = false;
    } else if (usagePercentage > 80) {
      warnings.push('Storage is nearly full (>80%)');
    }

    // Check if cleanup is needed (older than 7 days)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (!lastCleanup || lastCleanup < oneWeekAgo) {
      warnings.push('Storage cleanup recommended');
    }

    // Check for too many items
    if (info.items > 100) {
      warnings.push('Large number of stored items detected');
    }

    setHealth({
      isHealthy,
      usagePercentage,
      itemCount: info.items,
      lastCleanup,
      warnings,
    });

    return { isHealthy, warnings };
  }, []);

  const performCleanup = useCallback(() => {
    const cleanedCount = SafeLocalStorage.cleanup();
    SafeLocalStorage.setItem('last_cleanup_timestamp', Date.now());
    
    if (cleanedCount > 0) {
      toast.success(`Cleaned up ${cleanedCount} expired items`);
    }
    
    checkHealth();
    return cleanedCount;
  }, [checkHealth]);

  const autoCleanup = useCallback(() => {
    const { isHealthy, warnings } = checkHealth();
    
    if (!isHealthy || warnings.some(w => w.includes('cleanup recommended'))) {
      performCleanup();
    }
  }, [checkHealth, performCleanup]);

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up periodic health checks (every 5 minutes)
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    // Perform auto cleanup on mount if needed
    autoCleanup();

    return () => clearInterval(interval);
  }, [checkHealth, autoCleanup]);

  return {
    health,
    checkHealth,
    performCleanup,
    autoCleanup,
  };
};

export default useStorageHealth;