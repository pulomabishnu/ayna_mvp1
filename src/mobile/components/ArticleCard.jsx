const DOT_PALETTE = ['#C0761F', '#4E3866', '#5C7A4A', '#A2603C', '#3F7A6A', '#B0537A', '#242A52', '#78716C'];

function colorForId(id) {
  const str = id || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length];
}

export default function ArticleCard({ article, onClick }) {
  const { id, title, teaser, tags = [] } = article || {};
  const color = colorForId(id || title);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 12,
        background: '#FFFFFF',
        border: '1px solid #E1D5CE',
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          background: `linear-gradient(150deg, ${color}33, ${color}66)`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>
          {title}
        </div>
        {teaser && (
          <div
            style={{
              fontSize: 12.5,
              color: '#78716C',
              marginTop: 4,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {teaser}
          </div>
        )}
        {tags.length > 0 && (
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 9.5,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: '#A2603C',
              marginTop: 6,
            }}
          >
            {tags[0]}
          </div>
        )}
      </div>
    </div>
  );
}
