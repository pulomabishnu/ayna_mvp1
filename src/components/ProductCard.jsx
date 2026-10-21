import React from 'react';
import { CheckIcon } from './icons/UiIcons.jsx';
import { CATEGORY_LABELS } from '../data/catalogTaxonomy.js';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import { formatPrice } from '../utils/formatPrice';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import MatchPill from './MatchPill';
import { displayName } from '../mobile/utils/displayName.js';
import { requestProductTab, formatAverage } from '../utils/community/reviewRatings.js';
import { brandOf } from '../mobile/data/brandFallback.js';
import { saveFeedback } from '../utils/feedback.js';
import '../styles/match-ui.css';
import '../styles/verify-content.css';
import { productImageAlt } from '../utils/seoMeta';

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
  // Small line under the match, e.g. "Backed by your sleep data" (src/components/health).
  badge = null,
  className = '',
  style,
}) {
  if (!product) return null;
  const categoryLabel = CATEGORY_LABELS[product.category] || (product.category ? String(product.category).replace(/-/g, ' ') : 'Product');
  const shownBrand = brandOf(product) || product.brand || '';
  // Something she added herself (not in the catalog yet): no page to open
  // and no facts to show, so the card says whose it is and stays put.
  const isMine = product.userAdded === true;
  // A waitlist deposit is not a price: say what it is, same as the product page.
  const isDeposit = /deposit/i.test(String(product.price || ''));
  const rawPrice = isMine ? { main: 'Added by you', sub: '' } : isDeposit ? { main: 'Coming soon', sub: 'Waitlist' } : formatPrice(product);
  // Long "check the retailer" notes ran past the card edge; say it short.
  const price = /check (the )?retailer|varies by retailer/i.test(String(rawPrice.main || '')) ? { main: 'Price at retailer', sub: '' } : rawPrice;
  const Link = isMine ? 'div' : 'a';
  // One anatomy everywhere (docs/design-direction.md, "Product card"):
  // white tile → brand → name (2 lines) → what it is + labels → price → rating.
  const kind = !isMine && shownBrand ? String(categoryLabel).replace(/^[^\w]+\s*/, '') : '';
  return (
    <article className={`ay-product-card${inEcosystem ? ' is-in-eco' : ''} ${className}`.trim()} style={style}>
      <Link
        className={`ay-product-card__link${isMine ? ' is-static' : ''}`}
        {...(isMine ? {} : {
          href: productHref(product),
          onClick: (e) => {
            if (!isPlainLeftClick(e)) return;
            e.preventDefault();
            // The star line is the way to the reviews: the page opens on Reviews.
            if (e.target?.closest?.('.ay-product-card__rating')) requestProductTab('reviews');
            onOpen?.(product);
          },
        })}
      >
        <div className="ay-product-card__tile">
          {tile || <ProductTileImage product={product} alt={productImageAlt(product)} letterNode={<ProductImageFallback product={product} />} />}
        </div>
        <div className="ay-product-card__body">
          <div className="ay-product-card__top">
            {isDeposit && <span className="ay-product-card__badge is-pill">Pre-order</span>}
            <span className="ay-product-card__brand">{isMine ? categoryLabel : (shownBrand || categoryLabel)}</span>
          </div>
          {/* Brand sits above, so a leading brand is trimmed from the name
              ("Love Wellness Bye Bye Bloat" → "Bye Bye Bloat"). */}
          <h3 className="ay-product-card__name" title={product.name}>{shownBrand ? displayName(product) : product.name}</h3>
          {(kind || labels) && <p className="ay-product-card__kind">{kind && <span>{kind}</span>}{labels}</p>}
          {/* Match and ownership read as text, never over the product photo. */}
          {((matchPercent != null && matchPercent > 0) || inEcosystem) && (
            <span className="ay-product-card__match">
              {matchPercent != null && matchPercent > 0 && <MatchPill percent={matchPercent} size="sm" className="ay-product-card__pill" label={matchLabel || `${Math.round(matchPercent)}% match`} />}
              {inEcosystem && <span className="ay-product-card__eco"><CheckIcon size={14} />In your ecosystem</span>}
            </span>
          )}
          {badge}
          <span className={`ay-product-card__price${price.main === 'Price at retailer' ? ' is-unknown' : ''}`}>{price.main}{price.sub && (/^list\s+\$/i.test(price.sub)
            ? (() => { const [was, ...rest] = price.sub.replace(/^list\s+/i, '').split(/\s+·\s+/); return <small><span className="sr-only">List price </span><s>{was}</s>{rest.length > 0 && <span> {rest.join(' · ')}</span>}</small>; })()
            : <small>{price.sub}</small>)}</span>
          {rating && Number.isFinite(rating.value) && rating.count > 0 && (
            <span className="ay-product-card__rating" data-reviews-link="true"><span aria-hidden="true">★</span> <span className="sr-only">Rated </span>{formatAverage(rating.value)}<span className="sr-only"> out of 5</span> · <u>{rating.count} review{rating.count === 1 ? '' : 's'}</u></span>
          )}
        </div>
      </Link>
      {onToggleSaved && (
        <button
          type="button"
          className="ay-product-card__heart"
          aria-label={isSaved ? `Remove ${product.name} from Saved` : `Save ${product.name}`}
          aria-pressed={isSaved}
          onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
      {action && <div className="ay-product-card__action">{action}</div>}
    </article>
  );
}
