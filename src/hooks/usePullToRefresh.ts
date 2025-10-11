import { useState, useCallback, useRef } from 'react';

const PULL_THRESHOLD = 80; // Piksel yang harus ditarik sebelum penyegaran terpicu
const PULL_RESISTANCE = 0.6; // Membuat tarikan terasa lebih berat

export const usePullToRefresh = (onRefresh: () => Promise<any>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null); // Elemen dengan event handler

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (isRefreshing) return;

    const target = e.target as HTMLElement;
    
    // Cari elemen induk yang dapat digulir terdekat (atau elemen itu sendiri) di dalam kontainer utama
    let scrollableElement: HTMLElement | null = target;
    while (scrollableElement && containerRef.current && containerRef.current.contains(scrollableElement)) {
        const style = window.getComputedStyle(scrollableElement);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            break; // Ditemukan
        }
        if (scrollableElement === containerRef.current) {
            break; // Mencapai kontainer teratas
        }
        scrollableElement = scrollableElement.parentElement;
    }

    // Jika tidak ada elemen induk yang dapat digulir ditemukan, mungkin kontainer utama itu sendiri
    if (!scrollableElement || !containerRef.current?.contains(scrollableElement)) {
        scrollableElement = containerRef.current;
    }

    if (scrollableElement && scrollableElement.scrollTop === 0) {
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
      // Hanya cegah default jika kita benar-benar menarik ke bawah dari atas
      // Ini penting agar tidak merusak pengguliran normal
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
        // Tindakan penyegaran mungkin memuat ulang halaman, jadi ini mungkin tidak berjalan
        setIsRefreshing(false);
      }
    }
    
    setPullPosition(0);
    touchStartRef.current = null;
  }, [pullPosition, onRefresh]);

  const setRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
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