import React, { useRef } from 'react';
import useCardViews from './useCardViews.js';

const Arrow = ({ dir }) => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/**
 * A rail of cards (#26 Rhode "a little more glow": a row with small round
 * arrows). Scrolls by touch or trackpad; the arrows page it on a pointer
 * device. Sends card views for CTR (useCardViews).
 */
export default function CardRail({ items = [], source, render, className = '' }) {
  const ref = useRef(null);
  useCardViews(ref, source, [items.length]);
  const page = (d) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.9, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return (
    <div className={`wx-rail ${className}`.trim()}>
      <div className="wx-row" ref={ref}>{items.map((p, i) => render(p, i, source))}</div>
      {items.length > 4 && <div className="wx-rail__arrows">
        <button type="button" className="wx-rail__arrow" onClick={() => page(-1)} aria-label="Scroll back"><Arrow dir="prev" /></button>
        <button type="button" className="wx-rail__arrow" onClick={() => page(1)} aria-label="Scroll on"><Arrow dir="next" /></button>
      </div>}
    </div>
  );
}

/** A grid of cards that sends card views for CTR, like the rail. */
export function CardGrid({ items = [], source, render, className = '' }) {
  const ref = useRef(null);
  useCardViews(ref, source, [items.length, items[0]?.id]);
  return <div className={`ay-product-grid wx-grid ${className}`.trim()} ref={ref}>{items.map((p, i) => render(p, i, source))}</div>;
}
