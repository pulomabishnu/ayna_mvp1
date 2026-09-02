export default function ArticleDetailScreen({ article, onBack }) {
  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#78716C', fontSize: 13.5 }}>
        No article selected.
      </div>
    );
  }

  const { title, source, tags = [], teaser, body } = article;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FFFCF9', animation: 'ay-page .25s ease-out' }}>
      <div style={{ padding: '24px 22px 48px' }}>
        <div
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            background: '#F3EFE9',
            border: '1px solid #E1D5CE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </div>

        {source && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#A2603C' }}>
            {source}
          </div>
        )}

        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, lineHeight: 1.22, margin: '10px 0 12px' }}>
          {title}
        </div>

        {teaser && (
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: '#57534E',
              fontStyle: 'italic',
              fontFamily: "'Playfair Display',serif",
              marginBottom: 20,
            }}
          >
            {teaser}
          </div>
        )}

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {tags.map((t) => (
              <div
                key={t}
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9.5,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: '#8a5a1e',
                  background: '#FFEFD6',
                  padding: '5px 10px',
                  borderRadius: 99,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: '#E1D5CE', marginBottom: 20 }} />

        {/* Real article bodies (src/components/Articles.jsx) are raw JSX
            (<p>, <ul>, <a> elements), not paragraph strings — rendered
            directly here rather than mapped over. */}
        <div style={{ fontSize: 14.5, lineHeight: 1.7 }}>{body}</div>
      </div>
    </div>
  );
}
