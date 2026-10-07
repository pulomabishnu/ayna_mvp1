import { useEffect, useMemo } from 'react';
import { ECOSYSTEM_AREAS, MAX_SATELLITES, CANVAS, CANVAS_H, BUBBLE, seatPosition } from '../data/ecosystemAreas.js';

const SCALE = 0.62;

export default function EcosystemOrbit({ products = [], name = 'You', selectedKey = null, onSelectKey, onSelect, onExploreArea }) {
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

    if (byArea.has('other')) filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false });

    const filledCapped = filled.slice(0, MAX_SATELLITES);
    const addMoreSeat = { key: '__add-more__', label: 'Add More', products: [], gap: true };
    const seats = filledCapped.length < MAX_SATELLITES ? [...filledCapped, addMoreSeat] : filledCapped;

    return { seats };
  }, [products]);

  const selected = seats.find((s) => s.key === selectedKey) || null;

  useEffect(() => {
    if (onSelect) onSelect(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.key]);

  return (
    <div style={{ width: CANVAS * SCALE, height: CANVAS_H * SCALE, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: CANVAS, height: CANVAS_H, transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 280 - 178, top: 260 - 178, width: 356, height: 356,
          borderRadius: '50%', border: '1px dashed rgba(77,58,99,.24)'
        }} />
        <div style={{
          position: 'absolute', left: 280 - 118, top: 260 - 118, width: 236, height: 236,
          borderRadius: '50%', border: '1px solid rgba(77,58,99,.14)'
        }} />

        <div style={{
          position: 'absolute', left: 230, top: 210, width: 100, height: 100, borderRadius: '50%',
          background: 'linear-gradient(145deg,#241C3E 0%,#4D3A63 48%,#A9647A 78%,#D98A52 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFCF9',
          boxShadow: '0 10px 24px rgba(36,28,62,.22)'
        }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(18px * var(--ayna-text-scale, 1))' }}>{name}</div>
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
                position: 'absolute', left: pos.left, top: pos.top, width: BUBBLE, height: BUBBLE,
                borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 8, boxSizing: 'border-box', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center',
                color: isSelected ? '#FFFCF9' : '#292524',
                background: seat.gap ? '#FFFCF9' : isSelected ? '#4D3A63' : '#FFFFFF',
                borderWidth: 1.25, borderStyle: seat.gap ? 'dashed' : 'solid',
                borderColor: seat.gap ? 'rgba(77,58,99,.28)' : isSelected ? '#4D3A63' : '#E7E0DB',
                boxShadow: isSelected ? '0 8px 18px rgba(36,28,62,.18)' : '0 2px 8px rgba(41,37,36,.05)',
                transform: isSelected ? 'scale(1.035)' : 'none',
                transition: 'transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.15 }}>{seat.gap ? '+ Add' : seat.label}</span>
              {!seat.gap && (
                <span style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))',
                  color: isSelected ? 'rgba(255,252,249,.72)' : '#78716C', marginTop: 2
                }}>
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
