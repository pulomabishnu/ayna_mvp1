import React, { useMemo } from 'react';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

/**
 * "Four shelves, built for you.", mockup board 1e, the alternate/organized
 * view of the same ecosystem EcosystemBubbles (1d) draws as a circle. Same
 * area grouping, same real data, just a row-per-area layout instead of a
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
      const area = resolveEcosystemProductArea(p, ECOSYSTEM_AREAS);
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
        Each row is an area of care. Select anything to see why it&apos;s here.
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

        {gaps.length > 0 && (
          <div className="eco-shelf__addrow">
            <span className="eco-shelf__addrow-label">Add a shelf</span>
            <div className="eco-shelf__addrow-chips">
              {gaps.map((area) => (
                <button key={area.key} type="button" className="eco-shelf__addchip" onClick={() => onExploreArea?.(area)}>
                  + {area.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
