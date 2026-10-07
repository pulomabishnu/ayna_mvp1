import { getProfileMatchPercentForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import MatchRing from './MatchRing.jsx';
import ProductImage from './ProductImage.jsx';

const PARTNER_BADGE_STYLE = {
  position: 'absolute',
  zIndex: 2,
  padding: '4px 7px',
  borderRadius: 999,
  background: 'var(--ayna-surface)',
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

// Catalog `price` strings are often a full descriptive sentence (e.g.
// "$45.87 for 144 (4 Drop / Moderate Absorbency, Long)") — cards need just
// the short dollar amount, not the full description, so it never overflows
// a compact card. Falls back to the first comma/paren-delimited chunk for
// non-dollar cases like "Free (built into iPhone)" -> "Free".
function shortPrice(price) {
  const s = String(price || '').trim();
  if (!s) return '';
  const m = s.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  if (m) return m[1];
  return s.split(/[,(]| for /i)[0].trim();
}

/**
 * Two layouts, one component (per design: "Nebula" 2-up grid vs "Mission
 * control" dense list), switched via `variant` rather than duplicated —
 * both read the same real product fields, nothing is fetched twice.
 */
export default function ProductCard({ product, onClick, variant = 'grid', quizAnswers = null, onOpenWhyMatch, onStartQuiz }) {
  const { name, brand, category, price, priceDisplay, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const openWhyMatch = onOpenWhyMatch ? () => onOpenWhyMatch(product) : undefined;
  // Real brand-partnership flag (src/utils/partnerBrands.js) — same
  // pattern-match desktop's Discovery.jsx uses for its "Affiliate link"
  // card badge, just labeled "ayna Favorite" here per product's request.
  const isPartner = isPartnerBrandItem(product);

  if (variant === 'list') {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: '10px 12px',
          borderRadius: 16,
          cursor: 'pointer',
          background: 'var(--ayna-surface)',
          border: '1px solid var(--ayna-border)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 56,
            height: 56,
            flex: 'none',
            borderRadius: 14,
            overflow: 'hidden',
            background: 'var(--ayna-bg-alt)',
          }}
        >
          <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} compact />
          <div style={{ position: 'absolute', right: 2, bottom: 2 }}>
            {matchPercent == null ? null : <MatchRing percent={matchPercent} size={28} onClick={openWhyMatch} />}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))' }}>{name}</div>
            {resolvedPrice && (
              <div style={{ flex: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', whiteSpace: 'nowrap' }}>
                {resolvedPrice}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {isPartner && (
              <div style={{ ...PARTNER_BADGE_STYLE, position: 'static', padding: '3px 7px' }}>ayna partner</div>
            )}
            <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand || labelForCategory(category)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'transparent',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'transform .16s cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1.12 / 1',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--ayna-bg-alt)',
        }}
      >
        <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} />
        {isPartner && <div style={{ ...PARTNER_BADGE_STYLE, top: 8, left: 8, fontSize: 9, boxShadow: '0 1px 4px rgba(36,42,82,.08)' }}>ayna partner</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand || labelForCategory(category)}</div>
        <button type="button" onClick={(event) => { event.stopPropagation(); if (matchPercent != null) openWhyMatch?.(); else onStartQuiz?.(); }} style={{ flex: 'none', border: 0, background: 'transparent', color: 'var(--ayna-brown)', padding: '1px 0', fontSize: 'calc(10px * var(--ayna-text-scale, 1))', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
          {matchPercent != null ? `${matchPercent}% match` : 'See match'}
        </button>
      </div>
      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 600,
          fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
          lineHeight: 1.35,
          minHeight: '2.7em',
          marginTop: 5,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
          color: 'var(--ayna-heading)',
        }}
      >
        {name}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 9 }}>
        {resolvedPrice && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', whiteSpace: 'nowrap', color: 'var(--ayna-heading)' }}>{resolvedPrice}</div>
        )}
      </div>
    </div>
  );
}
