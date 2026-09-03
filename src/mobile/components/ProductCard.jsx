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

function firstSentence(text, max = 70) {
  const t = String(text || '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  if (cut.length <= max) return cut;
  const truncated = cut.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

/**
 * Two layouts, one component (per design: "Nebula" 2-up grid vs "Mission
 * control" dense list), switched via `variant` rather than duplicated —
 * both read the same real product fields, nothing is fetched twice.
 */
export default function ProductCard({ product, onClick, variant = 'grid' }) {
  const { name, category, price, priceDisplay, userRating, image, imageUrl, images, effectiveness, summary } = product || {};
  const resolvedImage = image || imageUrl || (Array.isArray(images) ? images[0] : undefined);
  const resolvedPrice = price || priceDisplay;
  const color = colorForCategory(category);

  if (variant === 'list') {
    const desc = firstSentence(effectiveness || summary);
    return (
      <div
        onClick={onClick}
        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 6px', borderRadius: 14, cursor: 'pointer' }}
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
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14 }}>{name}</div>
            {resolvedPrice && (
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--ayna-accent-dark)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {resolvedPrice}
              </div>
            )}
          </div>
          {desc && (
            <div style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--ayna-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {desc}
            </div>
          )}
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

      {category && (
        <div style={{ fontSize: 10.5, color: 'var(--ayna-text-faint)', marginTop: 2 }}>{labelForCategory(category)}</div>
      )}

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
