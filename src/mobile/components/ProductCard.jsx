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
import HealthBackedBadge from '../../components/health/HealthBackedBadge.jsx';
import { cardKind, cardBadge, cardPrice } from '../../utils/productCardFacts.js';
import { CompareCheck } from '../../components/compare/CompareControls.jsx';
import { matchBreakdownFor } from '../../components/pdp/decision.js';
import { PlateName, PriceExtras, FactChips, EvidenceRow } from '../../components/cards/CardBits.jsx';
import { Plate } from '../../components/ui/ay';

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
  // "Backed by your sleep data": her connected data supports the need this card is shown for.
  const backedBy = showMatch ? match?.needMatches?.find((m) => m.needId === (needId || match.needId))?.healthData : null;
  const healthBacked = backedBy ? { section: backedBy.section, tracker: ['tracker', 'wearable'].includes(String(category || '').toLowerCase()) } : null;
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
    // Same fixed slots and words as the website card (src/utils/productCardFacts.js,
    // components/cards/CardBits.jsx): plate + sticker → brand · name → match + reason →
    // price, per use, sizes → facts → evidence + safety → tag + heart.
    const kind = cardKind(product);
    const oneBadge = cardBadge(product);
    const facts = cardPrice({ ...product, price: price || priceDisplay });
    const sticker = kind || '';
    // Unknown price: nothing printed (QA3 M8), never "Price at retailer".
    const knownPrice = isKnownPrice(facts.main);
    return (
      <article data-pid={product.id} className={`ay-pcard${variant === 'row' ? ' is-row' : ''}${isSaved ? ' is-saved' : ''}`}>
        {/* 2. Brand · name. The button covers the card (same as the website's link). */}
        <small className="ay-pcard__brand" aria-hidden={showBrand ? undefined : true}>{showBrand ? secondaryLabel : '\u00a0'}</small>
        <strong className="ay-pcard__name">
          <button type="button" className="ay-pc-main ay-pcard__link" onClick={onClick} aria-label={`${name}${knownPrice ? `, ${facts.main}${facts.sub ? ` ${facts.sub}` : ''}` : ''}${oneBadge ? `, ${oneBadge}` : ''}${showMatch ? `, ${badge.label}` : ''}. View product details`}>{brandRepeatsName ? name : displayName(product)}</button>
        </strong>
        {/* 1. The product on its plate, same scale everywhere, with one category sticker (drawn first: CSS order). */}
        <Plate className="ay-pcard__plate" saved={isSaved} sticker={sticker || null}>
          <ProductImage product={product} src={resolvedImage} alt="" allowBrandLogo={isService} fallback={<PlateName product={product} />} />
        </Plate>
        {/* 3. Match + reason (from the one engine's breakdown). */}
        {(showMatch || held) && (
          <span className="ay-pcard__fit">
            {showMatch && <MatchPill percent={badge.percent} size="sm" label={`${badge.label}. Why this match for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
            {held && <MatchPill hold size="sm" label={`${SAFETY_HOLD}, ${MATCH_UNAVAILABLE.toLowerCase()} for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
            {why && <small className="ay-pcard__why">{why}</small>}
          </span>
        )}
        {!showMatch && !held && typeof onSeeMatch === 'function' && <button type="button" className="ay-pcard__seematch" onClick={() => onSeeMatch(product)}>See your match <span aria-hidden="true">→</span></button>}
        {healthBacked && <HealthBackedBadge backed={healthBacked} className="ay-pc-hbadge" />}
        {/* 4. Price + unit, per use, sizes. 5. Facts. 6. Evidence + safety. */}
        <span className="ay-pcard__price">
          {knownPrice && <span className="ay-pcard__amount"><b>{facts.main}</b>{facts.sub && <small>{facts.sub}</small>}</span>}
          <PriceExtras product={product} />
        </span>
        <FactChips product={product} />
        <EvidenceRow product={product} />
        {/* 7. The one tag and the save heart. */}
        <span className="ay-pcard__foot">
          <span className="ay-pcard__tags">{oneBadge && <span className={`ay-pcard__tag${oneBadge === 'Pre-order' ? ' is-alert' : ''}`}>{oneBadge}</span>}</span>
          {onToggleSaved && <button type="button" className="ay-pcard__heart" aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved} onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg></button>}
        </span>
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
