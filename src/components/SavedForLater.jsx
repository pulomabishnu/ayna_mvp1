import React from 'react';
import { CATEGORY_LABELS } from '../data/products';
import { handleImageErrorWithRetry } from '../utils/imageRetry';

/**
 * "Saved for later" — the shelf at the bottom of My Ecosystem holding whatever
 * the Save for later button on a product page put there.
 *
 * Cards are the same cream-tile card Discovery uses (mockup board 1h): tile,
 * category eyebrow, name, price. Clicking one opens the same product modal, so
 * a product looks identical wherever it's opened from.
 */

function eyebrowFor(product) {
  return String(CATEGORY_LABELS[product.category] || product.category || '')
    .replace(/^[^\w]+\s*/, '')
    .toUpperCase();
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
    <section className="eco-saved mockup-page">
      <div className="eco-saved__head">
        <div className="eco-saved__title">Saved for later</div>
        <div className="eco-saved__count">
          {items.length > 0
            ? `${items.length} item${items.length === 1 ? '' : 's'}`
            : 'Nothing saved yet'}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="eco-saved__empty">
          Tap <strong>Save for later</strong> on any product and it lands here. A shortlist you can
          come back to without adding it to your ecosystem.{' '}
          <button
            type="button"
            onClick={onBrowse}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#B4732A', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Browse products
          </button>
        </p>
      ) : (
        <div className="eco-saved__grid">
          {items.map((product) => {
            const inEcosystem = !!myProducts[product.id];
            return (
              <div key={product.id} className="discovery-card" style={{ cursor: 'default' }}>
                <div
                  className="discovery-card__tile"
                  role="button"
                  tabIndex={0}
                  aria-label={`${product.name}. Open details`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpenProduct?.(product)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    onOpenProduct?.(product);
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
                    />
                  ) : (
                    <span className="discovery-card__initial" aria-hidden="true">
                      {String(product.brand || product.name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    className="discovery-card__heart is-on"
                    aria-label={`Remove ${product.name} from Saved for later`}
                    onClick={(e) => { e.stopPropagation(); onToggleSaved?.(product); }}
                    style={{ marginLeft: 'auto' }}
                  >
                    ♥
                  </button>
                </div>

                <div className="discovery-card__eyebrow">{eyebrowFor(product)}</div>
                <div className="discovery-card__name">{product.name}</div>
                <div className="discovery-card__price">{product.price}</div>

                <button
                  type="button"
                  className="discovery-card__join"
                  onClick={() => onAddToEcosystem?.(product)}
                  disabled={inEcosystem}
                  style={inEcosystem ? { opacity: 0.55, cursor: 'default' } : undefined}
                >
                  {inEcosystem ? '✓ In ecosystem' : 'Add to ecosystem'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
