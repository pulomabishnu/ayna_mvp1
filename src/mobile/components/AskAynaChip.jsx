import { useEffect, useRef, useState } from 'react';
import { ASK_AYNA_CHIP_POSITION_KEY as POSITION_KEY } from '../utils/askAynaChipPosition.js';

const CHIP_WIDTH = 148; // includes the label and manual dock control
const CHIP_COMPACT_WIDTH = 42;
const DOCK_HANDLE_WIDTH = 20;
const CHIP_HEIGHT = 42;
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a tap
const EDGE_MARGIN = 8;

function screenBounds() {
  const root = document.querySelector('.ayna-mobile');
  const rect = root?.getBoundingClientRect();
  return rect && rect.width ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
}

function defaultPosition() {
  // `|| 390`/`|| 812` rather than just checking `typeof window` — guards
  // against innerWidth/innerHeight themselves reading 0 at a very early
  // render (before layout has run), not just `window` being undefined.
  const bounds = typeof document !== 'undefined' ? screenBounds() : { right: 390, bottom: 812 };
  return { x: bounds.right - CHIP_WIDTH - 20, y: bounds.bottom - CHIP_HEIGHT - 96 };
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
  } catch {
    /* private mode / corrupt value */
  }
  return defaultPosition();
}

function clamp(pos, width) {
  const bounds = screenBounds();
  return {
    x: Math.min(Math.max(pos.x, bounds.left + EDGE_MARGIN), bounds.right - width - EDGE_MARGIN),
    y: Math.min(Math.max(pos.y, bounds.top + 76), bounds.bottom - CHIP_HEIGHT - 80),
  };
}

function nearestEdgeX(x, width) {
  const bounds = screenBounds();
  const center = x + width / 2;
  return center < (bounds.left + bounds.right) / 2 ? bounds.left - (CHIP_COMPACT_WIDTH - DOCK_HANDLE_WIDTH) : bounds.right - DOCK_HANDLE_WIDTH;
}

/**
 * Draggable launcher — press-and-drag repositions it anywhere on screen; a
 * plain tap (movement under DRAG_THRESHOLD) still opens Ask Ayna. Position
 * persists across screens and reloads via localStorage.
 *
 * Scrolling down docks it to whichever screen edge (left/right) it's
 * currently nearer to and shrinks it to an icon — like iOS's AssistiveTouch
 * bubble — so it stays out of the way of content instead of just shrinking
 * in place. The dock target is computed once, at the moment scrolling
 * crosses the threshold (not continuously), so it doesn't chase the free
 * position around; scrolling back near the top returns it there, and
 * grabbing it at any point immediately releases the dock so it tracks the
 * finger exactly, with no jump.
 *
 * `viewKey` identifies whatever screen/overlay is currently showing (see
 * MobileApp.jsx). This component is mounted once and never unmounts as the
 * app navigates, so without this its `compact`/docked state — set from a
 * scroll event on whatever was on screen before — would carry over
 * unchanged onto a brand-new screen that hasn't been scrolled at all,
 * making the chip look like it "jumps around" between screens (docked and
 * icon-only on one, expanded and free on the next, with no scrolling in
 * between to explain why). A fresh screen always starts scrolled to the
 * top, so `viewKey` changing resets it to match.
 */
export default function AskAynaChip({ onClick, viewKey }) {
  const [pos, setPos] = useState(() => {
    const saved = loadPosition();
    const bounds = screenBounds();
    return clamp(saved.y < bounds.top + 76 ? defaultPosition() : saved, CHIP_WIDTH);
  });
  const [compact, setCompact] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dockedX, setDockedX] = useState(null);
  const [manualDock, setManualDock] = useState(true);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  useEffect(() => {
    setPos((p) => clamp(p.y < screenBounds().top + 76 ? defaultPosition() : p, CHIP_WIDTH));
    const onResize = () => {
      setPos((p) => clamp(p, compact ? CHIP_COMPACT_WIDTH : CHIP_WIDTH));
      setDockedX((d) => (d === null ? d : nearestEdgeX(pos.x, CHIP_WIDTH)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  useEffect(() => {
    // Every screen scrolls its own inner container rather than the window,
    // so a plain window 'scroll' listener would never fire — a capturing
    // listener on document catches scroll events from any of them (scroll
    // doesn't bubble, but it is dispatched during the capture phase).
    const onScroll = (e) => {
      const top = e.target?.scrollTop ?? 0;
      setCompact(top > 24);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  useEffect(() => {
    // Compute the dock target only at the instant compact turns on/off —
    // deliberately not reacting to `pos` here, so it anchors once rather
    // than following the free position around while docked.
    setDockedX(compact || manualDock ? nearestEdgeX(pos.x, CHIP_WIDTH) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, manualDock]);

  useEffect(() => {
    // A new screen always starts scrolled to the top — undock/un-compact
    // immediately rather than waiting for a scroll event on it (which may
    // never come if the new screen's content is short).
    setManualDock(true);
    setCompact(false);
  }, [viewKey]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (compact || manualDock) return;
    const visualX = dockedX !== null ? dockedX : pos.x;
    setDragging(true);
    drag.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, originX: visualX, originY: pos.y };
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      d.moved = true;
      setDockedX(null); // picking it up and actually moving it releases the dock immediately
    }
    if (d.moved) {
      setPos(clamp({ x: d.originX + dx, y: d.originY + dy }, compact ? CHIP_COMPACT_WIDTH : CHIP_WIDTH));
    }
  };

  const endDrag = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    setPos((p) => {
      try { localStorage.setItem(POSITION_KEY, JSON.stringify(p)); } catch { /* private mode */ }
      return p;
    });
  };

  const handleClick = () => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    if (compact || manualDock) { setManualDock(false); setCompact(false); setDockedX(null); return; }
    onClick?.();
  };

  const renderX = dockedX !== null ? dockedX : pos.x;
  const isCompact = compact || manualDock;
  const bounds = screenBounds();
  const dockLeft = pos.x + CHIP_WIDTH / 2 < (bounds.left + bounds.right) / 2;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={isCompact ? 'Slide Ask Ayna back onto the screen' : 'Open Ask Ayna'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleClick(); } }}
      style={{
        position: 'fixed',
        left: renderX,
        top: pos.y,
        display: 'flex',
        alignItems: 'center',
        gap: isCompact ? 0 : 8,
        width: isCompact ? CHIP_COMPACT_WIDTH : undefined,
        height: isCompact ? CHIP_HEIGHT : undefined,
        boxSizing: 'border-box',
        justifyContent: isCompact ? (dockLeft ? 'flex-end' : 'flex-start') : undefined,
        padding: isCompact ? 0 : '7px 10px',
        background: '#1C1917',
        borderRadius: isCompact ? (dockLeft ? '0 12px 12px 0' : '12px 0 0 12px') : 999,
        clipPath: isCompact ? (dockLeft ? 'inset(0 0 0 22px)' : 'inset(0 22px 0 0)') : undefined,
        boxShadow: '0 12px 26px -10px rgba(0,0,0,.4)',
        cursor: 'grab',
        zIndex: 45,
        touchAction: 'none',
        userSelect: 'none',
        transition: dragging ? 'none' : 'left .28s cubic-bezier(.4,0,.2,1), padding .22s ease, gap .22s ease',
      }}
    >
      {!isCompact && <div
        style={{
          width: 26,
          height: 26,
          boxSizing: 'border-box',
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#1D1A2B,#1D1A2B 55%,#1D1A2B)',
          animation: 'ay-float 3s ease-in-out infinite',
          flex: 'none',
        }}
      />}
      {!isCompact && <span
        style={{
          color: '#FFFFFF',
          fontSize: 'calc(12px * var(--ayna-text-scale, 1))',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: isCompact ? 0 : 100,
          opacity: isCompact ? 0 : 1,
          transition: 'max-width .22s ease, opacity .15s ease',
        }}
      >
        Ask Ayna
      </span>}
      {!isCompact && <button type="button" aria-label="Move Ask Ayna to screen edge" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setManualDock(true); setCompact(true); }} style={{ border: 0, background: 'transparent', color: '#fff', padding: '0 1px', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>{dockLeft ? '‹' : '›'}</button>}
      {isCompact && <span aria-hidden="true" style={{ width: DOCK_HANDLE_WIDTH, textAlign: 'center', color: '#fff', fontSize: 17, lineHeight: 1 }}>{dockLeft ? '›' : '‹'}</span>}
    </div>
  );
}
