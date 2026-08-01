import { useEffect, useRef } from 'react';

export function useScrollToBottom<T extends unknown[]>(dependency: T) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    // Scroll only when messages are added (avoid scrolling on initial load)
    if (dependency.length > prevLengthRef.current && dependency.length > 0) {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    prevLengthRef.current = dependency.length;
  }, [dependency]);

  return containerRef;
}
