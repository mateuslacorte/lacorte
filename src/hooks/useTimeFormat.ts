import { useMemo } from 'react';

export function useTimeFormat() {
  const formatTime = useMemo(() => {
    return (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
  }, []);

  return { formatTime };
}
