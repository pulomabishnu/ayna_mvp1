import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { isPartnerBrandItem } from '../../utils/partnerBrands.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
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
  const matchDetails = getProductMatchDetailsForProduct(product, quizAnswers);
  const matchPercent = matchDetails.percent;
  const matchLabel = matchDetails.matchStatus === 'excluded' ? 'Not a fit'
    : matchDetails.matchStatus === 'no-relevance' ? 'No clear match'
      : 'Complete profile';
  const openMatch = (event) => {
    event.stopPropagation();
    if (matchDetails.matchStatus === 'no-profile') onStartQuiz?.();
    else openWhyMatch?.();
  };
  const openWhyMatch = onOpenWhyMatch ? () => onOpenWhyMatch(product) : undefined;
  // Real brand-partnership flag (src/utils/partnerBrands.js) — same
  // pattern-match desktop's Discovery.jsx uses for its "Affiliate link"
  // card badge, just labeled "ayna Favorite" here per product's request.
  const isPartner = isPartnerBrandItem(product);
  const insightLabels = [
    'Ayna take',
    product?.doctorOpinion || getVerificationLinks(product, 'doctor').length ? 'Clinical opinion' : null,
    product?.scientificCitations?.length || product?.ingredientScience?.some((item) => item.citations?.length) || getVerificationLinks(product, 'scientific').length ? 'Scientific literature' : null,
    product?.communityReview || getVerificationLinks(product, 'community').length ? 'Social media + reviews' : null,
  ].filter(Boolean);
  const openCardWithKeyboard = (event) => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  if (variant === 'list') {
    return (
      <div
        onClick={onClick}
        onKeyDown={openCardWithKeyboard}
        role="button"
        tabIndex={0}
        aria-label={`View ${name}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '104px minmax(0,1fr)',
          columnGap: 14,
          padding: 12,
          borderRadius: 20,
          cursor: 'pointer',
          background: 'var(--ayna-surface)',
          border: '1px solid var(--ayna-border)',
          boxShadow: '0 2px 10px rgba(36,42,82,.04)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 104,
            height: 112,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'var(--ayna-bg-alt)',
          }}
        >
          <ProductImage src={resolvedImage} alt={name} allowBrandLogo={product?.type === 'digital'} />
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
            <span style={{ color: 'var(--ayna-text-muted)', fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{brand || labelForCategory(category)}</span>
            {isPartner && <span style={{ color: 'var(--ayna-brown)', fontSize: 10, whiteSpace: 'nowrap', fontWeight: 700 }}>Partner</span>}
          </div>
          <div style={{ color: 'var(--ayna-heading)', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.35, fontWeight: 700, marginTop: 5, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
            <span style={{ color: 'var(--ayna-heading)', fontSize: 13, fontWeight: 700 }}>{resolvedPrice || 'See details'}</span>
            <button type="button" onClick={openMatch} style={{ border: 0, background: 'var(--ayna-peach)', borderRadius: 99, padding: '6px 9px', minHeight: 30, color: 'var(--ayna-heading)', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>{matchPercent != null ? `${matchPercent}% match` : matchLabel}</button>
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ayna-border)', marginTop: 12, paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 12px', color: 'var(--ayna-text-muted)', fontSize: 11, lineHeight: 1.4 }}>
          {insightLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div style={{ gridColumn: '1 / -1', color: 'var(--ayna-heading)', fontWeight: 700, fontSize: 12, marginTop: 10 }}>View product details <span aria-hidden="true">→</span></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={openCardWithKeyboard}
      role="button"
      tabIndex={0}
      aria-label={`View ${name}`}
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

      <div style={{ paddingTop: 8 }}>
        {resolvedPrice && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', whiteSpace: 'nowrap', color: 'var(--ayna-heading)' }}>{resolvedPrice}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', marginTop: 8, color: 'var(--ayna-text-muted)', fontSize: 10, lineHeight: 1.35 }}>
        {insightLabels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <button type="button" onClick={openMatch} style={{ width: '100%', minHeight: 44, marginTop: 10, border: '1px solid var(--ayna-chip-border)', borderRadius: 12, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-heading)', padding: '8px 10px', fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
        {matchDetails.matchStatus === 'scored' ? `${matchPercent}% match · See why` : matchDetails.matchStatus === 'no-profile' ? 'Complete profile to see your match' : `${matchPercent}% match · ${matchLabel}`}
      </button>
    </div>
  );
}
