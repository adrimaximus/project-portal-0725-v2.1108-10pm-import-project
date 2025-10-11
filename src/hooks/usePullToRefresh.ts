import { useState, useCallback, useRef } from 'react';

const PULL_THRESHOLD = 80; // Piksel yang harus ditarik sebelum penyegaran terpicu
const PULL_RESISTANCE = 0.6; // Membuat tarikan terasa lebih berat

export const usePullToRefresh = (onRefresh: () => Promise<any>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  const scrollableRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (scrollableRef.current && scrollableRef.current.scrollTop === 0 && !isRefreshing) {
      touchStartRef.current = e.touches[0].clientY;
    } else {
      touchStartRef.current = null;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (touchStartRef.current === null) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - touchStartRef.current;

    if (pullDistance > 0) {
      e.preventDefault();
      setPullPosition(pullDistance * PULL_RESISTANCE);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (touchStartRef.current === null) return;

    if (pullPosition > PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullPosition(0);
    touchStartRef.current = null;
  }, [pullPosition, onRefresh]);

  const setRef = useCallback((node: HTMLElement | null) => {
    scrollableRef.current = node;
  }, []);

  return {
    isRefreshing,
    pullPosition,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    setRef,
  };
};