import React, { useEffect, useRef, useState } from 'react';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { formatPrice } from '../utils/formatPrice';
import { brandOf } from '../mobile/data/brandFallback.js';
import { displayName } from '../mobile/utils/displayName.js';

export default function SavedForLater({
  savedProducts = {},
  myProducts = {},
  onOpenProduct,
  onToggleSaved,
  onAddToEcosystem,
  onBrowse,
}) {
  const items = Object.values(savedProducts || {});
  const rowRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const read = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    read();
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => { el.removeEventListener('scroll', read); window.removeEventListener('resize', read); };
  }, [items.length]);
  const page = (dir) => { const el = rowRef.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' }); };

  return (
    <section id="ayna-wishlist" className="eco-saved mockup-page wishlist-section">
      <div className="eco3-area__head eco-saved__head">
        <p className="eco3-needs__kicker">For later</p>
        <h2>Saved<em>.</em></h2>
        {items.length > 0 && <span className="eco3-area__count eco-saved__count">{items.length}</span>}
        <span className="eco3-needs__sub eco-saved__sub">Things you hearted in the shop, kept for later.</span>
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <p>Nothing saved yet. Use the heart on anything in Shop to keep it here.</p>
          <button type="button" className="eco3-pill" onClick={onBrowse}>Go to Shop</button>
        </div>
      ) : (
        <>
        <ul className="ay-saved" ref={rowRef}>
          {items.map((product) => {
            const inEcosystem = !!myProducts[product.id];
            const brand = brandOf(product) || product.brand || '';
            const price = formatPrice(product);
            return (
              <li key={product.id} className="ay-saved__item">
                <a
                  className="ay-saved__open"
                  href={productHref(product)}
                  onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct?.(product); }}
                >
                  <span className="ay-saved__img"><ProductTileImage product={product} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} letterNode={<ProductImageFallback compact />} /></span>
                  {brand && <span className="ay-saved__brand">{brand}</span>}
                  <span className="ay-saved__name">{brand ? displayName(product) : product.name}</span>
                  <span className="ay-saved__price">{price.main}</span>
                </a>
                <div className="ay-saved__acts">
                  {inEcosystem
                    ? <span className="ay-saved__in">✓ In ecosystem</span>
                    : <button type="button" className="ay-saved__add" onClick={() => onAddToEcosystem?.(product)}>+ Add</button>}
                  {onToggleSaved && (
                    <button type="button" className="ay-saved__heart" onClick={() => onToggleSaved(product)} aria-label={`Remove ${product.name} from saved`} title="Remove from saved">♥</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {(
          <div className="ay-saved__nav">
            <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous saved items">←</button>
            <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="More saved items">→</button>
          </div>
        )}
        </>
      )}
    </section>
  );
}
