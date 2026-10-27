import React, { useMemo, useState } from 'react';
import { NEEDS, TONES, productsForNeed } from './landingNeeds';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import './HomeShowcase.css';

/* Explore by need: one card per health need with a real product. */
export function ExploreByNeed({ onExplore, onOpenProduct, onViewAll, limit = 6, title = 'Explore by need' }) {
  const needs = useMemo(() => NEEDS.map((n) => ({ ...n, pool: productsForNeed(n) })).filter((n) => n.pool.length > 0).slice(0, limit), [limit]);
  const [turn, setTurn] = useState(0);
  if (!needs.length) return null;
  return (
    <section className="hs-needs" aria-labelledby="hs-needs-title">
      <div className="mockup-page">
        <div className="hs-needs__head">
          <div>
            <h2 id="hs-needs-title">{title}</h2>
            <p>Real products for what you care about.</p>
          </div>
          <button type="button" className="hs-needs__refresh" onClick={() => setTurn((t) => t + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
            Shuffle
          </button>
        </div>
        <div className="hs-needs__grid">
          {needs.map((n, i) => {
            const p = n.pool[turn % n.pool.length];
            return (
              <article key={n.id} className={`hs-need tone-${TONES[i % TONES.length]}`}>
                <a
                  className="hs-need__img"
                  href={productHref(p.id)}
                  onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct?.(p); }}
                  aria-label={p.name}
                >
                  <img key={p.id} src={p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                </a>
                <div className="hs-need__body">
                  <h3>{n.label}</h3>
                  <p>{p.name}</p>
                  <button type="button" onClick={() => onExplore?.(n)}>Explore <span aria-hidden="true">→</span></button>
                </div>
              </article>
            );
          })}
        </div>
        {onViewAll && (
          <div className="hs-needs__foot">
            <button type="button" className="hs-needs__all" onClick={onViewAll}>See everything in Explore</button>
          </div>
        )}
      </div>
    </section>
  );
}
