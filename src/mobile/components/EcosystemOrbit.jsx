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
    const filled = ECOSYSTEM_AREAS.filter((a) => byArea.has(a.key)).map((a) => ({ ...a, products: byArea.get(a.key), gap: false }));
    if (byArea.has('other')) filled.push({ key: 'other', label: 'Other', products: byArea.get('other'), gap: false });
    const filledCapped = filled.slice(0, MAX_SATELLITES);
    const seats = filledCapped.length < MAX_SATELLITES ? [...filledCapped, { key: '__add-more__', label: 'Add', products: [], gap: true }] : filledCapped;
    return { seats };
  }, [products]);

  const selected = seats.find((s) => s.key === selectedKey) || null;
  useEffect(() => { onSelect?.(selected); }, [selected?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: CANVAS * SCALE, height: CANVAS_H * SCALE, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: CANVAS, height: CANVAS_H, transform: `scale(${SCALE})`, transformOrigin: 'top left', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 102, top: 82, width: 356, height: 356, borderRadius: '50%', border: '1px solid rgba(255,255,255,.16)' }} />
        <div style={{ position: 'absolute', left: 162, top: 142, width: 236, height: 236, borderRadius: '50%', border: '1px dashed rgba(255,255,255,.13)' }} />
        <div style={{ position: 'absolute', left: 230, top: 210, width: 100, height: 100, borderRadius: '50%', background: '#FFFCF9', color: '#241C3E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(0,0,0,.16)' }}>
          <div style={{ fontWeight: 800, fontSize: 'calc(17px * var(--ayna-text-scale, 1))' }}>{name}</div>
        </div>

        {seats.map((seat, i) => {
          const pos = seatPosition(i, seats.length);
          const isSelected = selected && seat.key === selected.key;
          return (
            <button key={seat.key} type="button" onClick={() => (seat.gap ? onExploreArea?.() : onSelectKey?.(isSelected ? null : seat.key))} style={{ position: 'absolute', left: pos.left, top: pos.top, width: BUBBLE, height: BUBBLE, borderRadius: '50%', border: isSelected ? '1.5px solid #FFFCF9' : '1px solid rgba(255,255,255,.38)', background: seat.gap ? 'rgba(255,255,255,.06)' : isSelected ? '#FFFCF9' : 'rgba(255,255,255,.12)', color: isSelected ? '#241C3E' : '#FFFCF9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, fontFamily: 'Inter, sans-serif', textAlign: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: isSelected ? '0 8px 20px rgba(0,0,0,.16)' : 'none', transform: isSelected ? 'scale(1.05)' : 'none', transition: 'all .18s ease' }}>
              <span style={{ fontWeight: 750, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.1 }}>{seat.gap ? '+ Add' : seat.label}</span>
              {!seat.gap && <span style={{ fontSize: 'calc(9px * var(--ayna-text-scale, 1))', opacity: .68, marginTop: 3 }}>{seat.products.length}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
