import { getProfileMatchPercentForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import ProductImage from './ProductImage.jsx';

function shortPrice(price) {
  const s = String(price || '').trim();
  if (!s) return '';
  const m = s.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  if (m) return m[1];
  return s.split(/[,(]| for /i)[0].trim();
}

function brandFor(product) {
  if (product?.brand) return product.brand;
  const first = String(product?.name || '').trim().split(/\s+/)[0];
  return first || '';
}

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, onOpenWhyMatch }) {
  const { name, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const isPartner = isPartnerBrandItem(product);
  const brand = brandFor(product);

  if (variant === 'list') {
    return (
      <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
        <div style={{ width: 62, height: 62, borderRadius: 14, overflow: 'hidden', background: 'var(--ayna-bg-alt)', flex: 'none' }}>
          <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} compact />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {brand && <div style={{ fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 4 }}>{brand}</div>}
          <div style={{ fontWeight: 650, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.25 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
            {resolvedPrice && <span style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{resolvedPrice}</span>}
            {matchPercent != null && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpenWhyMatch?.(product); }} style={{ border: 0, padding: 0, background: 'transparent', color: 'var(--ayna-mauve)', fontWeight: 700, fontSize: 'calc(11px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
                {matchPercent}% match
              </button>
            )}
          </div>
        </div>
        <span style={{ color: 'var(--ayna-text-faint)', fontSize: 20 }}>›</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{ cursor: 'pointer', minWidth: 0 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', borderRadius: 16, overflow: 'hidden', background: 'var(--ayna-bg-alt)' }}>
        <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} />
        {matchPercent != null && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onOpenWhyMatch?.(product); }} style={{ position: 'absolute', left: 8, top: 8, border: '1px solid rgba(255,255,255,.72)', borderRadius: 999, background: 'rgba(255,252,249,.92)', color: 'var(--ayna-purple)', padding: '5px 8px', fontWeight: 750, fontSize: 'calc(10px * var(--ayna-text-scale, 1))', backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
            {matchPercent}% match
          </button>
        )}
        {isPartner && (
          <div style={{ position: 'absolute', right: 8, top: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--ayna-terracotta)', boxShadow: '0 0 0 3px rgba(255,252,249,.82)' }} aria-label="ayna partner" />
        )}
      </div>
      <div style={{ padding: '9px 2px 0' }}>
        {brand && <div style={{ fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 4 }}>{brand}</div>}
        <div style={{ fontWeight: 650, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</div>
        {resolvedPrice && <div style={{ marginTop: 6, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{resolvedPrice}</div>}
      </div>
    </div>
  );
}
