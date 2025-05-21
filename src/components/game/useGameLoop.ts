import { useEffect, useRef } from 'react';

export type GameLoop = {
  fps: number;
  deltaTime: number;
};

type UseGameLoopProps = {
  enabled?: boolean;
  updateFn: (gameLoop: GameLoop) => void;
  targetFps?: number;
};

export const useGameLoop = ({
  enabled = true,
  updateFn,
  targetFps = 60,
}: UseGameLoopProps) => {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const fpsRef = useRef<number>(targetFps);

  const animate = (time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = (time - previousTimeRef.current) / 1000;
      const currentFps = 1 / deltaTime;
      fpsRef.current = currentFps;
      updateFn({ deltaTime, fps: currentFps });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled]);

  return {
    fps: fpsRef.current,
  };
}; 