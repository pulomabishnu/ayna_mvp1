import { useRef } from 'react';

// Bottom sheets follow the finger (anti-vibe guide, moment 6): drag the
// grabber (or the sheet's top edge) down and it moves with you; let go past
// a quarter of its height, or flick, and it closes. Otherwise it springs back.
// The grabber is also a real button: tapping it or pressing Enter closes.
export function useSheetDrag(onClose, externalRef = null) {
  const ownRef = useRef(null);
  const sheetRef = externalRef || ownRef;
  const drag = useRef(null);
  const justDragged = useRef(false);

  const close = () => {
    const el = sheetRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce) { onClose?.(); return; }
    el.style.transition = 'transform var(--t-sheet-out, 240ms) var(--ease-exit, ease-in)';
    el.style.transform = 'translateY(100%)';
    window.setTimeout(() => onClose?.(), 220);
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const el = sheetRef.current;
    if (!el) return;
    drag.current = { y: event.clientY, t: performance.now(), dy: 0, moved: false };
    el.style.transition = 'none';
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    const d = drag.current;
    const el = sheetRef.current;
    if (!d || !el) return;
    d.dy = Math.max(0, event.clientY - d.y);
    if (d.dy > 4) d.moved = true;
    el.style.transform = `translateY(${d.dy}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    const el = sheetRef.current;
    drag.current = null;
    if (!d || !el) return;
    justDragged.current = d.moved;
    const v = d.dy / Math.max(1, performance.now() - d.t);
    if (d.moved && (d.dy > el.offsetHeight * 0.25 || v > 0.6)) { close(); return; }
    el.style.transition = 'transform var(--t-base, 240ms) var(--ease-out, ease-out)';
    el.style.transform = '';
  };

  const grabberProps = {
    type: 'button',
    className: 'ay-sheet-grabber',
    'aria-label': 'Close',
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClick: () => { if (justDragged.current) { justDragged.current = false; return; } close(); },
  };
  return { sheetRef, grabberProps, close };
}
