import { useState, useEffect, useCallback } from 'react';
import SafeLocalStorage from '@/lib/localStorage';

type StorageValue = string | number | boolean | object | null;
type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T extends StorageValue>(
  key: string,
  initialValue: T,
  expiresInMs?: number
): [T, (value: SetValue<T>) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = SafeLocalStorage.getItem<T>(key, initialValue);
      return item ?? initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      SafeLocalStorage.setItem(key, valueToStore, expiresInMs);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, expiresInMs]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      SafeLocalStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;