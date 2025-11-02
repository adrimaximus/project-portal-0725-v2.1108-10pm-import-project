import { useRef, useEffect, useCallback } from 'react';

export const useDragScrollX = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    if ((e.target as HTMLElement).closest('input, textarea, button, a')) return;
    isDown.current = true;
    ref.current.classList.add('cursor-grabbing');
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
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
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2; // multiplier = scroll speed
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.cursor = 'grab';

    el.addEventListener('mousedown', handleMouseDown as EventListener);
    el.addEventListener('mouseup', handleMouseUp as EventListener);
    el.addEventListener('mouseleave', handleMouseLeave as EventListener);
    el.addEventListener('mousemove', handleMouseMove as EventListener);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown as EventListener);
      el.removeEventListener('mouseup', handleMouseUp as EventListener);
      el.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      el.removeEventListener('mousemove', handleMouseMove as EventListener);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseLeave, handleMouseMove]);

  return ref;
};
