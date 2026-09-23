import { useEffect, useMemo } from 'react';
import { ECOSYSTEM_AREAS, MAX_SATELLITES, CANVAS, CANVAS_H, BUBBLE, seatPosition } from '../data/ecosystemAreas.js';

// Wrapper reserves the post-scale box (overflow hidden) while the inner
// canvas keeps its real 560x520 coordinate space and is scaled down visually
// — same technique EcosystemBubbles.jsx uses so bubble math stays correct.
const SCALE = 0.62;

// Controlled: selection state lives in the parent (EcosystemScreen) so a
// "Show all" affordance elsewhere on the page can clear it.
export default function EcosystemOrbit({ products = [], selectedKey = null, onSelectKey, onSelect, onExploreArea }) {
  // NOTE: expects each product to already carry an `areaKey` (computed by
  // the real resolveEcosystemProductArea, once real data is wired in) —
  // this component intentionally does not resolve areas itself.
  const { seats } = useMemo(() => {
    const byArea = new Map();
    products.forEach((p) => {
      const key = p.areaKey || 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(p);
    });

    const filled = ECOSYSTEM_AREAS.filter((a) => byArea.has(a.key)).map((a) => ({
      ...a,
      products: byArea.get(a.key),
      gap: false,
    }));

    if (byArea.has('other')) {
      filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false });
    }

    const filledCapped = filled.slice(0, MAX_SATELLITES);
    const addMoreSeat = { key: '__add-more__', label: 'Add More', products: [], gap: true };
    const seats = filledCapped.length < MAX_SATELLITES ? [...filledCapped, addMoreSeat] : filledCapped;

    return { seats, covered: filled.length };
  }, [products]);

  // No default selection — every node starts in its plain/white resting
  // state until the person actually taps one, matching the design.
  const selected = seats.find((s) => s.key === selectedKey) || null;

  useEffect(() => {
    if (onSelect) onSelect(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.key]);

  return (
    <div
      style={{
        width: CANVAS * SCALE,
        height: CANVAS_H * SCALE,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: CANVAS, height: CANVAS_H, transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 280 - 178,
            top: 260 - 178,
            width: 178 * 2,
            height: 178 * 2,
            borderRadius: '50%',
            border: '1px dashed rgba(255,249,242,.32)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 280 - 118,
            top: 260 - 118,
            width: 118 * 2,
            height: 118 * 2,
            borderRadius: '50%',
            border: '1px solid rgba(255,249,242,.22)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 280 - 50,
            top: 260 - 50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            // Same orange orb + italic "you" as the landing page (OrbHero).
            background: 'radial-gradient(circle at 34% 28%,#FFDCA8,#FFC774 46%,#E8843C)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3A2547',
            boxShadow: '0 20px 44px -12px rgba(255,150,60,.7), 0 0 0 14px rgba(255,199,116,.16)',
          }}
        >
          <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'calc(24px * var(--ayna-text-scale, 1))' }}>you</div>
        </div>

        {seats.map((seat, i) => {
          const pos = seatPosition(i, seats.length);
          const isSelected = selected && seat.key === selected.key;
          return (
            <button
              key={seat.key}
              type="button"
              onClick={() => (seat.gap ? onExploreArea && onExploreArea() : onSelectKey && onSelectKey(isSelected ? null : seat.key))}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: BUBBLE,
                height: BUBBLE,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                boxSizing: 'border-box',
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                textAlign: 'center',
                color: seat.gap ? '#FFF9F2' : '#1A1714',
                background: seat.gap ? 'rgba(255,249,242,.06)' : isSelected ? '#FFC774' : '#FFFFFF',
                borderWidth: 1.5,
                borderStyle: seat.gap ? 'dashed' : 'solid',
                borderColor: seat.gap ? 'rgba(255,249,242,.5)' : isSelected ? '#E8A94F' : 'rgba(255,255,255,.9)',
                boxShadow: isSelected ? '0 12px 24px rgba(232,169,79,.5)' : seat.gap ? 'none' : '0 8px 20px -6px rgba(20,12,40,.35)',
                transform: isSelected ? 'scale(1.06)' : 'none',
                transition: 'transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.15 }}>{seat.gap ? '+ Add' : seat.label}</span>
              {!seat.gap && (
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', color: '#78716C', marginTop: 2 }}>
                  {seat.products.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
