import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export default function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setShouldAnimate(true);
      setPrevValue(value);

      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 320);

      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className={`${className} ${shouldAnimate ? 'animate-count-change' : ''}`}>
      {value}
    </div>
  );
}
