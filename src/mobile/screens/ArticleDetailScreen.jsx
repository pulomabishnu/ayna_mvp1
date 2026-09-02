import { Children, isValidElement, useRef, useState } from 'react';

const HERO_TINTS = [
  ['#F5E8DA', '#EADACB'],
  ['#F0E6DA', '#DCCBB4'],
  ['#EDE2D6', '#D6C4AE'],
  ['#F6E3CE', '#E5C49B'],
  ['#E8D3CC', '#C9A79C'],
  ['#F4E0D3', '#DFB89F'],
];

function tintForId(id) {
  const str = id || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return HERO_TINTS[hash % HERO_TINTS.length];
}

function extractText(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (isValidElement(node)) return extractText(node.props.children);
  return '';
}

function estimateReadMinutes(body) {
  const words = extractText(body).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Every real article (src/components/Articles.jsx) ends its body with a
// <p><strong>Sources:</strong></p> paragraph followed by a <ul> of citation
// links — a consistent real convention, not a special case for one article.
// Splitting on it lets the citation links render in a dedicated card
// instead of a fabricated "reviewed by Dr. X" byline the real data has no
// field for.
function splitBodyAndSources(body) {
  const kids = body?.props?.children ? Children.toArray(body.props.children) : [];
  const splitIndex = kids.findIndex(
    (child) => isValidElement(child) && child.type === 'p' && /sources:/i.test(extractText(child.props.children))
  );
  if (splitIndex < 0) return { mainBody: kids, sourceLinks: [] };

  const mainBody = kids.slice(0, splitIndex);
  const sourcesList = kids[splitIndex + 1];
  let sourceLinks = [];
  if (isValidElement(sourcesList) && sourcesList.type === 'ul') {
    sourceLinks = Children.toArray(sourcesList.props.children)
      .filter(isValidElement)
      .map((li) => {
        const link = Children.toArray(li.props.children).find((c) => isValidElement(c) && c.type === 'a');
        return link ? { href: link.props.href, text: extractText(link.props.children) } : null;
      })
      .filter(Boolean);
  }
  return { mainBody, sourceLinks };
}

export default function ArticleDetailScreen({ article, onBack }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);

  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#78716C', fontSize: 13.5 }}>
        No article selected.
      </div>
    );
  }

  const { id, title, source, tags = [], teaser, body } = article;
  const [tint1, tint2] = tintForId(id);
  const readMinutes = estimateReadMinutes(body);
  const { mainBody, sourceLinks } = splitBodyAndSources(body);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', background: '#FFFCF9', animation: 'ay-page .25s ease-out' }}>
      <div style={{ position: 'relative', background: `linear-gradient(160deg,${tint1},${tint2})`, padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div
            onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(255,252,249,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#292524" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </div>
        </div>
        <div style={{ height: 290, borderRadius: '150px 150px 20px 20px', overflow: 'hidden', boxShadow: '0 16px 34px -20px rgba(41,37,36,.5)' }} />
        <div style={{ height: 34 }} />
      </div>

      <div style={{ background: '#FFFCF9', borderRadius: '28px 28px 0 0', marginTop: -24, position: 'relative', padding: '26px 24px 34px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
          <div style={{ width: 7, height: 7, borderRadius: 99, background: '#C0761F' }} />
          {tags[0] && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#C0761F' }}>
              {tags[0]}
            </div>
          )}
          <div style={{ flex: 1, height: 1, background: '#E1D5CE' }} />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '.8px', color: '#A8A29E' }}>{readMinutes} MIN</div>
        </div>

        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 32, lineHeight: 1.13, color: '#292524', margin: 0 }}>{title}</div>
        {teaser && (
          <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.5, color: '#7A5A2E', marginTop: 13 }}>
            {teaser}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 24px' }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const filled = progress >= i / 4;
            return i % 2 === 1 ? (
              <div key={i} style={{ width: 5, height: 5, borderRadius: 99, background: filled ? '#E8A94F' : '#EAE3DA' }} />
            ) : (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: filled ? '#FFC774' : '#EAE3DA' }} />
            );
          })}
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.75, color: '#292524' }}>{mainBody}</div>

        {(sourceLinks.length > 0 || source) && (
          <div style={{ marginTop: 28, padding: 18, borderRadius: 22, background: '#F3EFE9', border: '1px solid #E1D5CE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 99,
                  background: 'linear-gradient(140deg,#242A52,#4E3866 60%,#A2603C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 18,
                  color: '#FFF9F2',
                }}
              >
                A
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#A8A29E' }}>
                  Sources
                </div>
                {source && (
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14.5, marginTop: 3, color: '#292524' }}>
                    {source}
                  </div>
                )}
              </div>
            </div>
            {sourceLinks.length > 0 && (
              <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid #E1D5CE', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sourceLinks.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, lineHeight: 1.5, color: '#A2603C', fontWeight: 600 }}>
                    {l.text}
                  </a>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#78716C', marginTop: 13, paddingTop: 13, borderTop: '1px solid #E1D5CE' }}>
              Every guide draws on peer-reviewed literature and established clinical guidance.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
