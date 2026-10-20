import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_PX = 50;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Full-screen product photo viewer (focus group, Oct 19: people wanted to
 * zoom into labels and ingredient panels). Pinch or double-tap to zoom,
 * drag to pan while zoomed, swipe left/right between photos. Esc closes and
 * focus stays inside the dialog until it does, then returns to the opener.
 * White sits only behind the photo itself.
 */
export default function ImageZoomViewer({ images = [], startIndex = 0, name = '', onClose }) {
  const [index, setIndex] = useState(clamp(startIndex, 0, Math.max(images.length - 1, 0)));
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [swipeX, setSwipeX] = useState(0);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const lastPointerType = useRef('mouse');
  const [dragging, setDragging] = useState(false);
  const viewRef = useRef(view);
  useLayoutEffect(() => { viewRef.current = view; }, [view]);

  const count = images.length;
  const go = useCallback((delta) => {
    if (count < 2) return;
    setIndex((i) => (i + delta + count) % count);
    setView({ scale: 1, x: 0, y: 0 });
  }, [count]);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose?.(); return; }
      if (event.key === 'ArrowRight') { go(1); return; }
      if (event.key === 'ArrowLeft') { go(-1); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [onClose, go]);

  // Keeps a zoomed photo from being dragged fully off screen.
  const bound = (scale, x, y) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || scale <= 1) return { scale: 1, x: 0, y: 0 };
    const maxX = (rect.width * (scale - 1)) / 2;
    const maxY = (rect.height * (scale - 1)) / 2;
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const zoomAt = (clientX, clientY, nextScale) => {
    const rect = stageRef.current?.getBoundingClientRect();
    const v = viewRef.current;
    if (!rect) return;
    const cx = clientX - (rect.left + rect.width / 2);
    const cy = clientY - (rect.top + rect.height / 2);
    // Keep the point under the finger in place while scaling.
    const ratio = nextScale / v.scale;
    setView(bound(nextScale, cx - (cx - v.x) * ratio, cy - (cy - v.y) * ratio));
  };

  const onPointerDown = (event) => {
    lastPointerType.current = event.pointerType;
    stageRef.current?.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);
    const pts = [...pointers.current.values()];
    const v = viewRef.current;
    if (pts.length === 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      gesture.current = { kind: 'pinch', dist, scale: v.scale, x: v.x, y: v.y, mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } };
      setSwipeX(0);
    } else if (pts.length === 1) {
      gesture.current = { kind: v.scale > 1 ? 'pan' : 'swipe', startX: event.clientX, startY: event.clientY, x: v.x, y: v.y, moved: false };
    }
  };

  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.kind === 'pinch' && pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const nextScale = clamp(g.scale * (dist / g.dist), 1, MAX_SCALE);
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = g.mid.x - (rect.left + rect.width / 2);
      const cy = g.mid.y - (rect.top + rect.height / 2);
      const ratio = nextScale / g.scale;
      setView(bound(nextScale, cx - (cx - g.x) * ratio, cy - (cy - g.y) * ratio));
      return;
    }
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
    if (g.kind === 'pan') setView((v) => bound(v.scale, g.x + dx, g.y + dy));
    else if (g.kind === 'swipe' && count > 1) setSwipeX(dx);
  };

  const onPointerUp = (event) => {
    const g = gesture.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setDragging(false);
    if (!g) return;
    if (g.kind === 'pinch') {
      if (pointers.current.size === 0) gesture.current = null;
      else {
        const [rest] = [...pointers.current.values()];
        const v = viewRef.current;
        gesture.current = { kind: v.scale > 1 ? 'pan' : 'swipe', startX: rest.x, startY: rest.y, x: v.x, y: v.y, moved: true };
      }
      return;
    }
    gesture.current = null;
    const dx = event.clientX - g.startX;
    if (g.kind === 'swipe') {
      setSwipeX(0);
      if (Math.abs(dx) > SWIPE_PX) { go(dx < 0 ? 1 : -1); return; }
    }
    // Touch and pen double taps here; a mouse double click uses onDoubleClick.
    if (!g.moved && event.type === 'pointerup' && event.pointerType !== 'mouse') {
      const now = Date.now();
      const prev = lastTap.current;
      if (now - prev.t < 320 && Math.hypot(prev.x - event.clientX, prev.y - event.clientY) < 30) {
        lastTap.current = { t: 0, x: 0, y: 0 };
        if (viewRef.current.scale > 1) setView({ scale: 1, x: 0, y: 0 });
        else zoomAt(event.clientX, event.clientY, DOUBLE_TAP_SCALE);
      } else {
        lastTap.current = { t: now, x: event.clientX, y: event.clientY };
      }
    }
  };

  const zoomed = view.scale > 1.01;
  const src = images[index];
  const label = name ? `${name} photos` : 'Product photos';

  return (
    <div ref={dialogRef} className="ay-zoom" role="dialog" aria-modal="true" aria-label={label}>
      <div className="ay-zoom-bar">
        <span className="ay-zoom-count" aria-live="polite">{count > 1 ? `Photo ${index + 1} of ${count}` : 'Photo'}</span>
        <button
          type="button"
          className="ay-zoom-btn"
          aria-pressed={zoomed}
          onClick={() => {
            const rect = stageRef.current?.getBoundingClientRect();
            if (zoomed) setView({ scale: 1, x: 0, y: 0 });
            else if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, DOUBLE_TAP_SCALE);
          }}
        >
          {zoomed ? 'Zoom out' : 'Zoom in'}
        </button>
        <button ref={closeRef} type="button" className="ay-zoom-btn ay-zoom-close" aria-label="Close photo viewer" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div
        ref={stageRef}
        className="ay-zoom-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          // Mouse only: touch double taps are handled in onPointerUp.
          if (lastPointerType.current !== 'mouse') return;
          if (viewRef.current.scale > 1) setView({ scale: 1, x: 0, y: 0 });
          else zoomAt(event.clientX, event.clientY, DOUBLE_TAP_SCALE);
        }}
      >
        {src && (
          <img
            key={src}
            src={src}
            alt={count > 1 ? `${name}, photo ${index + 1} of ${count}` : name}
            draggable={false}
            style={{ transform: `translate3d(${view.x + swipeX}px, ${view.y}px, 0) scale(${view.scale})`, transition: dragging ? 'none' : 'transform .2s ease-out' }}
          />
        )}
      </div>
      <div className="ay-zoom-foot">
        {count > 1 ? (
          <>
            <button type="button" className="ay-zoom-btn" aria-label="Previous photo" onClick={() => go(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <span className="ay-zoom-hint">Pinch or double tap to zoom. Swipe for more photos.</span>
            <button type="button" className="ay-zoom-btn" aria-label="Next photo" onClick={() => go(1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        ) : <span className="ay-zoom-hint">Pinch or double tap to zoom.</span>}
      </div>
    </div>
  );
}
