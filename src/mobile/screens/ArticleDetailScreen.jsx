import { Children, isValidElement, useRef, useState } from 'react';
import LegalFooter from '../components/LegalFooter.jsx';
import './article-detail.css';

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
// Splitting on it lets the citation links render in a dedicated section
// instead of a fabricated "reviewed by Dr. X" byline the real data has no
// field for.
function splitBodyAndSources(body) {
  const kids = Children.toArray(body?.props?.children ?? body);
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

export default function ArticleDetailScreen({ article, onBack, nextRead, onNext }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);

  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
        No article selected.
      </div>
    );
  }

  const { title, source, tags = [], teaser, body, image } = article;
  const readMinutes = estimateReadMinutes(body);
  const { mainBody, sourceLinks } = splitBodyAndSources(body);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
  };

  return (
    <div className="ayna-fresh-article" ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      <header className="ayna-detail-header">
        <button type="button" aria-label="Back to reads" onClick={onBack}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
        <span className="ayna-read-meta">{tags[0] || 'Read'} · {readMinutes} min</span>
      </header>
      {image && <div className="ayna-read-photo"><img src={image} alt="" /></div>}
      <div className="ayna-read-content">
        <h1 style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(32px * var(--ayna-text-scale, 1))', lineHeight: 1.13, color: 'var(--ayna-text)', margin: 0 }}>{title}</h1>
        {teaser && (
          <div style={{ fontFamily: "var(--ayna-font-display)", fontStyle: 'italic', fontSize: 'calc(16.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-accent-dark)', marginTop: 13 }}>
            {teaser}
          </div>
        )}
        <div className="ayna-read-progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ width: `${progress * 100}%` }} /></div>

        <div className="ay-article-body" style={{ fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.75, color: 'var(--ayna-text)' }}>{mainBody}</div>

        {(sourceLinks.length > 0 || source) && <section className="ayna-read-sources" aria-label="Article sources"><h2>Sources</h2>{source && <p>{source}</p>}{sourceLinks.map((link, index) => <a key={`${link.href}-${index}`} href={link.href} target="_blank" rel="noopener noreferrer">{link.text}</a>)}</section>}
        {nextRead?.article && <section className="ayna-read-next" aria-label="Next article"><span>{nextRead.label}</span><button type="button" onClick={() => onNext?.(nextRead.article)}>{nextRead.article.title}<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button></section>}
      </div>
      <LegalFooter />
    </div>
  );
}
