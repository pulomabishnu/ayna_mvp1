import React from 'react';
import ProductCard from './ProductCard';
import { CompareToggle } from './compare/CompareControls.jsx';
import SavedReminders from './save/SavedReminders.jsx';

/**
 * Saved (website): the products she hearted for later, as one shelf of the
 * shared product card. Anything already on her shelves isn't listed twice.
 */
export default function SavedForLater({
  savedProducts = {},
  myProducts = {},
  onOpenProduct,
  onToggleSaved,
  onAddToEcosystem,
  onBrowse,
}) {
  // "For later" only: anything already on her shelves isn't listed twice (audit).
  const items = Object.values(savedProducts || {}).filter((p) => p?.id && !myProducts?.[p.id]);

  return (
    <section id="ayna-wishlist" className="ay-shelf ay-saved2" aria-labelledby="ayna-wishlist-h">
      <div className="ay-shelf__head">
        <h2 id="ayna-wishlist-h" className="ay-h2">Saved</h2>
        {items.length > 0 && <span className="ay-shelf__count">{items.length}</span>}
        {items.length > 1 && <CompareToggle className="ay-saved2__compare" />}
      </div>
      <SavedReminders variant="web" resolve={(id) => savedProducts?.[id] || null} onOpenProduct={onOpenProduct} />

      {items.length === 0 ? (
        <div className="ay-group is-padded ay-saved2__empty">
          <p><strong>Nothing saved yet.</strong> When something catches your eye, tap Save and it’ll live here.</p>
          <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowse}>Go to Shop</button>
        </div>
      ) : (
        <ul className="ay-shelf__row" aria-label="Saved products">
          {items.map((product) => {
            const inEcosystem = !!myProducts[product.id];
            return (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  isSaved
                  inEcosystem={inEcosystem}
                  onOpen={onOpenProduct}
                  onToggleSaved={onToggleSaved}
                  action={inEcosystem ? null : (
                    <button type="button" className="ay-btn ay-btn--secondary ay-saved2__add" onClick={() => onAddToEcosystem?.(product)}>+ Add to my routine</button>
                  )}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
