import React, { useEffect, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage';

/* My Ecosystem as a medicine cabinet. ayna means "mirror", so the page
   opens on a mirror door with her counts written on it in lipstick; tap it
   and it swings open onto her shelves (one per area of care, real product
   photos). Tapping a shelf jumps to that area further down the page. */
export default function EcoCabinet({ areaGroups = [], total = 0, name = '', onBuild }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [open, setOpen] = useState(Boolean(reduce));
  useEffect(() => {
    if (reduce || total === 0) return undefined;
    const t = window.setTimeout(() => setOpen(true), 1100);
    return () => window.clearTimeout(t);
  }, [reduce, total]);
  const shelves = areaGroups.slice(0, 4);
  const jump = (key) => {
    try { window.dispatchEvent(new CustomEvent('ay-open-area', { detail: key })); } catch { /* ignore */ }
    const el = document.getElementById(`eco-area-${key}`);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <section className={`ay3-cab${open ? ' is-open' : ''}`} aria-label="Your cabinet">
      <div className="ay3-cab__box">
        <div className="ay3-cab__shelves">
          {shelves.length === 0 && (
            <div className="ay3-cab__empty">
              <p>Nothing on the shelves yet.</p>
              {onBuild && <button type="button" className="ay3-cab__btn" onClick={onBuild}>Fill my cabinet</button>}
            </div>
          )}
          {shelves.map((g) => (
            <button key={g.key} type="button" className="ay3-cab__shelf" onClick={() => jump(g.key)} aria-label={`${g.label}: ${g.products.length} product${g.products.length === 1 ? '' : 's'}. Jump to this shelf`}>
              <span className="ay3-cab__items">
                {g.products.slice(0, 4).map((p, i) => (
                  <span key={p.id} className="ay3-cab__item" style={{ '--i': i }}>
                    <ProductTileImage product={p} alt="" letterNode={<ProductImageFallback />} />
                  </span>
                ))}
                {g.products.length > 4 && <span className="ay3-cab__more">+{g.products.length - 4}</span>}
              </span>
              <span className="ay3-cab__label">{g.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="ay3-cab__door" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Close the mirror' : 'Open the mirror'}>
          <span className="ay3-cab__glass" aria-hidden="true">
            <span className="ay3-cab__lip">{name ? `hi ${name} ♡` : 'hi there ♡'}</span>
            <span className="ay3-cab__lip is-big">{total} pick{total === 1 ? '' : 's'}</span>
            <span className="ay3-cab__lip">{areaGroups.length} area{areaGroups.length === 1 ? '' : 's'} of care</span>
          </span>
          <span className="ay3-cab__knob" aria-hidden="true" />
        </button>
      </div>
      <p className="ay3-cab__hint" aria-hidden="true">{open ? 'tap a shelf to jump to it' : 'tap the mirror'}</p>
    </section>
  );
}
