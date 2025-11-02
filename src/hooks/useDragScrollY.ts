import { useRef, useEffect, useCallback } from 'react';

export const useDragScrollY = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('input, textarea, button, a')) return;
    isDown.current = true;
    ref.current.classList.add('cursor-grabbing');
    startY.current = e.pageY - ref.current.offsetTop;
    scrollTop.current = ref.current.scrollTop;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!ref.current) return;
    isDown.current = false;
    ref.current.classList.remove('cursor-grabbing');
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    isDown.current = false;
    ref.current.classList.remove('cursor-grabbing');
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const y = e.pageY - ref.current.offsetTop;
    const walk = (y - startY.current) * 1.2; // multiplier = scroll speed
    ref.current.scrollTop = scrollTop.current - walk;
  }, []);

  // ✅ Optional touch scroll support
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    startY.current = e.touches[0].pageY - ref.current.offsetTop;
    scrollTop.current = ref.current.scrollTop;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDown.current || !ref.current) return;
    const y = e.touches[0].pageY - ref.current.offsetTop;
    const walk = (y - startY.current) * 1.2;
    ref.current.scrollTop = scrollTop.current - walk;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDown.current = false;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.cursor = 'grab';

    el.addEventListener('mousedown', handleMouseDown as EventListener);
    el.addEventListener('mouseup', handleMouseUp as EventListener);
    el.addEventListener('mouseleave', handleMouseLeave as EventListener);
    el.addEventListener('mousemove', handleMouseMove as EventListener);

    el.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    el.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
    el.addEventListener('touchend', handleTouchEnd as EventListener);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown as EventListener);
      el.removeEventListener('mouseup', handleMouseUp as EventListener);
      el.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      el.removeEventListener('mousemove', handleMouseMove as EventListener);

      el.removeEventListener('touchstart', handleTouchStart as EventListener);
      el.removeEventListener('touchmove', handleTouchMove as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return ref;
};
