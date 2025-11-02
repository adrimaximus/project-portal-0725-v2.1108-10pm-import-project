import { useState, useEffect, useRef } from 'react';

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const useAnimatedCounter = (endValue: number, duration: number = 750) => {
  const [count, setCount] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = count; // Start animation from the current displayed value
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedTime = timestamp - startTimeRef.current;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const newCount = Math.round(startValueRef.current + (endValue - startValueRef.current) * easedProgress);
      
      setCount(newCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration]);

  return count;
};