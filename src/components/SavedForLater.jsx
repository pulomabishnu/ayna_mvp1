import React from 'react';
import ProductCard from './ProductCard';

export default function SavedForLater({
  savedProducts = {},
  myProducts = {},
  onOpenProduct,
  onToggleSaved,
  onAddToEcosystem,
  onBrowse,
}) {
  const items = Object.values(savedProducts || {});

  return (
    <section id="ayna-wishlist" className="eco-saved mockup-page wishlist-section">
      <div className="eco3-area__head eco-saved__head">
        <h2>Saved</h2>
        {items.length > 0 && <span className="eco3-area__count eco-saved__count">{items.length}</span>}
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <p>Nothing saved yet. Tap the heart on anything in Shop.</p>
          <button type="button" className="eco3-pill" onClick={onBrowse}>Go to Shop</button>
        </div>
      ) : (
        <div className="ayna-browse__grid eco3-grid eco-saved__grid">
          {items.map((product) => {
            const inEcosystem = !!myProducts[product.id];
            return (
              <ProductCard
                key={product.id}
                product={product}
                isSaved
                inEcosystem={inEcosystem}
                onOpen={onOpenProduct}
                onToggleSaved={onToggleSaved}
                action={inEcosystem ? null : (
                  <button type="button" className="ay-card-add" onClick={() => onAddToEcosystem?.(product)}>
                    + Add to ecosystem
                  </button>
                )}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
