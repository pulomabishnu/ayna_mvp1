import { useEffect, useRef, useState } from 'react';

const POSITION_KEY = 'ayna_ask_chip_pos_v1';
const CHIP_WIDTH = 118; // approx rendered width, used only for clamping to the viewport
const CHIP_HEIGHT = 42;
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a tap

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

function clamp(pos) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(Math.max(pos.x, 8), vw - CHIP_WIDTH - 8),
    y: Math.min(Math.max(pos.y, 8), vh - CHIP_HEIGHT - 8),
  };
}

/**
 * Draggable launcher — press-and-drag repositions it anywhere on screen; a
 * plain tap (movement under DRAG_THRESHOLD) still opens Ask Ayna. Position
 * persists across screens and reloads via localStorage.
 */
export default function AskAynaChip({ onClick }) {
  const [pos, setPos] = useState(loadPosition);
  const [compact, setCompact] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
  };

  const handlePointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) d.moved = true;
    setPos(clamp({ x: d.originX + dx, y: d.originY + dy }));
  };

  const endDrag = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
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

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: pos.x,
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
        transition: 'padding .22s ease, gap .22s ease',
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
          fontSize: 12,
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
