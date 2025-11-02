import { useRef, useEffect, useCallback } from 'react';

export const useDragScrollY = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (ref.current) {
      isDown.current = true;
      ref.current.classList.add('cursor-grabbing');
      startY.current = e.pageY - ref.current.offsetTop;
      scrollTop.current = ref.current.scrollTop;
    }
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
    const y = e.pageY - ref.current.offsetTop;
    const walk = (y - startY.current) * 2; // The multiplier adjusts scroll speed
    ref.current.scrollTop = scrollTop.current - walk;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown as EventListener);
      element.addEventListener('mouseleave', handleMouseLeave as EventListener);
      element.addEventListener('mouseup', handleMouseUp as EventListener);
      element.addEventListener('mousemove', handleMouseMove as EventListener);

      return () => {
        element.removeEventListener('mousedown', handleMouseDown as EventListener);
        element.removeEventListener('mouseleave', handleMouseLeave as EventListener);
        element.removeEventListener('mouseup', handleMouseUp as EventListener);
        element.removeEventListener('mousemove', handleMouseMove as EventListener);
      };
    }
  }, [handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove]);

  return ref;
};