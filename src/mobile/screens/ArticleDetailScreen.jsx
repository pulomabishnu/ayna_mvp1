import TopicCover from '../../components/v3/TopicCover.jsx';
import { hasTeamCover } from '../../data/readCovers.js';
import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import LegalFooter from '../components/LegalFooter.jsx';
import ReadVideo from '../../components/library/ReadVideo.jsx';
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
// links, a consistent real convention, not a special case for one article.
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

export default function ArticleDetailScreen({ article, onBack, nextRead, onNext, onProgress, savedProgress = 0, products = [], productsNote = '', onOpenProduct = null, onAsk = null, renderProduct = null }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);
  // Read time from the words actually on screen: many bodies are components
  // whose text isn't in props, so the static estimate said "1 min" for
  // every read (deep round 2).
  const [measuredMinutes, setMeasuredMinutes] = useState(0);
  const articleId = article?.id;
  useEffect(() => {
    const el = scrollRef.current?.querySelector('.ay-article-body');
    if (!el) return undefined;
    const words = (el.innerText || el.textContent || '').trim().split(/\s+/).filter(Boolean).length;
    if (!words) return undefined;
    const frame = window.requestAnimationFrame(() => setMeasuredMinutes(Math.max(1, Math.round(words / 200))));
    return () => window.cancelAnimationFrame(frame);
  }, [articleId]);

  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
        No article selected.
      </div>
    );
  }

  const { title, source, tags = [], teaser, body, image } = article;
  const readMinutes = measuredMinutes || estimateReadMinutes(body);
  const { mainBody, sourceLinks } = splitBodyAndSources(body);
  const shown = Math.max(progress >= 0.95 ? 1 : progress, savedProgress);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 1;
    setProgress(p);
    onProgress?.(p >= 0.95 ? 1 : p);
  };

  const openNext = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setProgress(0);
    onNext?.(nextRead.article);
  };

  return (
    <div className="ayna-fresh-article" ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      {/* Progress and the back arrow scroll with the article (nothing stays on screen while the page scrolls). */}
      <div className="ay-read-sticky">
        <div className={`ay-read-status${shown >= 1 ? ' is-done' : ''}`} role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(shown * 100)}>
          <span className="ay-read-status-bar"><i style={{ width: `${shown * 100}%` }} /></span>
          <span className="ay-read-status-label">{shown >= 1 ? 'Finished' : shown > 0 ? `${Math.round(shown * 100)}% read` : `${readMinutes} min read`}</span>
        </div>
        <header className="ayna-detail-header">
          <button type="button" aria-label="Back to reads" onClick={onBack}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>
          <span className="ayna-read-meta">{tags[0] || 'Read'} · {readMinutes} min</span>
        </header>
      </div>
      {hasTeamCover(article) ? <div className="ayna-read-photo"><img src={image} alt="" /></div> : <div className="ay-app-readhero"><TopicCover id={article.id} title={title} className="ay-app-cover is-hero" /></div>}
      <div className="ayna-read-content">
        <h1 className="ay-read-title">{title}</h1>
        {teaser && (
          <div className="ay-read-teaser" style={{ marginTop: 13 }}>
            {teaser}
          </div>
        )}


        <ReadVideo video={article.video} />

        <div className="ay-article-body" style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text)' }}>{mainBody}</div>

        {(sourceLinks.length > 0 || source) && <section className="ayna-read-sources" aria-label="Article sources"><h2>Sources</h2>{source && <p>{source}</p>}{sourceLinks.map((link, index) => <a key={`${link.href}-${index}`} href={link.href} target="_blank" rel="noopener noreferrer">{link.text}</a>)}</section>}
        {/* Content and products connect (team direction 58): products and a question to Ask, labelled as products, after the read. */}
        {products.length > 0 && onOpenProduct && renderProduct && (
          <section className="ay-read-products" aria-labelledby="ay-read-products-h">
            <h2 id="ay-read-products-h">Products for this topic</h2>
            <p className="ay-read-products__disc">Products, not medical advice. Some links earn ayna a commission. It never changes what we show.</p>
            {productsNote && <p className="ay-read-products__note" role="note"><svg className="ay-alert__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}><path d="M8 1.6 14.6 13.4H1.4L8 1.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 6.2v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="11.6" r=".9" fill="currentColor" /></svg>{productsNote}</p>}
            <div className="ay-shelf2-row">{products.map(({ product }) => <div key={product.id}>{renderProduct(product)}</div>)}</div>
          </section>
        )}
        {onAsk && (
          <section className="ay-read-ask" aria-labelledby="ay-read-ask-h">
            <h2 id="ay-read-ask-h">Questions about this?</h2>
            <div className="ay-read-ask__row">
              {['Is this relevant to me?', 'When should I see a clinician?'].map((q) => <button key={q} type="button" onClick={() => onAsk({ question: `About the read "${title}": ${q}` })}>{q}</button>)}
            </div>
          </section>
        )}
        {nextRead?.article && <section className="ayna-read-next" aria-label="Next article"><span>{nextRead.label}</span><button type="button" onClick={openNext}>{nextRead.article.title}<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button></section>}
      </div>
      <LegalFooter />
    </div>
  );
}
