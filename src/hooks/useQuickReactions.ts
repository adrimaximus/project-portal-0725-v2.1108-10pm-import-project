import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

const DEFAULT_QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];
const STORAGE_KEY = 'quick-reactions';

export const useQuickReactions = () => {
  const [reactions, setReactions] = useLocalStorage<string[]>(STORAGE_KEY, DEFAULT_QUICK_REACTIONS);

  const addReaction = useCallback((emoji: string) => {
    setReactions(prev => {
      if (prev.includes(emoji)) {
        return prev; // Don't add duplicates
      }
      return [...prev, emoji];
    });
  }, [setReactions]);

  const removeReaction = useCallback((emoji: string) => {
    setReactions(prev => prev.filter(r => r !== emoji));
  }, [setReactions]);

  return {
    quickReactions: reactions,
    addReaction,
    removeReaction,
  };
};