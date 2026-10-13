import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS, itemMatchesMacroGroup } from '../data/products';
import { isPlaceholderProductImage } from '../utils/resolveProductImage';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import './HomeShowcase.css';

const hasPhoto = (p) => p?.image && !isPlaceholderProductImage(p.image, p.type === 'digital') && p.type !== 'digital' && p.category !== 'telehealth';

/* ------------------------------------------------------------------ */
/* Hero mosaic: real products floating in a loose grid (logged out).   */
/* ------------------------------------------------------------------ */
const MOSAIC_PICKS = ['period', 'intimate', 'hormones', 'pelvic', 'fertility', 'postpartum', 'skin', 'sleep-stress'];

export function ProductMosaic({ onOpenProduct }) {
  const items = useMemo(() => {
    const used = new Set();
    const out = [];
    for (const g of MOSAIC_PICKS) {
      const p = ALL_PRODUCTS.find((x) => hasPhoto(x) && !used.has(x.id) && itemMatchesMacroGroup(x, g));
      if (p) { used.add(p.id); out.push(p); }
      if (out.length === 6) break;
    }
    return out;
  }, []);
  if (items.length < 3) return null;
  return (
    <div className="hs-mosaic" aria-label="A few products on ayna">
      {items.map((p, i) => (
        <a
          key={p.id}
          className={`hs-mosaic__card is-${i % 6}`}
          href={productHref(p.id)}
          onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct?.(p); }}
          style={{ '--i': i }}
        >
          <span className="hs-mosaic__img"><img src={p.image} alt="" loading={i < 3 ? 'eager' : 'lazy'} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /></span>
          <span className="hs-mosaic__name">{p.name}</span>
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Explore by need: one card per health need with a real product.     */
/* ------------------------------------------------------------------ */
const NEEDS = [
  { id: 'period', label: 'Period care', group: 'period' },
  { id: 'pcos', label: 'PCOS', keywords: ['pcos', 'inositol', 'spearmint'] },
  { id: 'vaginal', label: 'Vaginal health', group: 'intimate' },
  { id: 'uti', label: 'UTI support', keywords: ['uti', 'urinary', 'cranberry'] },
  { id: 'fertility', label: 'Fertility', group: 'fertility' },
  { id: 'pelvic', label: 'Pelvic health', group: 'pelvic' },
  { id: 'menopause', label: 'Menopause', group: 'menopause' },
  { id: 'postpartum', label: 'Postpartum', group: 'postpartum' },
];
const TONES = ['pink', 'mint', 'butter', 'peri'];

function textOf(p) {
  return [p?.name, p?.brand, p?.category, p?.summary, ...(p?.tags || []), ...(p?.healthFunctions || [])].filter(Boolean).join(' ').toLowerCase();
}
function productsForNeed(need) {
  return ALL_PRODUCTS.filter((p) => hasPhoto(p) && (need.group ? itemMatchesMacroGroup(p, need.group) : need.keywords.some((k) => textOf(p).includes(k))));
}

export function ExploreByNeed({ onExplore, onOpenProduct, limit = 6 }) {
  const needs = useMemo(() => NEEDS.map((n) => ({ ...n, pool: productsForNeed(n) })).filter((n) => n.pool.length > 0).slice(0, limit), [limit]);
  const [turn, setTurn] = useState(0);
  if (!needs.length) return null;
  return (
    <section className="hs-needs" aria-labelledby="hs-needs-title">
      <div className="mockup-page">
        <div className="hs-needs__head">
          <div>
            <h2 id="hs-needs-title">Explore by need</h2>
            <p>Real ayna products, by the health need that matters to you.</p>
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
      </div>
    </section>
  );
}
