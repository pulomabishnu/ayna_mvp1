import { useMemo } from 'react';

// "Build your ecosystem" hero toy: tap a need and it lands in orbit around
// you with a real ayna product for it. Until someone taps, it quietly plays
// a demo so the page has one moving thing that explains the idea.

const ANGLES = [-28, 90, 208];
// The bottom slot sits a little closer in so its label stays on the disc.
const RADII = [29, 25, 29];

/** Chips: pick up to three needs. */
export function NeedPicker({ needs, slots, onToggle }) {
  return (
    <div className="lx-picker" role="group" aria-label="Pick what you care about">
      {needs.map((n) => {
        const on = slots.includes(n.id);
        return (
          <button key={n.id} type="button" className={`lx-pick tone-${n.tone}${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(n.id)}>
            <span className="lx-pick__dot" aria-hidden="true" />
            {n.label}
          </button>
        );
      })}
    </div>
  );
}

/** Orbit preview of the picked needs. */
export function EcoOrbit({ needs, slots, onOpenProduct }) {
  const byId = useMemo(() => Object.fromEntries(needs.map((n) => [n.id, n])), [needs]);
  const filled = slots.filter(Boolean).length;
  return (
    <div className="lx-orbit" aria-live="polite" aria-label={filled ? `Your ecosystem preview: ${slots.filter(Boolean).map((id) => byId[id]?.label).join(', ')}` : 'Your ecosystem preview'}>
      <div className="lx-orbit__disc" aria-hidden="true" />
      <div className="lx-orbit__ring is-outer" aria-hidden="true" />
      <div className="lx-orbit__ring is-inner" aria-hidden="true" />
      <div className="lx-orbit__spin">
        <svg className="lx-orbit__links" viewBox="-50 -50 100 100" aria-hidden="true">
          {ANGLES.map((a, i) => {
            const r = (a * Math.PI) / 180;
            return <line key={`${i}-${slots[i] || 'x'}`} className={slots[i] ? 'is-on' : ''} x1="0" y1="0" x2={(Math.cos(r) * RADII[i]).toFixed(2)} y2={(Math.sin(r) * RADII[i]).toFixed(2)} pathLength="1" />;
          })}
        </svg>
        <span className="lx-orbit__moon is-a" aria-hidden="true" />
        <span className="lx-orbit__moon is-b" aria-hidden="true" />
        <span className="lx-orbit__moon is-c" aria-hidden="true" />
        {ANGLES.map((a, i) => {
          const n = slots[i] ? byId[slots[i]] : null;
          return (
            <div key={i} className="lx-sat" style={{ '--a': `${a}deg`, '--rr': RADII[i] }}>
              <div className="lx-sat__upright">
                {n ? (
                  <button key={n.id} type="button" className={`lx-sat__card tone-${n.tone}`} onClick={() => onOpenProduct?.(n.product)} aria-label={`${n.label}: ${n.product.name}`}>
                    <span className="lx-sat__img">
                      <img src={n.product.image} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      <i aria-hidden="true">{(n.product.brand || n.product.name || '?').charAt(0)}</i>
                    </span>
                    <span className="lx-sat__label">{n.label}</span>
                    <span className="lx-sat__name">{n.product.name}</span>
                  </button>
                ) : (
                  <span className="lx-sat__empty" aria-hidden="true">+</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="lx-orbit__you" aria-hidden="true">you</div>
    </div>
  );
}
