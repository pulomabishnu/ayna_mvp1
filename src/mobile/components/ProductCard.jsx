import { getProfileMatchPercentForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import ProductImage from './ProductImage.jsx';

const PARTNER_LABEL_STYLE = {
  position: 'absolute',
  zIndex: 2,
  top: 10,
  left: 10,
  padding: '4px 7px',
  borderRadius: 8,
  background: 'rgba(255,252,249,.94)',
  border: '1px solid var(--ayna-border)',
  fontSize: 'calc(10px * var(--ayna-text-scale, 1))',
  fontWeight: 600,
  lineHeight: 1,
  color: 'var(--ayna-text-muted)',
};

function labelForCategory(category) {
  if (!category) return '';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function shortPrice(price) {
  const s = String(price || '').trim();
  if (!s) return '';
  const m = s.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  if (m) return m[1];
  return s.split(/[,(]| for /i)[0].trim();
}

function MatchLine({ percent, onOpenWhyMatch, onStartQuiz }) {
  if (percent == null) {
    return (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onStartQuiz?.(); }}
        style={{
          border: 0,
          background: 'transparent',
          color: 'var(--ayna-text-muted)',
          padding: 0,
          minHeight: 24,
          fontSize: 'calc(11px * var(--ayna-text-scale, 1))',
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        See your match
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onOpenWhyMatch?.(); }}
      style={{
        border: 0,
        background: 'transparent',
        color: 'var(--ayna-accent-dark)',
        padding: 0,
        minHeight: 24,
        fontSize: 'calc(12px * var(--ayna-text-scale, 1))',
        fontWeight: 700,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {percent}% match <span aria-hidden="true" style={{ color: 'var(--ayna-text-faint)', fontWeight: 600 }}>· Why</span>
    </button>
  );
}

export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, onOpenWhyMatch, onStartQuiz }) {
  const { name, category, price, priceDisplay, userRating, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const openWhyMatch = onOpenWhyMatch ? () => onOpenWhyMatch(product) : undefined;
  const isPartner = isPartnerBrandItem(product);

  if (variant === 'list') {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: 12,
          borderRadius: 12,
          cursor: 'pointer',
          background: 'var(--ayna-surface)',
          border: '1px solid var(--ayna-border)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 64,
            height: 64,
            flex: 'none',
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--ayna-bg-alt)',
          }}
        >
          <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} compact />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <MatchLine percent={matchPercent} onOpenWhyMatch={openWhyMatch} onStartQuiz={onStartQuiz} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {name}
            </div>
            {resolvedPrice && (
              <div style={{ flex: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', whiteSpace: 'nowrap' }}>
                {resolvedPrice}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, minHeight: 16 }}>
            {isPartner && <span style={{ fontSize: 'calc(10px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)' }}>Partner</span>}
            {category && <span style={{ fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>{labelForCategory(category)}</span>}
            {userRating != null && <span style={{ marginLeft: 'auto', fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>★ {userRating}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ayna-surface)',
        border: '1px solid var(--ayna-border)',
        borderRadius: 14,
        padding: 12,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--ayna-bg-alt)',
        }}
      >
        <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} />
        {isPartner && <div style={PARTNER_LABEL_STYLE}>Partner</div>}
      </div>

      <div style={{ marginTop: 10 }}>
        <MatchLine percent={matchPercent} onOpenWhyMatch={openWhyMatch} onStartQuiz={onStartQuiz} />
      </div>

      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 600,
          fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
          lineHeight: 1.3,
          marginTop: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, minHeight: 18 }}>
        {resolvedPrice && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>{resolvedPrice}</div>
        )}
        {userRating != null && (
          <div style={{ marginLeft: 'auto', fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>★ {userRating}</div>
        )}
      </div>
    </div>
  );
}
