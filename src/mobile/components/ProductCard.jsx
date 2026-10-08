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
  const sourceCount = new Set(['doctor', 'scientific', 'community']
    .flatMap((kind) => getVerificationLinks(product, kind))
    .map((link) => link?.url || link?.href)
    .filter(Boolean)).size;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${name}${resolvedPrice ? `, ${resolvedPrice}` : ''}${showMatch ? `, ${match.percent} percent match` : ''}. View product details`}
      style={{
        width: '100%', height: '100%', padding: isList ? 12 : 0, textAlign: 'left', cursor: 'pointer',
        border: isList ? '1px solid var(--ayna-border)' : 0, borderRadius: isList ? 14 : 0,
        background: isList ? 'var(--ayna-surface)' : 'transparent', color: 'var(--ayna-heading)',
        display: isList ? 'grid' : 'flex', gridTemplateColumns: isList ? '72px minmax(0,1fr)' : undefined,
        gap: isList ? 14 : undefined, flexDirection: isList ? undefined : 'column', minWidth: 0,
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <span style={{ position: 'relative', display: 'block', width: isList ? 72 : '100%', height: isList ? 72 : undefined, aspectRatio: isList ? undefined : '4 / 5', flex: 'none', overflow: 'hidden', borderRadius: 14, background: 'var(--ayna-bg-alt)' }}>
        <ProductImage src={resolvedImage} alt="" allowBrandLogo={isService} style={{ objectFit: 'contain' }} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: isList ? 0 : 12, flex: 1 }}>
        <span style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--ayna-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{secondaryLabel}</span>
        <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginTop: 4, minHeight: isList ? undefined : '2.6em', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{resolvedPrice || 'See details'}</span>
          {isPartner && <span style={{ fontSize: 12, color: 'var(--ayna-text-muted)' }}>Partner</span>}
        </span>
        {showMatch && <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: 'var(--ayna-heading)', marginTop: 8 }}>{match.percent}% match</span>}
        {relevantReason && <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 13, lineHeight: 1.35, color: 'var(--ayna-text-muted)', marginTop: 8 }}>{relevantReason.text}</span>}
        {sourceCount > 0 && <span style={{ fontSize: 12, lineHeight: 1.35, color: 'var(--ayna-text-muted)', marginTop: 8 }}>{sourceCount} linked source{sourceCount === 1 ? '' : 's'}</span>}
      </span>
    </button>
  );
}
