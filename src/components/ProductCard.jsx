import React from 'react';
import { CheckIcon } from './icons/UiIcons.jsx';
import { CATEGORY_LABELS } from '../data/catalogTaxonomy.js';
import { cardKind, cardBadge, cardPrice } from '../utils/productCardFacts.js';
import { isKnownPrice } from '../utils/formatPrice.js';
import { sentenceCase } from '../utils/sentenceCase.js';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import ProductTileImage from './ProductTileImage';
import { PlateName, EvidenceRow, PriceExtras, FactChips } from './cards/CardBits.jsx';
import { Plate } from './ui/ay';
import MatchPill from './MatchPill';
import { matchText } from '../utils/matchDisplay.js';
import '../styles/card-fit.css';
import { displayName } from '../mobile/utils/displayName.js';
import { requestProductTab, formatAverage } from '../utils/community/reviewRatings.js';
import { brandOf } from '../mobile/data/brandFallback.js';
import { saveFeedback } from '../utils/feedback.js';
import '../styles/match-ui.css';
import '../styles/verify-content.css';
import { productImageAlt } from '../utils/seoMeta';
import { CompareCheck } from './compare/CompareControls.jsx';
import { IN_ROUTINE } from '../utils/routineCopy.js';

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
  // Held back for safety: "Safety hold" instead of any number (founder, Oct 24).
  matchHold = false,
  // "82% for period cramps": accessible name for the match pill (no tooltip).
  matchLabel = '',
  // One plain line under the % on why it fits her, from the engine's reasons
  // (src/utils/whyLine.js), so the number is explained.
  why = '',
  isSaved = false,
  inEcosystem = false,
  labels = null,
  rating = null,
  tile = null,
  onOpen,
  onToggleSaved,
  // Opens Why this match for the card's product (else the product page opens on it).
  onShowWhy = null,
  action = null,
  // Small line under the match, e.g. "Backed by your sleep data" (src/components/health).
  badge = null,
  // false where the page already says every product is a partner's.
  partnerMark = true,
  // Signed out / no profile: a "See your match" line (no number) that opens the quiz.
  onSeeMatch = null,
  className = '',
  style,
}) {
  if (!product) return null;
  const categoryLabel = sentenceCase(CATEGORY_LABELS[product.category] || (product.category ? String(product.category).replace(/-/g, ' ') : 'Product'));
  const shownBrand = brandOf(product) || product.brand || '';
  // Something she added herself (not in the catalog yet): no page to open
  // and no facts to show, so the card says whose it is and stays put.
  const isMine = product.userAdded === true;
  // One anatomy everywhere (src/utils/productCardFacts.js, shared with the app card),
  // fixed slots in the PDP build brief's order: plate + sticker → brand · name →
  // match + reason → price, per use, sizes → facts → evidence + safety → tag + heart.
  const price = cardPrice(product);
  const badgeText = isMine ? '' : cardBadge(product, { partner: partnerMark });
  const kind = !isMine && shownBrand ? cardKind(product) : '';
  const hasMatch = !isMine && Number.isFinite(matchPercent) && matchPercent > 0;
  // Slot 7: one tag (Pre-order, Sponsored or ayna partner) beside the heart.
  const sticker = !isMine ? kind || categoryLabel : '';
  const showSeeMatch = !isMine && !hasMatch && !matchHold && typeof onSeeMatch === 'function';
  const open = (e) => {
    if (!isPlainLeftClick(e)) return;
    e.preventDefault();
    // The star line is the way to the reviews: the page opens on Reviews.
    if (e.target?.closest?.('.ay-pcard__rating')) requestProductTab('reviews');
    onOpen?.(product);
  };
  return (
    <article data-pid={product.id} className={`ay-pcard${inEcosystem ? ' is-in-eco' : ''}${isSaved ? ' is-saved' : ''}${hasMatch ? ' has-fit' : ''} ${className}`.trim()} style={style}>
      {/* 1. The product on its plate, same scale on every card, with one category sticker. */}
      <Plate className="ay-pcard__plate" saved={isSaved} sticker={sticker || null}>
        {tile || <ProductTileImage product={product} alt={productImageAlt(product)} letterNode={<PlateName product={product} />} />}
      </Plate>
      {/* 2. Brand · name. The name is the link; it covers the whole card. */}
      <p className="ay-pcard__brand">{isMine ? categoryLabel : (shownBrand || categoryLabel)}</p>
      <h3 className="ay-pcard__name" title={product.name}>
        {isMine
          ? <span className="ay-pcard__link is-static">{product.name}</span>
          : <a className="ay-pcard__link" href={productHref(product)} onClick={open}>{shownBrand ? displayName(product) : product.name}</a>}
      </h3>
      {/* 3. Her match and why, outside the open-the-product link: tapping it opens Why this match. */}
      {(hasMatch || (matchHold && !isMine)) && (
        <div className="ay-pcard__fit">
          <MatchPill
            hold={!hasMatch && matchHold}
            percent={matchPercent}
            size="sm"
            className="ay-pcard__pill"
            label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${product.name}` : `Safety hold, match unavailable for ${product.name}`}
            onClick={() => {
              if (onShowWhy) { onShowWhy(product); return; }
              requestProductTab('why');
              if (onOpen) onOpen(product);
              else window.location.assign(productHref(product));
            }}
          />
          {why && <span className="ay-pcard__why">{why}</span>}
        </div>
      )}
      {showSeeMatch && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(product)}>See your match <span aria-hidden="true">→</span></button>}
      {badge}
      {/* 4. Price with its unit, the per-use chip and the real size pills. */}
      {!isMine && (
        <div className="ay-pcard__price">
          {isKnownPrice(price.main) && <span className="ay-pcard__amount">{price.main}{price.sub && (/^list\s+\$/i.test(price.sub)
            ? (() => { const [was, ...rest] = price.sub.replace(/^list\s+/i, '').split(/\s+·\s+/); return <small><span className="sr-only">List price </span><s>{was}</s>{rest.length > 0 && <span> {rest.join(' · ')}</span>}</small>; })()
            : <small>{price.sub}</small>)}</span>}
          <PriceExtras product={product} />
        </div>
      )}
      {/* Stars once there are 3 or more reviews (Explore audit v3, section 12). */}
      {rating && Number.isFinite(rating.value) && rating.count >= 3 && (
        <a className="ay-pcard__rating" href={productHref(product)} onClick={open}><span aria-hidden="true">★</span> <span className="sr-only">Rated </span>{formatAverage(rating.value)}<span className="sr-only"> out of 5</span> · <u>{rating.count} review{rating.count === 1 ? '' : 's'}</u></a>
      )}
      {/* 5. Facts from the record. 6. Evidence mark and the safety icon. */}
      {!isMine && <FactChips product={product} />}
      {!isMine && <EvidenceRow product={product} />}
      {/* 7. The one tag and the save heart. Ownership reads as text, never over the photo. */}
      <div className="ay-pcard__foot">
        <span className="ay-pcard__tags">
          {badgeText && <span className={`ay-pcard__tag${badgeText === 'Pre-order' ? ' is-alert' : ''}`}>{badgeText}</span>}
          {inEcosystem && <span className="ay-pcard__tag is-eco"><CheckIcon size={14} />{IN_ROUTINE}</span>}
          {labels}
        </span>
        {onToggleSaved && (
          <button
            type="button"
            className="ay-pcard__heart"
            aria-label={isSaved ? `Remove ${product.name} from Saved` : `Save ${product.name}`}
            aria-pressed={isSaved}
            data-tip={isSaved ? 'Saved' : 'Save'}
            onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
          </button>
        )}
      </div>
      {action && <div className="ay-pcard__action">{action}</div>}
      <CompareCheck product={product} />
    </article>
  );
}
