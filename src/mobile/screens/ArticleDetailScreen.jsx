import { Children, isValidElement, useRef, useState } from 'react';
import LegalFooter from '../components/LegalFooter.jsx';

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

export default function ArticleDetailScreen({ article, onBack, theme }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);

  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
        No article selected.
      </div>
    );
  }

  const { id, title, source, tags = [], teaser, body, image } = article;
  const [tint1, tint2] = tintForId(id);
  const heroBackground = theme === 'dark'
    ? 'radial-gradient(130% 100% at 30% 0%, rgba(112,96,214,.35), rgba(255,255,255,.02) 70%)'
    : `linear-gradient(160deg,${tint1},${tint2})`;
  const readMinutes = estimateReadMinutes(body);
  const { mainBody, sourceLinks } = splitBodyAndSources(body);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--ayna-bg)', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20 }}>
        {/* Blurred fill for the space outside the arc — a scaled-up, blurred
            copy of the article's OWN image (not a generic per-article tint)
            so the corners the arc's curve reveals are always the same color
            as the picture itself and the seam disappears. Falls back to the
            tint only for the rare article with no image. Oversized (inset
            -60px) + scaled up further so the blur's own soft edge, and any
            hard edge from objectFit:cover on the backdrop, both land well
            outside the visible area; clipped by this wrapper's
            overflow:hidden. Also covers the back-button gap above the arc,
            so the arc reads as floating rather than docked to the very top
            of the screen. */}
        <div aria-hidden style={{ position: 'absolute', inset: '-60px', overflow: 'hidden' }}>
          {image ? (
            <img
              src={image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.3)', filter: 'blur(50px)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: heroBackground, filter: 'blur(60px)' }} />
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div
            onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--ayna-glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-text)' }}>
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </div>
        </div>
        {/* A true semicircular arc — border-radius: 50% 50% ties the curve to
            this box's own HEIGHT (300px), not its width, so it actually drew
            a squashed ellipse (radius 150 vs the 175 a true semicircle over
            a ~350px-wide screen needs), not a circle. calc(50vw - 20px) is
            exactly half of this container's real width (100vw minus the
            20px+20px side padding on the parent), used as a literal pixel
            radius for both axes — so the two top corners are true quarter-
            CIRCLES that meet at a single point dead center, matching the
            reference shape exactly, on any phone width. Flat square bottom.
            objectFit:contain + centered so the full illustration is always
            visible, never cropped off any side. */}
        <div style={{ position: 'relative', height: 300, borderRadius: 'calc(50vw - 20px) calc(50vw - 20px) 0 0', overflow: 'hidden' }}>
          {image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />}
        </div>
        <div style={{ height: 34 }} />
      </div>

      <div style={{ background: 'var(--ayna-surface)', borderRadius: '28px 28px 0 0', marginTop: -24, position: 'relative', padding: '26px 24px 34px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
          <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-accent-dark)' }} />
          {tags[0] && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>
              {tags[0]}
            </div>
          )}
          <div style={{ flex: 1, height: 1, background: 'var(--ayna-border)' }} />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '.8px', color: 'var(--ayna-text-faint)' }}>{readMinutes} MIN</div>
        </div>

        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 'calc(32px * var(--ayna-text-scale, 1))', lineHeight: 1.13, color: 'var(--ayna-text)', margin: 0 }}>{title}</div>
        {teaser && (
          <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'calc(16.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-accent-dark)', marginTop: 13 }}>
            {teaser}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 24px' }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const filled = progress >= i / 4;
            return i % 2 === 1 ? (
              <div key={i} style={{ width: 5, height: 5, borderRadius: 99, background: filled ? '#E8A94F' : 'var(--ayna-track)' }} />
            ) : (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: filled ? '#FFC774' : 'var(--ayna-track)' }} />
            );
          })}
        </div>

        <div style={{ fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.75, color: 'var(--ayna-text)' }}>{mainBody}</div>

        {(sourceLinks.length > 0 || source) && (
          <div style={{ marginTop: 28, padding: 18, borderRadius: 22, background: 'var(--ayna-chip-bg)', border: '1px solid var(--ayna-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 99,
                  background: 'linear-gradient(140deg,#242A52,#4E3866 60%,var(--ayna-brown))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 'calc(18px * var(--ayna-text-scale, 1))',
                  color: '#FFF9F2',
                }}
              >
                A
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>
                  Sources
                </div>
                {source && (
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', marginTop: 3, color: 'var(--ayna-text)' }}>
                    {source}
                  </div>
                )}
              </div>
            </div>
            {sourceLinks.length > 0 && (
              <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--ayna-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sourceLinks.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-brown)', fontWeight: 600 }}>
                    {l.text}
                  </a>
                ))}
              </div>
            )}
            <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text-muted)', marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--ayna-border)' }}>
              Every guide draws on peer-reviewed literature and established clinical guidance.
            </div>
          </div>
        )}
      </div>
      <LegalFooter />
    </div>
  );
}
