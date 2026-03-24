import { useEffect, useRef } from 'react';
import { PresenterTimeController } from '../services/presenter-time-controller';

const MAX_MINUTE = 572;
const TICK_INTERVAL_MS = 1000;

interface UsePresenterAutoPlayProps {
  isRunning: boolean;
  currentMinute: number;
  controller: PresenterTimeController | null;
  speed: 1 | 2 | 4 | 8;
}

export function usePresenterAutoPlay({
  isRunning,
  currentMinute,
  controller,
  speed
}: UsePresenterAutoPlayProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMinuteRef = useRef<number>(currentMinute);

  useEffect(() => {
    lastMinuteRef.current = currentMinute;
  }, [currentMinute]);

  useEffect(() => {
    if (!controller) return;

    if (isRunning) {
      timerRef.current = setInterval(async () => {
        const newMinute = Math.floor(Math.min(lastMinuteRef.current + speed, MAX_MINUTE));

        if (newMinute >= MAX_MINUTE) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          await controller.pause();
          await controller.setMinute(MAX_MINUTE);
          return;
        }

        await controller.setMinute(newMinute);
      }, TICK_INTERVAL_MS);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, controller, speed]);
}
