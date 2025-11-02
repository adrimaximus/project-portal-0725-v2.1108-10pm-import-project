import { useRef, useEffect, useCallback } from 'react';

export const useDragScrollY = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"], [role="link"], .emoji-mart')) return;
    isDown.current = true;
    ref.current.classList.add('cursor-grabbing');
    startY.current = e.pageY;
    scrollTop.current = ref.current.scrollTop;
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
    const y = e.pageY;
    const walk = y - startY.current;
    ref.current.scrollTop = scrollTop.current - walk;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"], [role="link"], .emoji-mart')) return;
    isDown.current = true;
    startY.current = e.touches[0].pageY;
    scrollTop.current = ref.current.scrollTop;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDown.current || !ref.current) return;
    const y = e.touches[0].pageY;
    const walk = y - startY.current;
    ref.current.scrollTop = scrollTop.current - walk;
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