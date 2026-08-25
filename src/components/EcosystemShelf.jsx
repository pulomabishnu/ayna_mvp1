import React, { useMemo } from 'react';
import { ECOSYSTEM_AREAS, resolveEcosystemProductCategory } from './EcosystemBubbles';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

/**
 * "Four shelves, built for you." — mockup board 1e, the alternate/organized
 * view of the same ecosystem EcosystemBubbles (1d) draws as a circle. Same
 * area grouping, same real data — just a row-per-area layout instead of a
 * ring, for anyone who reads a list faster than a diagram.
 */

const MAX_TILES = 4;

function CareTile({ product, onOpenProduct }) {
  return (
    <button type="button" className="eco-shelf__tile" onClick={() => onOpenProduct?.(product)}>
      <span className="eco-shelf__tile-swatch" aria-hidden>
        <ProductTileImage product={product} letterNode={<ProductImageFallback compact />} />
      </span>
      <span className="eco-shelf__tile-name">{product.name}</span>
    </button>
  );
}

export default function EcosystemShelf({ myProducts = {}, onOpenProduct, onExploreArea, hideTitle = false }) {
  const { filled, gaps } = useMemo(() => {
    const products = Object.values(myProducts || {});
    const byArea = new Map();
    products.forEach((p) => {
      const area = ECOSYSTEM_AREAS.find((a) => a.categories.includes(resolveEcosystemProductCategory(p)));
      const key = area ? area.key : 'other';
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(p);
    });

    const filledAreas = ECOSYSTEM_AREAS
      .filter((a) => byArea.has(a.key))
      .map((a) => ({ ...a, products: byArea.get(a.key) }));
    if (byArea.has('other')) {
      filledAreas.push({ key: 'other', label: 'Other', products: byArea.get('other') });
    }

    const gapAreas = ECOSYSTEM_AREAS
      .filter((a) => !byArea.has(a.key))
      .slice(0, Math.max(0, 6 - filledAreas.length));

    return { filled: filledAreas, gaps: gapAreas };
  }, [myProducts]);

  if (filled.length === 0 && gaps.length === 0) return null;

  return (
    <section className="eco-shelf mockup-page">
      {!hideTitle && <h2 className="eco-shelf__title">Your shelves.</h2>}
      <p className="eco-shelf__lede">
        Each row is an area of care. Swap anything, or leave a shelf empty and we'll keep watching for a match.
      </p>

      <div className="eco-shelf__rows">
        {filled.map((area) => {
          const shown = area.products.slice(0, MAX_TILES);
          const openSlots = Math.max(0, MAX_TILES - shown.length);
          return (
            <div key={area.key} className="eco-shelf__row">
              <div className="eco-shelf__row-label">
                <span className="eco-shelf__row-eyebrow">{area.label}</span>
                <span className="eco-shelf__row-count">
                  {area.products.length} pick{area.products.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="eco-shelf__row-tiles">
                {shown.map((p) => (
                  <CareTile key={p.id} product={p} onOpenProduct={onOpenProduct} />
                ))}
                {openSlots > 0 && (
                  <button
                    type="button"
                    className="eco-shelf__tile eco-shelf__tile--add"
                    onClick={() => onExploreArea?.(area)}
                  >
                    Add +
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {gaps.map((area) => (
          <div key={area.key} className="eco-shelf__row eco-shelf__row--gap">
            <div className="eco-shelf__row-label">
              <span className="eco-shelf__row-eyebrow eco-shelf__row-eyebrow--muted">{area.label}</span>
              <span className="eco-shelf__row-count eco-shelf__row-count--muted">Not tracked</span>
            </div>
            <button type="button" className="eco-shelf__row-prompt" onClick={() => onExploreArea?.(area)}>
              See matches →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
