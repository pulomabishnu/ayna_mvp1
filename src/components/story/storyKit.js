import { useRef, useState } from 'react';

/* Story helpers (theme, gestures) shared by the Rundown and ayna Wrapped. Markup: StoryShell.jsx. */

/** The page's theme, so a story portalled to <body> still knows light from dark. */
export function storyTheme() {
  if (typeof document === 'undefined') return 'light';
  const t = document.querySelector('.ayna-mobile')?.getAttribute('data-theme') || document.querySelector('.app-container')?.getAttribute('data-theme') || '';
  return /dark/.test(t) ? 'dark' : 'light';
}

const CONTROL = 'button, a, input, select, textarea, summary, details, label, [role="group"], .ay-pcard, [data-pid]';
export const isControl = (el) => Boolean(el?.closest?.(CONTROL));

/**
 * Tap left (first 30%) for back, anywhere else for next; hold to pause;
 * swipe sideways to move, swipe down to close. Taps on controls are theirs.
 */
export function useStoryGestures({ onPrev, onNext, onClose }) {
  const [held, setHeld] = useState(false);
  const start = useRef(null);
  const timer = useRef(null);
  const swallow = useRef(false);
  const end = (e, cancel = false) => {
    window.clearTimeout(timer.current);
    const s = start.current; start.current = null;
    if (!s) return;
    const wasHeld = held;
    if (wasHeld) setHeld(false);
    if (cancel) return;
    const dx = e.clientX - s.x; const dy = e.clientY - s.y;
    if (dy > 90 && dy > Math.abs(dx) * 1.2) { swallow.current = true; onClose?.(); return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swallow.current = true; (dx < 0 ? onNext : onPrev)?.(); return; }
    if (wasHeld || Date.now() - s.t > 450) swallow.current = true;
  };
  const bind = {
    onPointerDown: (e) => {
      if (isControl(e.target) || (e.button != null && e.button !== 0)) return;
      start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      swallow.current = false;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHeld(true), 260);
    },
    onPointerUp: (e) => end(e),
    onPointerCancel: (e) => end(e, true),
    onClick: (e) => {
      if (swallow.current) { swallow.current = false; return; }
      if (isControl(e.target)) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX - r.left < r.width * 0.3) onPrev?.(); else onNext?.();
    },
  };
  return { held, bind };
}
