import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import ProductImage from './ProductImage.jsx';

function labelForCategory(category) {
  if (!category) return '';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function shortPrice(price) {
  const value = String(price || '').trim();
  if (!value) return '';
  const amount = value.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  return amount ? amount[1] : value.split(/[,(]| for /i)[0].trim();
}

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null }) {
  const { name, brand, category, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const categoryLabel = labelForCategory(category);
  const secondaryLabel = brand && !String(name || '').toLowerCase().startsWith(brand.toLowerCase()) ? brand : categoryLabel;
  const match = quizAnswers ? getProductMatchDetailsForProduct(product, quizAnswers) : null;
  const showMatch = match?.matchStatus === 'scored' && match.percent >= 60;
  const relevantReason = match?.matchStatus === 'scored' && !showMatch
    ? match.reasonDetails?.find((reason) => ['primaryGoal', 'otherNeeds', 'periodFlow', 'periodPain', 'utiFrequency', 'diagnoses', 'lifeStage'].includes(reason.component))
    : null;
  const isService = product?.type === 'digital' || category === 'telehealth';
  const isPartner = isPartnerBrandItem(product);
  const isList = variant === 'list';
  const contexts = [['doctor', 'Clinical'], ['scientific', 'Research'], ['community', 'Community']]
    .filter(([kind]) => getVerificationLinks(product, kind).some((link) => link?.url || link?.href))
    .map(([, label]) => label);
  const tone = ['pad', 'tampon', 'cup', 'disc', 'period-underwear'].includes(category) ? 'mint'
    : ['telehealth', 'digital', 'therapy'].includes(category) || isService ? 'lilac'
      : ['supplement', 'vitamin'].includes(category) ? 'lime' : 'pink';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${name}${resolvedPrice ? `, ${resolvedPrice}` : ''}${showMatch ? `, ${match.percent} percent match` : ''}. View product details`}
      className={`ayna-fresh-product-card ${isList ? 'is-list' : ''} tone-${tone}`}
    >
      <span className="ayna-fresh-product-image">
        {showMatch && <span className="ayna-fresh-match-badge">{match.percent}% match</span>}
        <ProductImage src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
      </span>
      <span className="ayna-fresh-product-copy">
        <span className="ayna-fresh-product-category">{secondaryLabel}{isPartner ? ' / Partner' : ''}</span>
        <strong>{name}</strong>
        {relevantReason && <span className="ayna-fresh-product-reason">{relevantReason.text}</span>}
        <span className="ayna-fresh-product-foot"><b>{resolvedPrice || 'See details'}</b><span aria-hidden="true">↗</span></span>
        {contexts.length > 0 && <span className="ayna-fresh-product-context">{contexts.join(' · ')}</span>}
      </span>
    </button>
  );
}
