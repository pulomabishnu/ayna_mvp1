import React from 'react';
import { CATEGORY_LABELS } from '../data/products';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

function eyebrowFor(product) {
  return String(CATEGORY_LABELS[product.category] || product.category || 'Product')
    .replace(/^[^\w]+\s*/, '')
    .toUpperCase();
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="wishlist-heart-icon">
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

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
      <div className="eco-saved__head">
        <div className="eco-saved__title">Wishlist</div>
        {items.length > 0 && (
          <div className="eco-saved__count">{items.length} saved</div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <p>Nothing saved yet.</p>
          <button type="button" onClick={onBrowse}>Browse products</button>
        </div>
      ) : (
        <div className="eco-saved__grid wishlist-grid">
          {items.map((product) => {
            const inEcosystem = !!myProducts[product.id];
            return (
              <article key={product.id} className="wishlist-card">
                <a
                  className="wishlist-card__link"
                  href={productHref(product.id)}
                  onClick={(e) => {
                    if (!isPlainLeftClick(e)) return;
                    e.preventDefault();
                    onOpenProduct?.(product);
                  }}
                >
                  <div className="wishlist-card__tile">
                    <ProductTileImage
                      product={product}
                      alt={product.name}
                      letterNode={<ProductImageFallback />}
                    />
                  </div>
                  <div className="wishlist-card__eyebrow">{eyebrowFor(product)}</div>
                  <h3>{product.name}</h3>
                  <div className="wishlist-card__price">{product.price || ''}</div>
                </a>

                <button
                  type="button"
                  className="wishlist-card__heart is-saved"
                  aria-label={`Remove ${product.name} from wishlist`}
                  onClick={() => onToggleSaved?.(product)}
                >
                  <HeartIcon filled />
                </button>

                <button
                  type="button"
                  className="wishlist-card__ecosystem"
                  onClick={() => !inEcosystem && onAddToEcosystem?.(product)}
                  disabled={inEcosystem}
                >
                  {inEcosystem ? 'In ecosystem' : 'Add to ecosystem'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
