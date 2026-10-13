import React from 'react';
import { CATEGORY_LABELS } from '../data/products';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { formatPrice } from '../utils/formatPrice';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import MatchPill from './MatchPill';
import '../styles/match-ui.css';
import '../styles/verify-content.css';

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/**
 * The one product card for the website (Shop, Saved, Ecosystem, product page
 * suggestions). Same tile, eyebrow, title, price lines and heart everywhere.
 * `tile` lets Shop pass its own image node (it resolves images live);
 * everyone else gets ProductTileImage.
 */
export default function ProductCard({
  product,
  matchPercent = null,
  // "82% for period cramps": accessible name for the match pill (no tooltip).
  matchLabel = '',
  isSaved = false,
  inEcosystem = false,
  labels = null,
  tile = null,
  onOpen,
  onToggleSaved,
  action = null,
  className = '',
  style,
}) {
  if (!product) return null;
  const categoryLabel = CATEGORY_LABELS[product.category] || (product.category ? String(product.category).replace(/-/g, ' ') : 'Product');
  const price = formatPrice(product);
  return (
    <article className={`ayna-discover-card ayna-browse-card ${className}`.trim()} style={style}>
      <a
        className="ayna-browse-card__link"
        href={productHref(product)}
        onClick={(e) => {
          if (!isPlainLeftClick(e)) return;
          e.preventDefault();
          onOpen?.(product);
        }}
      >
        <div className="ayna-discover-card__tile">
          {tile || <ProductTileImage product={product} alt={product.name} letterNode={<ProductImageFallback />} />}
          {matchPercent != null && matchPercent > 0 && (
            <MatchPill percent={matchPercent} size="sm" className="ayna-browse-card__pill" label={matchLabel || `${Math.round(matchPercent)}% match`} />
          )}
          {inEcosystem && <span className="ayna-browse-card__ecosystem">In ecosystem</span>}
        </div>
        <div className="ayna-discover-card__body">
          <div className="ayna-browse-card__labels">
            <span className="ayna-discover-card__category">{product.brand || categoryLabel}</span>
            {labels}
          </div>
          <h3 className="ayna-discover-card__name">{product.name}</h3>
          <span className="ayna-discover-card__price">{price.main}{price.sub && <small>{price.sub}</small>}</span>
        </div>
      </a>
      {onToggleSaved && (
        <button
          type="button"
          className={`ayna-browse-card__wishlist ${isSaved ? 'is-saved' : ''}`}
          aria-label={isSaved ? `Remove ${product.name} from Saved` : `Save ${product.name}`}
          aria-pressed={isSaved}
          onClick={() => onToggleSaved(product)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
      {action && <div className="ayna-browse-card__action">{action}</div>}
    </article>
  );
}
