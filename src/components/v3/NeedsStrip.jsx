import React, { useEffect, useRef, useState } from 'react';
import { needHeadline } from '../../utils/matchDisplay.js';
import ProductCard from '../ProductCard';
import { whyLineForPick } from '../../utils/whyLine.js';
import HealthBackedBadge from '../health/HealthBackedBadge.jsx';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons/UiIcons.jsx';

/* "Fill the gaps": the needs she picked that nothing on her shelves covers
   yet, as tags on one strip. Pick a tag to see ayna's strongest picks for
   that need (never something she already owns). Needs she already covers
   fold away as "Covered by …". A need with no strong pick says what to do
   instead of a dead "no match". */
export default function NeedsStrip({ needs, isOwned, onOpenProduct, onToggleProduct, onShop, onFindCare }) {
  const coveredBy = (n) => n.picks.find((p) => isOwned(p.productId));
  const gaps = needs.filter((n) => !coveredBy(n));
  const covered = needs.filter((n) => coveredBy(n));
  const [sel, setSel] = useState(gaps[0] ? gaps[0].id : null);
  const cur = needs.find((n) => n.id === sel) || null;

  const rowRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const measure = () => {
    const el = rowRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => { measure(); window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, [gaps.length]);
  const page = (dir) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: 'smooth' });

  if (!needs.length) return null;
  const picks = cur ? cur.picks.filter((p) => !isOwned(p.productId)) : [];
  const owner = cur ? coveredBy(cur) : null;

  return (
    <div className="ay-needs">
      {gaps.length === 0 ? (
        <p className="ay-needs__done">Every need you picked has something on a shelf.</p>
      ) : (
        <div className="ay-needs__row">
          {!edge.start && <button type="button" className="ay-needs__arrow is-prev" onClick={() => page(-1)} aria-label="Scroll needs back"><ChevronLeftIcon /></button>}
          <ul className="ay-needs__tags" ref={rowRef} onScroll={measure} aria-label="Needs with nothing on a shelf yet">
            {gaps.map((n, i) => (
              <li key={n.id} style={{ '--r': `${[-2, 1.5, -1, 2, -.5][i % 5]}deg` }}>
                <button type="button" className={`ay-chip ay-needs__tag${cur && n.id === cur.id ? ' is-on' : ''}`} aria-pressed={Boolean(cur && n.id === cur.id)} onClick={() => setSel(n.id)}>
                  {n.label}
                  <small>{n.picks.length ? `${n.picks.length} pick${n.picks.length === 1 ? '' : 's'}` : 'Find care'}</small>
                </button>
              </li>
            ))}
          </ul>
          {!edge.end && <button type="button" className="ay-needs__arrow is-next" onClick={() => page(1)} aria-label="Scroll needs forward"><ChevronRightIcon /></button>}
        </div>
      )}
      {covered.length > 0 && (
        <details className="ay-needs__covered">
          <summary>Already covered: {covered.length} need{covered.length === 1 ? '' : 's'}</summary>
          <ul>{covered.map((n) => <li key={n.id}><button type="button" className={cur && n.id === cur.id ? 'is-on' : ''} onClick={() => setSel(n.id)}><strong>{n.label}</strong> covered by {coveredBy(n).product?.name || 'a product on your shelf'}</button></li>)}</ul>
        </details>
      )}
      {cur && (
        <div className="ay-needs__panel" aria-live="polite">
          <p className="ay-needs__for">For <strong>{cur.phrase}</strong></p>
          {owner && <p className="ay-needs__ownedline">Covered by {owner.product?.name || 'a product on your shelf'}.{picks.length ? ' Other strong picks:' : ''}</p>}
          {picks.length > 0 ? (
            <ul className="ay-needs__grid">
              {picks.map((p) => (
                <li key={p.productId}>
                  <ProductCard
                    product={p.product}
                    matchPercent={p.score}
                    matchLabel={needHeadline(p.score, cur.phrase)}
                    why={whyLineForPick(p, cur.phrase)}
                    badge={p.healthBacked ? <HealthBackedBadge backed={p.healthBacked} /> : null}
                    onOpen={onOpenProduct}
                    action={onToggleProduct && (
                      <button type="button" className="ay-btn ay-btn--secondary ay-card-add" onClick={() => onToggleProduct(p.product)}><PlusIcon size={16} className="is-lead" />Add to my ecosystem</button>
                    )}
                  />
                </li>
              ))}
            </ul>
          ) : !owner && (
            <div className="ay-needs__none">
              <p>Nothing in the shop is a strong enough fit for {cur.phrase} to recommend. A clinician is the best next step for this one.</p>
              <div className="ay-needs__noneacts">
                {onFindCare && <button type="button" className="ay-btn ay-btn--primary" onClick={onFindCare}>Find care</button>}
                {onShop && <button type="button" className="ay-btn ay-btn--secondary" onClick={() => onShop(cur.short)}>Browse anyway</button>}
              </div>
            </div>
          )}
          {cur.care && (
            <details className="ay-needs__care">
              <summary>Care options for {cur.phrase}</summary>
              <ul>
                {cur.care.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a> <span>{link.hint}</span></li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
