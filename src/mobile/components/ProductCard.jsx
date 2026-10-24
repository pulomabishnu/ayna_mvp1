import { productMatch } from '../utils/matchScore.js';
import { trackApp } from '../utils/appAnalytics.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { getBuyUrl } from '../data/buyUrl.js';
import ProductImage from './ProductImage.jsx';
import '../shop-card.css';
import { displayName } from '../utils/displayName.js';
import { brandOf } from '../data/brandFallback.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { HEART_PATH } from '../utils/heart.js';
import { matchBadge } from '../../utils/matchDisplay.js';
import MatchPill from '../../components/MatchPill.jsx';
import { saveFeedback } from '../../utils/feedback.js';
import { whyLine } from '../../utils/whyLine.js';
import HealthBackedBadge from '../../components/health/HealthBackedBadge.jsx';
import { cardKind, cardBadge, cardPrice } from '../../utils/productCardFacts.js';
import { CompareCheck } from '../../components/compare/CompareControls.jsx';

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, isSaved = false, onToggleSaved, onOpenWhyMatch, matchOpts, needId = null }) {
  const { name, category, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  // Same price model as the website card: short main line + optional detail line.
  const shownPrice = formatPrice({ ...product, price: price || priceDisplay });
  const hasDisplayPrice = shownPrice.main !== 'Price at retailer';
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
  // The % explained in one plain line from the engine's reasons (src/utils/whyLine.js).
  const why = showMatch ? whyLine(product, match) : '';
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
    // Same anatomy and words as the website card (src/utils/productCardFacts.js):
    // tile + heart → brand → name (2 lines) → kind + one badge → price + unit → match.
    const kind = cardKind(product);
    const oneBadge = cardBadge(product);
    const facts = cardPrice({ ...product, price: price || priceDisplay });
    return (
      <article className="ay-pc">
        <button type="button" className="ay-pc-main" onClick={onClick} aria-label={`${name}, ${facts.main}${facts.sub ? ` ${facts.sub}` : ''}${oneBadge ? `, ${oneBadge}` : ''}${showMatch ? `, ${badge.label}` : ''}. View product details`}>
          <span className="ay-pc-photo">
            <ProductImage product={product} src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
          </span>
          <span className="ay-pc-copy">
            <small className="ay-pc-brand" aria-hidden={showBrand ? undefined : true}>{showBrand ? secondaryLabel : '\u00a0'}</small>
            <strong className="ay-pc-name">{brandRepeatsName ? name : displayName(product)}</strong>
            <span className="ay-pc-kind" aria-hidden="true">{kind && <span className="ay-pc-kindtext">{kind}</span>}{oneBadge && <span className={`ay-pc-mark${oneBadge === 'Pre-order' ? ' is-alert' : ''}`}>{oneBadge}</span>}{!kind && !oneBadge && '\u00a0'}</span>
            <span className="ay-pc-price">{facts.main !== 'Price at retailer' ? <b>{facts.main}</b> : <b className="is-muted">{facts.main}</b>}{facts.sub && <small className="ay-pc-unit">{facts.sub}</small>}</span>
            {why && <small className="ay-pc-why">{why}</small>}
            {healthBacked && <HealthBackedBadge backed={healthBacked} className="ay-pc-hbadge" />}
          </span>
        </button>
        {showMatch && <MatchPill percent={badge.percent} size="sm" className="ay-pc-match" label={`${badge.label}. Why this match for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
        {onToggleSaved && <button type="button" className={`ay-pc-save${isSaved ? ' is-on' : ''}`} aria-label={isSaved ? `Remove ${name} from Saved` : `Save ${name}`} aria-pressed={isSaved} onClick={(e) => { saveFeedback(e, !isSaved); onToggleSaved(product); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg></button>}
        <CompareCheck product={product} />
      </article>
    );
  }

  return (
    <article className={`ayna-fresh-product-card ${isList ? 'is-list' : ''} tone-${tone}`}>
      <button type="button" className="ayna-fresh-product-main" onClick={onClick} aria-label={`${name}, ${shownPrice.main}${shownPrice.sub ? ` ${shownPrice.sub}` : ''}${showMatch ? `, ${badge.label}` : ''}. View product details`}>
      <span className="ayna-fresh-product-image">
        <ProductImage product={product} src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
      </span>
      <span className="ayna-fresh-product-copy">
        {isList && <span className="ayna-fresh-product-category" aria-hidden={secondaryLabel ? undefined : true}>{secondaryLabel || '\u00a0'}{isPartner ? ' / Partner' : ''}</span>}
        <strong>{brandRepeatsName ? name : displayName(product)}</strong>
        {isList && (why || relevantReason) && <span className="ayna-fresh-product-reason">{why || relevantReason.text}</span>}
        {!isList && <small className="ayna-card-brand" aria-hidden={secondaryLabel && !brandRepeatsName ? undefined : true}>{secondaryLabel && !brandRepeatsName ? secondaryLabel : '\u00a0'}</small>}
        <span className="ayna-fresh-product-foot">{hasDisplayPrice ? <b>{shownPrice.main}</b> : <b className="is-muted">{shownPrice.main}</b>}</span>
        {!isList && <small className="ayna-card-price-sub" aria-hidden={shownPrice.sub ? undefined : true}>{shownPrice.sub || '\u00a0'}</small>}
        {isPartner && !isList && <small className="ay-card-partner">ayna partner</small>}
        {contexts.length > 0 && <span className="ayna-fresh-product-context">{contexts.join(' · ')}</span>}
      </span>
      </button>
      {showMatch && <MatchPill percent={badge.percent} size="sm" className="ayna-fresh-match-badge ayna-match-action" label={`${badge.label}. Why this match for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()} />}
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
