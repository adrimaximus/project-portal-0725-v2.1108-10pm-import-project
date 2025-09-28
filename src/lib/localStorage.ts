type StorageValue = string | number | boolean | object | null;

interface StorageItem<T = StorageValue> {
  value: T;
  timestamp: number;
  expires?: number;
}

class SafeLocalStorage {
  private static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static createStorageItem<T>(value: T, expiresInMs?: number): StorageItem<T> {
    return {
      value,
      timestamp: Date.now(),
      expires: expiresInMs ? Date.now() + expiresInMs : undefined,
    };
  }

  static setItem<T extends StorageValue>(
    key: string, 
    value: T, 
    expiresInMs?: number
  ): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const item = this.createStorageItem(value, expiresInMs);
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Failed to set localStorage item:', error);
      
      // Try to free up space by cleaning expired items
      this.cleanup();
      
      // Retry once
      try {
        const item = this.createStorageItem(value, expiresInMs);
        localStorage.setItem(key, JSON.stringify(item));
        return true;
      } catch (retryError) {
        console.error('Failed to set localStorage item after cleanup:', retryError);
        return false;
      }
    }
  }

  static getItem<T extends StorageValue>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) {
      return defaultValue ?? null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return defaultValue ?? null;
      }

      const item: StorageItem<T> = JSON.parse(stored);
      
      // Check if expired
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);
        return defaultValue ?? null;
      }

      return item.value;
    } catch (error) {
      console.error('Failed to get localStorage item:', error);
      // Remove corrupted item
      this.removeItem(key);
      return defaultValue ?? null;
    }
  }

  static removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove localStorage item:', error);
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  static cleanup(): number {
    if (!this.isAvailable()) return 0;

    let cleanedCount = 0;
    const now = Date.now();

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const stored = localStorage.getItem(key);
          if (!stored) continue;

          const item: StorageItem = JSON.parse(stored);
          
          // Remove expired items
          if (item.expires && now > item.expires) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch {
          // Remove corrupted items
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error('Error during localStorage cleanup:', error);
    }

    return cleanedCount;
  }

  static getStorageInfo(): {
    used: number;
    available: number;
    total: number;
    items: number;
  } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, total: 0, items: 0 };
    }

    let used = 0;
    let items = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
            items++;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating storage info:', error);
    }

    // Estimate total available (usually 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate
    const available = total - used;

    return { used, available, total, items };
  }

  static exportData(): Record<string, any> {
    if (!this.isAvailable()) return {};

    const data: Record<string, any> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error exporting localStorage data:', error);
    }

    return data;
  }

  static importData(data: Record<string, any>): boolean {
    if (!this.isAvailable()) return false;

    try {
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      });
      return true;
    } catch (error) {
      console.error('Error importing localStorage data:', error);
      return false;
    }
  }
}

export default SafeLocalStorage;