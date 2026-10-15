import React from 'react';
import { CATEGORY_LABELS } from '../data/products';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { formatPrice } from '../utils/formatPrice';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import MatchPill from './MatchPill';
import { getVerificationLinks } from '../utils/verificationLinks';
import { displayName } from '../mobile/utils/displayName.js';
import { brandOf } from '../mobile/data/brandFallback.js';
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
  rating = null,
  tile = null,
  onOpen,
  onToggleSaved,
  action = null,
  className = '',
  style,
}) {
  if (!product) return null;
  const categoryLabel = CATEGORY_LABELS[product.category] || (product.category ? String(product.category).replace(/-/g, ' ') : 'Product');
  const shownBrand = brandOf(product) || product.brand || '';
  const rawPrice = formatPrice(product);
  // Long "check the retailer" notes ran past the card edge; say it short.
  const price = /check (the )?retailer|varies by retailer/i.test(String(rawPrice.main || '')) ? { main: 'Price at retailer', sub: '' } : rawPrice;
  return (
    <article className={`ayna-discover-card ayna-browse-card${inEcosystem ? ' is-in-eco' : ''} ${className}`.trim()} style={style}>
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
        </div>
        <div className="ayna-discover-card__body">
          <div className="ayna-browse-card__labels">
            <span className="ayna-discover-card__category">{shownBrand || categoryLabel}</span>
            {labels}
          </div>
          {/* Brand sits in the eyebrow, so a leading brand is trimmed from
              the name ("Love Wellness Bye Bye Bloat" → "Bye Bye Bloat"). */}
          {/* Match and ownership read as text, never over the product photo. */}
          {((matchPercent != null && matchPercent > 0) || inEcosystem) && (
            <span className="ay-card-match">
              {matchPercent != null && matchPercent > 0 && <MatchPill percent={matchPercent} size="sm" className="ayna-browse-card__pill" label={matchLabel || `${Math.round(matchPercent)}% match`} />}
              {inEcosystem && <span className="ay-card-match__eco">✓ In your ecosystem</span>}
            </span>
          )}
          <h3 className="ayna-discover-card__name">{shownBrand ? displayName(product) : product.name}</h3>
          <span className="ayna-discover-card__price">{price.main}{price.sub && <small>{price.sub}</small>}</span>
          {(() => {
            const clinician = getVerificationLinks(product, 'doctor').length > 0;
            const evidence = getVerificationLinks(product, 'scientific').length > 0;
            const hasRating = rating && Number.isFinite(rating.value) && rating.count > 0;
            if (!clinician && !evidence && !hasRating) return null;
            return (
              <span className="ay-card-trust">
                {hasRating && <span className="ay-card-trust__rating"><span aria-hidden="true">★</span> {rating.value.toFixed(1)} · {rating.count} review{rating.count === 1 ? '' : 's'}</span>}
                {clinician && <span className="ay-card-trust__tag">Clinical sources</span>}
                {evidence && <span className="ay-card-trust__tag">Research linked</span>}
              </span>
            );
          })()}
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
