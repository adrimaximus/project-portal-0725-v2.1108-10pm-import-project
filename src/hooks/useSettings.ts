import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'ai-icon-generator-api-key';

export const useSettings = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    setIsLoaded(true);
  }, []);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }, []);

  return { apiKey, saveApiKey, isLoaded };
};