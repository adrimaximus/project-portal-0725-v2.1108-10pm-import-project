import { useRef, useEffect, useCallback } from 'react';

export const useDragScrollX = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"], [role="link"]')) return;
    isDown.current = true;
    ref.current.classList.add('cursor-grabbing');
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      isDown.current = false;
      ref.current.classList.remove('cursor-grabbing');
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (ref.current) {
      isDown.current = false;
      ref.current.classList.remove('cursor-grabbing');
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"], [role="link"]')) return;
    isDown.current = true;
    startX.current = e.touches[0].pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDown.current || !ref.current) return;
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDown.current = false;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.style.cursor = 'grab';
      element.addEventListener('mousedown', handleMouseDown as EventListener);
      element.addEventListener('mouseleave', handleMouseLeave as EventListener);
      element.addEventListener('mouseup', handleMouseUp as EventListener);
      element.addEventListener('mousemove', handleMouseMove as EventListener);
      element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
      element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
      element.addEventListener('touchend', handleTouchEnd as EventListener);

      return () => {
        element.removeEventListener('mousedown', handleMouseDown as EventListener);
        element.removeEventListener('mouseleave', handleMouseLeave as EventListener);
        element.removeEventListener('mouseup', handleMouseUp as EventListener);
        element.removeEventListener('mousemove', handleMouseMove as EventListener);
        element.removeEventListener('touchstart', handleTouchStart as EventListener);
        element.removeEventListener('touchmove', handleTouchMove as EventListener);
        element.removeEventListener('touchend', handleTouchEnd as EventListener);
      };
    }
  }, [handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return ref;
};