import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SPEED_MS = 28;

export function useTypewriter(text: string, speedMs = DEFAULT_SPEED_MS) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    if (!text) {
      setDone(true);
      return;
    }

    let index = 0;
    timerRef.current = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));

      if (index >= text.length) {
        clearTimer();
        setDone(true);
      }
    }, speedMs);

    return clearTimer;
  }, [text, speedMs, clearTimer]);

  const finish = useCallback(() => {
    clearTimer();
    setDisplayed(text);
    setDone(true);
  }, [text, clearTimer]);

  return { displayed, done, finish };
}
