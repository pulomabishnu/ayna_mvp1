import { useRef } from 'react';

// Left-edge swipe back for screens that aren't a PushLayer (the You stack:
// Settings, Legal, Health data…). Same feel as PushLayer: the page follows the
// finger from the left 28px, and letting go past a third of the width (or a
// flick) goes back; otherwise it settles. Returns touch handlers to spread on
// the page element, or {} when there's nowhere to go back to.
const EDGE = 28;

export function useEdgeSwipeBack(onBack, enabled = true) {
  const drag = useRef(null);
  if (!enabled || !onBack) return {};
  const el = (event) => event.currentTarget;
  return {
    onTouchStart: (event) => {
      if (event.touches.length !== 1) return;
      const t = event.touches[0];
      if (t.clientX > EDGE) return;
      drag.current = { x: t.clientX, y: t.clientY, t: performance.now(), dx: 0, horizontal: null };
    },
    onTouchMove: (event) => {
      const d = drag.current;
      if (!d) return;
      const t = event.touches[0];
      const dx = t.clientX - d.x;
      const dy = t.clientY - d.y;
      if (d.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.horizontal) return;
      d.dx = Math.max(0, dx);
      const node = el(event);
      node.style.transition = 'none';
      node.style.transform = `translateX(${d.dx}px)`;
    },
    onTouchEnd: (event) => {
      const d = drag.current;
      drag.current = null;
      if (!d || !d.horizontal) return;
      const node = el(event);
      node.style.transition = 'transform var(--t-fast, 160ms) var(--ease-out, ease-out)';
      const v = d.dx / Math.max(1, performance.now() - d.t);
      if (d.dx > node.offsetWidth / 3 || v > 0.5) {
        node.style.transform = 'translateX(100%)';
        window.setTimeout(() => onBack(), 170);
      } else {
        node.style.transform = '';
      }
    },
  };
}
