import { productMatch } from '../utils/matchScore.js';
import { trackApp } from '../utils/appAnalytics.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { getBuyUrl } from '../data/buyUrl.js';
import ProductImage from './ProductImage.jsx';
import '../shop-card.css';
import { displayName } from '../utils/displayName.js';
import { brandOf } from '../data/brandFallback.js';
import { formatPrice, isKnownPrice, shownPriceText } from '../../utils/formatPrice.js';
import { HEART_PATH } from '../utils/heart.js';
import { matchBadge, isSafetyHold, SAFETY_HOLD, MATCH_UNAVAILABLE } from '../../utils/matchDisplay.js';
import MatchPill from '../../components/MatchPill.jsx';
import { saveFeedback } from '../../utils/feedback.js';
import { whyLine } from '../../utils/whyLine.js';
import { cardKind, cardMeta, cardPrice } from '../../utils/productCardFacts.js';
import { CompareCheck } from '../../components/compare/CompareControls.jsx';
import { matchBreakdownFor } from '../../components/pdp/decision.js';
import { PlateName, SafetyTag } from '../../components/cards/CardBits.jsx';

// Whole card opens the product: a click anywhere that isn't its own button or link
// forwards to the card's one link (keyboard users still reach that link directly).
function openFromCard(e) {
  if (e.defaultPrevented || e.target?.closest?.('a, button, input, select, textarea, label, [role="button"]')) return;
  const link = e.currentTarget.querySelector('.ay-pcard__link:not(.is-static)');
  if (link) link.click();
}

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, isSaved = false, onToggleSaved, onOpenWhyMatch, matchOpts, needId = null, onSeeMatch = null }) {
  const { name, category, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  // Same price model as the website card: short main line + optional detail line.
  const shownPrice = formatPrice({ ...product, price: price || priceDisplay });
  const shownBrand = brandOf(product);
  const brandRepeatsName = shownBrand && String(name || '').trim().toLowerCase() === shownBrand.toLowerCase();
  // Brand only, never fall back to the category word ("Pad") in the brand slot.
  const secondaryLabel = shownBrand || '';
  // One score per product everywhere (utils/matchScore): the shelf's needId only
  // decides whether the label may name that need, never the number.
  const match = productMatch(product, quizAnswers, matchOpts);
  // Badge = her best need score, only with a profile and 50+ ("82% for period cramps").
  const badge = matchBadge(match, { needId });
  const showMatch = Boolean(badge);
  // Held back for safety: "Safety hold" in place of a number (never 0%).
  const held = !badge && isSafetyHold(match);
  // The % explained in one plain line from the engine's reasons (src/utils/whyLine.js).
  // The reason line from the one engine's breakdown (src/matching), else the why line.
  const why = showMatch ? (matchBreakdownFor(product, match).reason || whyLine(product, match)) : '';
  const relevantReason = match?.matchStatus === 'scored' && !showMatch
    ? match.reasonDetails?.find((reason) => ['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency', 'diagnoses', 'lifeStage'].includes(reason.component))
    : null;
  const isService = product?.type === 'digital' || category === 'telehealth';
  const isPartner = isPartnerBrandItem(product);
  const buyUrl = getBuyUrl(product);
  const isList = variant === 'list';
  const contexts = isList ? [['doctor', 'Clinical'], ['scientific', 'Evidence'], ['community', 'Community']]
    .filter(([kind]) => getVerificationLinks(product, kind).some((link) => link?.url || link?.href))
    .map(([, label]) => label) : [];
  const functions = product?.healthFunctions || [];
  const tone = functions.some((item) => ['perimenopause', 'hormone-balance'].includes(item)) || ['telehealth', 'digital', 'therapy', 'tracker'].includes(category) || isService ? 'lilac'
    : functions.includes('fertility') || ['diagnostics', 'supplement', 'vitamin'].includes(category) ? 'lime'
      : ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'pelvic-floor'].includes(category) ? 'mint' : 'pink';

  // Grid card (Shop grid, Ecosystem shelves, search, Saved): one compact card
  // app-wide. Its own class names so the older card rules don't reach it.
  if (!isList) {
    const showBrand = secondaryLabel && !brandRepeatsName;
    // The founder's card (Oct 27, "perfect"), same as the website card: square photo →
    // meta line (Pre-order pill, brand · ayna partner · FSA/HSA) → name → category →
    // price (+ her match) → heart. Words from src/utils/productCardFacts.js.
    const kind = cardKind(product);
    const meta = cardMeta(product);
    const facts = cardPrice({ ...product, price: price || priceDisplay });
    // Unknown price: nothing printed (QA3 M8). Pre-order: the pill says it, no "Coming soon" line.
    const knownPrice = !meta.preorder && isKnownPrice(facts.main);
    const oneBadge = meta.preorder ? 'Pre-order' : meta.sponsored ? 'Sponsored' : meta.partner ? 'ayna partner' : '';
    const openWhy = () => (onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.());
    return (
      <article onClick={openFromCard} data-pid={product.id} className={`ay-pcard${variant === 'row' ? ' is-row' : ''}${isSaved ? ' is-saved' : ''}${onToggleSaved ? ' has-heart' : ''}`}>
        <div className="ay-pcard__body">
          <p className="ay-pcard__meta">
            {meta.preorder && <span className="ay-pcard__pre">Pre-order</span>}
            {showBrand && <span className="ay-pcard__brand">{secondaryLabel}</span>}
            {meta.sponsored && <span className="ay-pcard__mark">Sponsored</span>}
            {meta.partner && <span className="ay-pcard__mark">ayna partner</span>}
            {meta.tax && <span className="ay-pcard__mark">{meta.tax}</span>}
          </p>
          {/* The button is the card's one link; the whole card opens it. */}
          <strong className="ay-pcard__name">
            <button type="button" className="ay-pc-main ay-pcard__link" onClick={onClick} aria-label={`${name}${knownPrice ? `, ${facts.main}${facts.sub ? ` ${facts.sub}` : ''}` : ''}${oneBadge ? `, ${oneBadge}` : ''}${showMatch ? `, ${badge.label}` : ''}. View product details`}>{brandRepeatsName ? name : displayName(product)}</button>
          </strong>
          {kind && <p className="ay-pcard__cat">{kind}</p>}
          {(knownPrice || showMatch || held) && (
            <span className="ay-pcard__price">
              {knownPrice && <span className="ay-pcard__amount">{facts.main}</span>}
              {showMatch && <MatchPill percent={badge.percent} size="sm" className="ay-pcard__pill" label={`${badge.label}. Why this match for ${name}`} onClick={openWhy} />}
              {held && <MatchPill hold size="sm" className="ay-pcard__pill" label={`${SAFETY_HOLD}, ${MATCH_UNAVAILABLE.toLowerCase()} for ${name}`} onClick={openWhy} />}
            </span>
          )}
          {!showMatch && !held && typeof onSeeMatch === 'function' && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(product)}>See your match <span aria-hidden="true">→</span></button>}
          <SafetyTag product={product} />
        </div>
        {/* The photo panel, drawn first (CSS order), after the text in reading order: the button names the card. */}
        <div className="ay-pcard__photo">
          <ProductImage product={product} src={resolvedImage} alt="" allowBrandLogo={isService} fallback={<PlateName product={product} />} />
        </div>
        {onToggleSaved && <button type="button" className="ay-pcard__heart" aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved} onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg></button>}
        <CompareCheck product={product} />
      </article>
    );
  }

  return (
    <article className={`ayna-fresh-product-card ${isList ? 'is-list' : ''} tone-${tone}`}>
      <button type="button" className="ayna-fresh-product-main" onClick={onClick} aria-label={`${name}${isKnownPrice(shownPrice.main) ? `, ${shownPrice.main}${shownPrice.sub ? ` ${shownPrice.sub}` : ''}` : ''}${showMatch ? `, ${badge.label}` : ''}. View product details`}>
      <span className="ayna-fresh-product-image">
        <ProductImage product={product} src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
      </span>
      <span className="ayna-fresh-product-copy">
        {isList && <span className="ayna-fresh-product-category" aria-hidden={secondaryLabel ? undefined : true}>{secondaryLabel || '\u00a0'}{isPartner ? ' / Partner' : ''}</span>}
        <strong>{brandRepeatsName ? name : displayName(product)}</strong>
        {isList && (why || relevantReason) && <span className="ayna-fresh-product-reason">{why || relevantReason.text}</span>}
        {!isList && <small className="ayna-card-brand" aria-hidden={secondaryLabel && !brandRepeatsName ? undefined : true}>{secondaryLabel && !brandRepeatsName ? secondaryLabel : '\u00a0'}</small>}
        <span className="ayna-fresh-product-foot">{shownPriceText(shownPrice.main) && <b>{shownPrice.main}</b>}</span>
        {!isList && <small className="ayna-card-price-sub" aria-hidden={shownPrice.sub ? undefined : true}>{shownPrice.sub || '\u00a0'}</small>}
        {isPartner && !isList && <small className="ay-card-partner">ayna partner</small>}
        {contexts.length > 0 && <span className="ayna-fresh-product-context">{contexts.join(' · ')}</span>}
      </span>
      </button>
      {showMatch && <MatchPill percent={badge.percent} size="sm" className="ayna-fresh-match-badge ayna-match-action" label={`${badge.label}. Why this match for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
      {held && <MatchPill hold size="sm" className="ayna-fresh-match-badge ayna-match-action" label={`${SAFETY_HOLD}, ${MATCH_UNAVAILABLE.toLowerCase()} for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
      {onToggleSaved && <button type="button" className="ayna-card-save" aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved} onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg></button>}
      {isList && <div className="ayna-fresh-product-actions">
        <button type="button" onClick={onClick}>Details</button>
        {buyUrl && <a href={buyUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => trackApp('product_buy_now_clicked', { productId: product?.id, category: product?.category, placement: 'product_card' })} aria-label={`Buy ${name} on the seller's site`}>{isService ? 'See care options' : 'Buy'} <span aria-hidden="true">↗</span></a>}
      </div>}
      {isList && buyUrl && <small className="ayna-fresh-product-seller-note">{isPartner ? 'Partner link. ' : ''}Opens the seller’s site</small>}
      <CompareCheck product={product} />
    </article>
  );
}
