const DOT_PALETTE = ['#C0761F', '#4E3866', '#5C7A4A', '#A2603C', '#3F7A6A', '#B0537A', '#242A52', '#78716C'];

function colorForCategory(category) {
  const str = category || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length];
}

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
export default function ProductCard({ product, onClick, variant = 'grid' }) {
  const { name, category, price, priceDisplay, userRating, image, imageUrl, images } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = shortPrice(price || priceDisplay);
  const color = colorForCategory(category);

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
            width: 56,
            height: 56,
            flex: 'none',
            borderRadius: 14,
            overflow: 'hidden',
            background: resolvedImage ? 'var(--ayna-bg-alt)' : `linear-gradient(150deg, ${color}26, ${color}4d)`,
            backgroundImage: resolvedImage ? `url(${resolvedImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14 }}>{name}</div>
            {resolvedPrice && (
              <div style={{ flex: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--ayna-accent-dark)', whiteSpace: 'nowrap' }}>
                {resolvedPrice}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {userRating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFC774">
                  <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.3 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
                </svg>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: 'var(--ayna-text-muted)' }}>{userRating}</div>
              </div>
            )}
            {category && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: 'var(--ayna-text-faint)', marginLeft: 'auto' }}>
                {labelForCategory(category)}
              </div>
            )}
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
        borderRadius: 18,
        padding: 10,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(41,37,36,.04)',
        transition: 'transform .16s cubic-bezier(.2,.8,.2,1), box-shadow .16s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 13,
          overflow: 'hidden',
          background: resolvedImage ? 'var(--ayna-bg-alt)' : `linear-gradient(150deg, ${color}26, ${color}4d)`,
          backgroundImage: resolvedImage ? `url(${resolvedImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          marginTop: 9,
          textWrap: 'pretty',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
        {resolvedPrice && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13 }}>{resolvedPrice}</div>
        )}
        {userRating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFC774">
              <path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.3 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
            </svg>
            <div style={{ fontSize: 10.5, color: 'var(--ayna-text-faint)' }}>{userRating}</div>
          </div>
        )}
      </div>
    </div>
  );
}
