import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { getBuyUrl } from '../data/buyUrl.js';
import ProductImage from './ProductImage.jsx';
import '../shop-card.css';
import { displayName } from '../utils/displayName.js';
import { brandOf } from '../data/brandFallback.js';

function shortPrice(price) {
  const value = String(price || '').trim();
  if (!value) return '';
  const amount = value.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  return amount ? amount[1] : value.split(/[,(]| for /i)[0].trim();
}

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, isSaved = false, onToggleSaved, onOpenWhyMatch }) {
  const { name, category, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const hasDisplayPrice = /[$€£]|^free\b/i.test(resolvedPrice);
  const shownBrand = brandOf(product);
  const brandRepeatsName = shownBrand && String(name || '').trim().toLowerCase() === shownBrand.toLowerCase();
  // Brand only — never fall back to the category word ("Pad") in the brand slot.
  const secondaryLabel = shownBrand || '';
  const match = quizAnswers ? getProductMatchDetailsForProduct(product, quizAnswers) : null;
  const showMatch = match?.matchStatus === 'scored' && Number.isFinite(match.percent);
  const relevantReason = match?.matchStatus === 'scored' && !showMatch
    ? match.reasonDetails?.find((reason) => ['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency', 'diagnoses', 'lifeStage'].includes(reason.component))
    : null;
  const isService = product?.type === 'digital' || category === 'telehealth';
  const isPartner = isPartnerBrandItem(product);
  const buyUrl = getBuyUrl(product);
  const isList = variant === 'list';
  const contexts = isList ? [['doctor', 'Clinical'], ['scientific', 'Research'], ['community', 'Community']]
    .filter(([kind]) => getVerificationLinks(product, kind).some((link) => link?.url || link?.href))
    .map(([, label]) => label) : [];
  const functions = product?.healthFunctions || [];
  const tone = functions.some((item) => ['perimenopause', 'hormone-balance'].includes(item)) || ['telehealth', 'digital', 'therapy', 'tracker'].includes(category) || isService ? 'lilac'
    : functions.includes('fertility') || ['diagnostics', 'supplement', 'vitamin'].includes(category) ? 'lime'
      : ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'pelvic-floor'].includes(category) ? 'mint' : 'pink';

  return (
    <article className={`ayna-fresh-product-card ${isList ? 'is-list' : ''} tone-${tone}`}>
      <button type="button" className="ayna-fresh-product-main" onClick={onClick} aria-label={`${name}${hasDisplayPrice ? `, ${resolvedPrice}` : ''}${showMatch ? `, ${match.percent} percent match` : ''}. View product details`}>
      <span className="ayna-fresh-product-image">
        <ProductImage src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
      </span>
      <span className="ayna-fresh-product-copy">
        {isList && <span className="ayna-fresh-product-category" aria-hidden={secondaryLabel ? undefined : true}>{secondaryLabel || '\u00a0'}{isPartner ? ' / Partner' : ''}</span>}
        <strong>{brandRepeatsName ? name : displayName(product)}</strong>
        {isList && relevantReason && <span className="ayna-fresh-product-reason">{relevantReason.text}</span>}
        {!isList && <small className="ayna-card-brand" aria-hidden={secondaryLabel && !brandRepeatsName ? undefined : true}>{secondaryLabel && !brandRepeatsName ? secondaryLabel : '\u00a0'}</small>}
        <span className="ayna-fresh-product-foot">{hasDisplayPrice ? <b>{resolvedPrice}</b> : <b className="is-muted">See details</b>}</span>
        {contexts.length > 0 && <span className="ayna-fresh-product-context">{contexts.join(' · ')}</span>}
      </span>
      </button>
      {showMatch && <button type="button" className="ayna-fresh-match-badge ayna-match-action" aria-label={`Why ${match.percent} percent match for ${name}`} onClick={() => onOpenWhyMatch ? onOpenWhyMatch(product) : onClick?.()}><strong>{match.percent}%</strong><span>MATCH</span></button>}
      {onToggleSaved && <button type="button" className="ayna-card-save" aria-label={`${isSaved ? 'Unsave' : 'Save'} ${name}`} aria-pressed={isSaved} onClick={() => onToggleSaved(product)}><svg viewBox="0 0 24 24" aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'}><path d="M6 4h12v16l-6-4-6 4V4Z" /></svg></button>}
      {isList && <div className="ayna-fresh-product-actions">
        <button type="button" onClick={onClick}>Details <span aria-hidden="true">→</span></button>
        {buyUrl && <a href={buyUrl} target="_blank" rel="noopener noreferrer sponsored" aria-label={`Shop ${name} on the seller's site`}>{isService ? 'Explore care' : 'Shop'} <span aria-hidden="true">↗</span></a>}
      </div>}
      {isList && buyUrl && <small className="ayna-fresh-product-seller-note">{isPartner ? 'Partner link · ' : ''}Opens seller site</small>}
    </article>
  );
}
