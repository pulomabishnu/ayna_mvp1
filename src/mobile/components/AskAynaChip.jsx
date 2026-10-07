import { useEffect, useRef, useState } from 'react';
import { ASK_AYNA_CHIP_POSITION_KEY as POSITION_KEY } from '../utils/askAynaChipPosition.js';

const CHIP_WIDTH = 148;
const CHIP_COMPACT_WIDTH = 60;
const CHIP_HEIGHT = 42;
const DRAG_THRESHOLD = 6;
const EDGE_MARGIN = 8;

function screenBounds() {
  const root = document.querySelector('.ayna-mobile');
  const rect = root?.getBoundingClientRect();
  return rect && rect.width ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
}

function defaultPosition() {
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
  return center < (bounds.left + bounds.right) / 2 ? bounds.left + EDGE_MARGIN : bounds.right - CHIP_COMPACT_WIDTH - EDGE_MARGIN;
}

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
    const onScroll = (e) => {
      const top = e.target?.scrollTop ?? 0;
      setCompact(top > 24);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  useEffect(() => {
    setDockedX(compact || manualDock ? nearestEdgeX(pos.x, CHIP_WIDTH) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, manualDock]);

  useEffect(() => {
    // Start every screen tucked against the edge. Expanding it is an explicit
    // user action, so the launcher never floats over content by default.
    setManualDock(true);
    setCompact(false);
  }, [viewKey]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (manualDock) return;
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
      setDockedX(null);
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
    if (manualDock) {
      setManualDock(false);
      setCompact(false);
      setDockedX(null);
      return;
    }
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
      aria-label={manualDock ? 'Expand Ask Ayna' : 'Open Ask Ayna'}
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
        minHeight: 44,
        padding: isCompact ? '8px' : '7px 10px',
        background: 'var(--ayna-navy)',
        border: '1px solid rgba(255,255,255,.16)',
        borderRadius: 12,
        boxShadow: '0 3px 10px rgba(36,42,82,.18)',
        cursor: 'grab',
        zIndex: 45,
        touchAction: 'none',
        userSelect: 'none',
        transition: dragging ? 'none' : 'left .2s ease, padding .2s ease, gap .2s ease',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          boxSizing: 'border-box',
          borderRadius: '50%',
          border: '2px solid #FFC774',
          position: 'relative',
          flex: 'none',
        }}
      >
        <span style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: '#FFC774', left: 8, top: 8 }} />
      </div>
      <span
        style={{
          color: '#FFFFFF',
          fontSize: 'calc(12px * var(--ayna-text-scale, 1))',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: isCompact ? 0 : 100,
          opacity: isCompact ? 0 : 1,
          transition: 'max-width .2s ease, opacity .15s ease',
        }}
      >
        Ask Ayna
      </span>
      {!isCompact && (
        <button
          type="button"
          aria-label="Move Ask Ayna to screen edge"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); setManualDock(true); setCompact(true); }}
          style={{ border: 0, background: 'transparent', color: '#fff', minWidth: 24, minHeight: 24, padding: 0, fontSize: 18, lineHeight: 1, cursor: 'pointer' }}
        >
          {dockLeft ? '‹' : '›'}
        </button>
      )}
      {manualDock && <span aria-hidden="true" style={{ color: '#fff', fontSize: 17, lineHeight: 1 }}>{dockLeft ? '›' : '‹'}</span>}
    </div>
  );
}
