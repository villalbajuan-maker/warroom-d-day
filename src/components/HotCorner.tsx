import { useState, useRef, useEffect } from 'react';

interface HotCornerProps {
  onActivate: () => void;
  enabled: boolean;
}

const TRIPLE_CLICK_WINDOW = 600;

export default function HotCorner({ onActivate, enabled }: HotCornerProps) {
  const [clickCount, setClickCount] = useState(0);
  const lastClickTime = useRef(0);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!enabled) return;

    const target = document.activeElement;
    const isInputActive =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT' ||
      (target as HTMLElement)?.isContentEditable;

    if (isInputActive) return;

    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    if (timeSinceLastClick > TRIPLE_CLICK_WINDOW) {
      setClickCount(1);
    } else {
      setClickCount((prev) => prev + 1);
    }

    lastClickTime.current = now;

    if (clickCount + 1 >= 3) {
      setClickCount(0);
      lastClickTime.current = 0;
      onActivate();
    } else {
      resetTimer.current = window.setTimeout(() => {
        setClickCount(0);
        lastClickTime.current = 0;
      }, TRIPLE_CLICK_WINDOW);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="absolute"
      style={{
        width: '24px',
        height: '24px',
        top: 'calc(100%)',
        right: '0',
        cursor: 'default',
        userSelect: 'none',
        background: 'transparent',
        border: 'none',
        zIndex: 9999
      }}
      aria-hidden="true"
    />
  );
}
