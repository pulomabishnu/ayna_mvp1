import React from 'react';
import { CheckIcon } from './icons/UiIcons.jsx';
import { CATEGORY_LABELS } from '../data/catalogTaxonomy.js';
import { cardKind, cardMeta, cardPrice } from '../utils/productCardFacts.js';
import { isKnownPrice } from '../utils/formatPrice.js';
import { sentenceCase } from '../utils/sentenceCase.js';
import { productHref, isPlainLeftClick } from '../utils/productRoute';
import ProductTileImage from './ProductTileImage';
import { PlateName, SafetyTag } from './cards/CardBits.jsx';
import MatchPill from './MatchPill';
import { matchText } from '../utils/matchDisplay.js';
import '../styles/card-fit.css';
import { displayName } from '../mobile/utils/displayName.js';
import { requestProductTab } from '../utils/community/reviewRatings.js';
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
// Whole card opens the product: a click anywhere that isn't its own button or link
// forwards to the card's one link (keyboard users still reach that link directly).
function openFromCard(e) {
  if (e.defaultPrevented || e.target?.closest?.('a, button, input, select, textarea, label, [role="button"]')) return;
  const link = e.currentTarget.querySelector('.ay-pcard__link:not(.is-static)');
  if (link) link.click();
}

export default function ProductCard({
  product,
  matchPercent = null,
  // Held back for safety: "Safety hold" instead of any number (founder, Oct 24).
  matchHold = false,
  // "82% for period cramps": accessible name for the match pill (no tooltip).
  matchLabel = '',
  // (The reason line `why` and review `rating` are no longer read: glance cards leave them to the product page, founder Oct 26 16:54.)
  isSaved = false,
  inEcosystem = false,
  labels = null,
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
  // The founder's card (Oct 27, "perfect"): square photo → meta line (Pre-order pill,
  // brand · ayna partner · FSA/HSA) → name → category → price (+ her match) → heart.
  const price = cardPrice(product);
  const meta = isMine ? { preorder: false, sponsored: false, partner: false, tax: '' } : cardMeta(product, { partner: partnerMark });
  const kind = !isMine ? (shownBrand ? cardKind(product) : categoryLabel) : '';
  const hasMatch = !isMine && Number.isFinite(matchPercent) && matchPercent > 0;
  const held = !isMine && !hasMatch && matchHold;
  // Pre-order: the pill already says it, so no "Coming soon · Waitlist" line (founder, Oct 27).
  const shownPrice = !isMine && !meta.preorder && isKnownPrice(price.main) ? price.main : '';
  const showSeeMatch = !isMine && !hasMatch && !matchHold && typeof onSeeMatch === 'function';
  const showWhy = () => {
    if (onShowWhy) { onShowWhy(product); return; }
    requestProductTab('why');
    if (onOpen) onOpen(product);
    else window.location.assign(productHref(product));
  };
  const open = (e) => {
    if (!isPlainLeftClick(e)) return;
    // No in-app opener: let the link navigate to the product page.
    if (typeof onOpen !== 'function') return;
    e.preventDefault();
    onOpen(product);
  };
  return (
    <article onClick={openFromCard} data-pid={product.id} className={`ay-pcard${inEcosystem ? ' is-in-eco' : ''}${isSaved ? ' is-saved' : ''}${hasMatch ? ' has-fit' : ''}${onToggleSaved ? ' has-heart' : ''} ${className}`.trim()} style={style}>
      {/* The square photo panel: the product on a light ground, a thin rule around it. */}
      <div className="ay-pcard__photo">
        {tile || <ProductTileImage product={product} alt={productImageAlt(product)} letterNode={<PlateName product={product} />} />}
      </div>
      <div className="ay-pcard__body">
        <p className="ay-pcard__meta">
          {meta.preorder && <span className="ay-pcard__pre">Pre-order</span>}
          <span className="ay-pcard__brand">{isMine ? categoryLabel : (shownBrand || categoryLabel)}</span>
          {meta.sponsored && <span className="ay-pcard__mark">Sponsored</span>}
          {meta.partner && <span className="ay-pcard__mark">ayna partner</span>}
          {meta.tax && <span className="ay-pcard__mark">{meta.tax}</span>}
          {inEcosystem && <span className="ay-pcard__mark is-eco"><CheckIcon size={13} />{IN_ROUTINE}</span>}
          {labels}
        </p>
        {/* The name is the link; the whole card opens it. */}
        <h3 className="ay-pcard__name" title={product.name}>
          {isMine
            ? <span className="ay-pcard__link is-static">{product.name}</span>
            : <a className="ay-pcard__link" href={productHref(product)} onClick={open}>{shownBrand ? displayName(product) : product.name}</a>}
        </h3>
        {kind && <p className="ay-pcard__cat">{kind}</p>}
        {(shownPrice || hasMatch || held) && (
          <div className="ay-pcard__price">
            {shownPrice && <span className="ay-pcard__amount">{shownPrice}</span>}
            {/* Her match, small beside the price; it opens Why this match. Safety hold: never a number. */}
            {(hasMatch || held) && (
              <MatchPill
                hold={held}
                percent={matchPercent}
                size="sm"
                className="ay-pcard__pill"
                label={hasMatch ? `${matchLabel || matchText(matchPercent)}. Why this match for ${product.name}` : `Safety hold, match unavailable for ${product.name}`}
                onClick={showWhy}
              />
            )}
          </div>
        )}
        {showSeeMatch && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(product)}>See your match <span aria-hidden="true">→</span></button>}
        {badge}
        {!isMine && <SafetyTag product={product} />}
      </div>
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
      {action && <div className="ay-pcard__action">{action}</div>}
      <CompareCheck product={product} />
    </article>
  );
}
