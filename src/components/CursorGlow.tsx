import { useEffect, useRef } from 'react';

/** Селекторы кликабельных элементов — над ними стрелка слегка увеличивается. */
const INTERACTIVE =
  'button, a, [role="button"], .vn-root, .vn-menu-item, .vn-choice-btn, .vn-order-item, .vn-order-submit, .vn-start-btn, .vn-answer-btn';

const STAR_CHARS = ['✦', '✧', '⋆', '✫', '✯'];

/** Вспышка курсора при ответе в квизе (зелёный/красный). */
export function flashCursor(kind: 'correct' | 'wrong') {
  window.dispatchEvent(new CustomEvent('vn-cursor-flash', { detail: kind }));
}

/**
 * Волшебный золотой курсор-стрелка со шлейфом из звёздочек.
 * Меняет цвет на зелёный/красный при правильном/неправильном ответе.
 * Активен только для мыши (hover + pointer: fine).
 */
export function CursorGlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.body.classList.add('vn-has-cursor');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let lastX = mx;
    let lastY = my;
    let starIndex = 0;
    let shown = false;
    let flashTimer = 0;

    const show = () => {
      if (shown) return;
      shown = true;
      rootRef.current?.classList.remove('vn-cursor-off');
    };

    const spawnStar = (x: number, y: number) => {
      const stars = starsRef.current;
      if (!stars) return;
      const el = document.createElement('span');
      el.className = 'vn-star';
      el.textContent = STAR_CHARS[starIndex++ % STAR_CHARS.length];
      el.style.left = `${x + (Math.random() * 20 - 10)}px`;
      el.style.top = `${y + (Math.random() * 20 - 10)}px`;
      el.style.setProperty('--dx', `${Math.random() * 50 - 25}px`);
      el.style.setProperty('--dy', `${Math.random() * 34 + 14}px`);
      el.style.setProperty('--rot', `${Math.random() * 180 - 90}deg`);
      el.style.setProperty('--s', `${Math.random() * 0.8 + 0.9}`);
      el.addEventListener('animationend', () => el.remove());
      stars.appendChild(el);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (arrowRef.current) arrowRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      show();
      const dx = mx - lastX;
      const dy = my - lastY;
      if (dx * dx + dy * dy > 26) {
        spawnStar(mx, my);
        if (Math.random() < 0.5) spawnStar(mx, my);
        lastX = mx;
        lastY = my;
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      arrowRef.current?.classList.toggle('is-hover', Boolean(target?.closest?.(INTERACTIVE)));
    };
    const onDown = () => arrowRef.current?.classList.add('is-down');
    const onUp = () => arrowRef.current?.classList.remove('is-down');
    const onLeave = () => {
      shown = false;
      rootRef.current?.classList.add('vn-cursor-off');
    };
    const onFlash = (e: Event) => {
      const kind = (e as CustomEvent<'correct' | 'wrong'>).detail;
      const root = rootRef.current;
      if (!root) return;
      root.classList.remove('is-correct', 'is-wrong');
      root.classList.add(kind === 'correct' ? 'is-correct' : 'is-wrong');
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => root.classList.remove('is-correct', 'is-wrong'), 850);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('vn-cursor-flash', onFlash);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('vn-cursor-flash', onFlash);
      window.clearTimeout(flashTimer);
      document.body.classList.remove('vn-has-cursor');
    };
  }, []);

  return (
    <div ref={rootRef} className="vn-cursor-root vn-cursor-off" aria-hidden>
      <div ref={starsRef} className="vn-stars" />
      <div ref={arrowRef} className="vn-arrow">
        <svg viewBox="0 0 18 24" width="17" height="22">
          <path
            d="M1 1 L1 19.5 L5.6 15 L8.7 21.8 L11.4 20.6 L8.3 13.9 L14.4 13.9 Z"
            fill="currentColor"
            stroke="rgb(80 50 0 / 55%)"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
