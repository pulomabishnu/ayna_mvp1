import { useEffect, useRef, useState } from 'react';

const POSITION_KEY = 'ayna_ask_chip_pos_v1';
const CHIP_WIDTH = 118; // approx rendered width when expanded, used only for clamping to the viewport
const CHIP_COMPACT_WIDTH = 44; // approx rendered width when scrolled-compact (icon only) — a
// separate value from CHIP_WIDTH so clamping/docking don't reserve room for
// the "Ask Ayna" label when it isn't actually showing.
const CHIP_HEIGHT = 42;
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a tap
const EDGE_MARGIN = 8;

function defaultPosition() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 812;
  return { x: vw - CHIP_WIDTH - 20, y: vh - CHIP_HEIGHT - 96 };
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
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), vw - width - EDGE_MARGIN),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), vh - CHIP_HEIGHT - EDGE_MARGIN),
  };
}

function nearestEdgeX(x, width) {
  const vw = window.innerWidth;
  const center = x + width / 2;
  return center < vw / 2 ? EDGE_MARGIN : vw - CHIP_COMPACT_WIDTH - EDGE_MARGIN;
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
  const [pos, setPos] = useState(loadPosition);
  const [compact, setCompact] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dockedX, setDockedX] = useState(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  useEffect(() => {
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
    setDockedX(compact ? nearestEdgeX(pos.x, CHIP_WIDTH) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  useEffect(() => {
    // A new screen always starts scrolled to the top — undock/un-compact
    // immediately rather than waiting for a scroll event on it (which may
    // never come if the new screen's content is short).
    setCompact(false);
  }, [viewKey]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
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
    onClick?.();
  };

  const renderX = dockedX !== null ? dockedX : pos.x;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: renderX,
        top: pos.y,
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 8,
        padding: compact ? '9px' : '9px 14px 9px 9px',
        background: '#1C1917',
        borderRadius: 999,
        boxShadow: '0 12px 26px -10px rgba(0,0,0,.4)',
        cursor: 'grab',
        zIndex: 45,
        touchAction: 'none',
        userSelect: 'none',
        transition: dragging ? 'none' : 'left .28s cubic-bezier(.4,0,.2,1), padding .22s ease, gap .22s ease',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#242A52,#4E3866 55%,#A2603C)',
          animation: 'ay-float 3s ease-in-out infinite',
          flex: 'none',
        }}
      />
      <span
        style={{
          color: '#FFFFFF',
          fontSize: 'calc(12px * var(--ayna-text-scale, 1))',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: compact ? 0 : 100,
          opacity: compact ? 0 : 1,
          transition: 'max-width .22s ease, opacity .15s ease',
        }}
      >
        Ask Ayna
      </span>
    </div>
  );
}
