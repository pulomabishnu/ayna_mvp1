import { useRef } from 'react';

// A drill-in screen (product, article, why-this-match, about) pushed over the
// list it came from (anti-vibe guide, moment 7): it slides in from the right
// in 320ms, and a swipe from the left edge drags it back the way iOS does.
// Let go past a third of the width, or flick, and it goes back; otherwise it
// settles into place. The list underneath never unmounts, so its scroll
// position and search are kept.
const EDGE = 28;

export default function PushLayer({ zIndex = 40, onBack, children, className = '' }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const onTouchStart = (event) => {
    if (event.touches.length !== 1 || !onBack) return;
    const t = event.touches[0];
    if (t.clientX > EDGE) return;
    drag.current = { x: t.clientX, y: t.clientY, t: performance.now(), dx: 0, horizontal: null };
  };
  const onTouchMove = (event) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    const t = event.touches[0];
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (d.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) d.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!d.horizontal) return;
    d.dx = Math.max(0, dx);
    el.classList.remove('ay-push-in', 'ay-push-settle');
    el.classList.add('ay-push-dragging');
    el.style.transform = `translateX(${d.dx}px)`;
  };
  const onTouchEnd = () => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el || !d.horizontal) return;
    el.classList.remove('ay-push-dragging');
    el.classList.add('ay-push-settle');
    const v = d.dx / Math.max(1, performance.now() - d.t);
    if (d.dx > el.offsetWidth / 3 || v > 0.5) {
      el.style.transform = 'translateX(100%)';
      window.setTimeout(() => onBack?.(), 220);
    } else {
      el.style.transform = '';
    }
  };

  return (
    <div
      ref={ref}
      className={`ayna-fresh-detail-overlay ay-push-in ${className}`}
      style={{ position: 'fixed', inset: 0, zIndex, background: 'var(--ayna-surface)', display: 'flex' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
    </div>
  );
}
