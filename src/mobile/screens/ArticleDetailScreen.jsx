import ReadCover from '../../components/library/ReadCover.jsx';
import ReadBody, { SourcesAccordion } from '../../components/library/ReadBody.jsx';
import { minutesFor, textOf } from '../../components/library/readTime.js';
import { coverPhotoFor } from '../../data/readCovers.js';
import { Children, isValidElement, useRef, useState } from 'react';
import LegalFooter from '../components/LegalFooter.jsx';
import ReadVideo from '../../components/library/ReadVideo.jsx';
import './article-detail.css';

// The read's own citation list ("Sources:" then a <ul> of links) as plain rows.
function sourceLinks(items) {
  const list = items.find((el) => isValidElement(el) && el.type === 'ul');
  if (!list) return [];
  return Children.toArray(list.props.children).filter(isValidElement).map((li) => {
    const parts = Children.toArray(li.props.children);
    const link = parts.find((c) => isValidElement(c) && c.type === 'a');
    const text = textOf(parts).replace(/\s+/g, ' ').trim();
    return link ? { href: link.props.href, text } : { href: null, text };
  }).filter((x) => x.text);
}

export default function ArticleDetailScreen({ article, onBack, nextRead, onNext, onProgress, savedProgress = 0, products = [], productsNote = '', onOpenProduct = null, onAsk = null, renderProduct = null }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);
  if (!article) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
        No article selected.
      </div>
    );
  }

  const { title, source, tags = [], teaser, body } = article;
  // One read time everywhere (card, cover, this page): computed from the read's own words.
  const readMinutes = minutesFor(article);
  const photo = coverPhotoFor(article);
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
      <div className={`ay-read-hero${photo ? ' has-photo' : ''}`}>{photo ? <img src={photo} alt="" /> : <ReadCover article={article} size="hero" />}</div>
      <div className="ayna-read-content">
        <h1 className="ay-read-title">{title}</h1>
        {teaser && (
          <div className="ay-read-teaser" style={{ marginTop: 13 }}>
            {teaser}
          </div>
        )}

        <ReadBody
          body={body}
          className="ay-read-body"
          before={<ReadVideo video={article.video} />}
          renderSources={(src) => {
            const links = sourceLinks(src.items);
            return (
              <SourcesAccordion count={links.length || null} label={src.label}>
                <div className="ayna-read-sources">{source && <p>{source}</p>}{links.map((link, index) => (link.href ? <a key={`${link.href}-${index}`} href={link.href} target="_blank" rel="noopener noreferrer">{link.text}</a> : <p key={index}>{link.text}</p>))}</div>
              </SourcesAccordion>
            );
          }}
        />
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
