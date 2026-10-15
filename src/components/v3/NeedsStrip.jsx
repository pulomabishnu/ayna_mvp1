import React, { useState } from 'react';
import ProductCard from '../ProductCard';

/* "Fill the gaps": the needs she picked as pinned tags on one cork strip.
   Pick a tag to see ayna's strongest picks for that need, with the match
   percentage on every card. A tick on a tag means one of its picks is
   already in her ecosystem. */
export default function NeedsStrip({ needs, isOwned, onOpenProduct, onToggleProduct, onShop }) {
  const firstGap = needs.find((n) => n.picks.length && !n.picks.some((p) => isOwned(p.productId))) || needs.find((n) => n.picks.length) || needs[0];
  const [sel, setSel] = useState(firstGap ? firstGap.id : null);
  const cur = needs.find((n) => n.id === sel) || firstGap;
  if (!cur) return null;
  return (
    <div className="ay-needs">
      <ul className="ay-needs__tags" aria-label="Your needs">
        {needs.map((n, i) => {
          const covered = n.picks.some((p) => isOwned(p.productId));
          return (
            <li key={n.id} style={{ '--r': `${[-2, 1.5, -1, 2, -.5][i % 5]}deg` }}>
              <button type="button" className={`ay-needs__tag${n.id === cur.id ? ' is-on' : ''}`} aria-pressed={n.id === cur.id} onClick={() => setSel(n.id)}>
                {covered && <span className="ay-needs__tick" aria-label="Covered">✓</span>}
                {n.label}
                <small>{n.picks.length ? `${n.picks.length} pick${n.picks.length === 1 ? '' : 's'}` : 'no match yet'}</small>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="ay-needs__panel" aria-live="polite">
        <p className="ay-needs__for">For <strong>{cur.phrase}</strong></p>
        {cur.picks.length > 0 ? (
          <ul className="ay-needs__grid">
            {cur.picks.map((p) => {
              const owned = isOwned(p.productId);
              return (
                <li key={p.productId}>
                  <ProductCard
                    product={p.product}
                    matchPercent={p.score}
                    matchLabel={`${p.score}% match for ${cur.phrase}`}
                    onOpen={onOpenProduct}
                    action={owned ? <span className="ay-needs__owned">✓ In your ecosystem</span> : onToggleProduct && (
                      <button type="button" className="ay-card-add" onClick={() => onToggleProduct(p.product)}>+ Add to my ecosystem</button>
                    )}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ay-needs__none">
            No strong match for {cur.phrase} yet. We would rather show nothing than a weak pick.
            {onShop && <button type="button" className="eco3-pill" onClick={() => onShop(cur.short)}>Browse {cur.short.toLowerCase()}</button>}
          </p>
        )}
        {cur.care && (
          <details className="ay-needs__care">
            <summary>Care options for {cur.phrase}</summary>
            <ul>
              {cur.care.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a> <span>{link.hint}</span></li>)}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
