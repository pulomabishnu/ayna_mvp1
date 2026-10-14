import React, { useEffect, useRef, useState } from 'react';
import '../styles/audit-info.css';
import PhotoPile from './v3/PhotoPile.jsx';

/**
 * Shared shell for the secondary info / legal pages (About, How It Works,
 * How We Make Money, Brand Partnerships, Contact, Privacy, Terms, Screenings,
 * Recalls, Text ayna). One header with the page's only H1, then sections that
 * each use InfoSection's H2. Styles live in src/styles/audit-info.css, plus the
 * v3 header band in src/styles/theme-v3.css.
 *
 * The header is a full-width colour band (tone), and long reading pages get a
 * sticky, clickable contents list built from their own H2s.
 *
 * The medical disclaimer is NOT repeated here: it lives once in SiteFooter.
 */
const TONE_BY_EYEBROW = { legal: 'paper' };
const EDGE_BY_TONE = { rose: 'ay3-torn', sky: 'ay3-zigzag', ink: 'ay3-scallop', paper: '' };

function useContents(rootRef, enabled) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!enabled || !rootRef.current) return undefined;
    const heads = [...rootRef.current.querySelectorAll('h2')].filter((h) => !h.closest('.ay-info__head'));
    heads.forEach((h, i) => { if (!h.id) h.id = `ay-info-s${i + 1}`; });
    setItems(heads.map((h) => ({ id: h.id, label: h.textContent.replace(/^\s*\d+[.)]\s*/, '').trim() })));
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen[0]) setActive(seen[0].target.id);
    }, { rootMargin: '-20% 0px -65% 0px' });
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [rootRef, enabled]);
  return [items, active];
}

export function InfoPage({ eyebrow, title, lede, onBack, width = 'default', className = '', aside, tone, toc, photos, children }) {
  const rootRef = useRef(null);
  const t = tone || TONE_BY_EYEBROW[String(eyebrow || '').toLowerCase()] || 'rose';
  const showToc = toc ?? width === 'read';
  const [items, active] = useContents(rootRef, showToc);
  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <div ref={rootRef} className={`ay-info ay-info--${width}${showToc && items.length > 2 ? ' ay-info--toc' : ''}${className ? ` ${className}` : ''}`}>
      <header className={`ay-info__head${aside ? ' ay-info__head--split' : ''}${!aside && photos?.length ? ' ay3-withpile' : ''} ay3-band ay3-band--${t} ${EDGE_BY_TONE[t] || ''} ay3-edge-bottom ay3-infohero`}>
        <div className="ay-info__head-main">
          {onBack && (
            <button type="button" className="ay-info__back" onClick={onBack}>
              <span aria-hidden="true">←</span> Back
            </button>
          )}
          {eyebrow && <span className="ay-info__eyebrow">{eyebrow}</span>}
          <h1 className="ay-info__title">{title}</h1>
          {lede && <p className="ay-info__lede">{lede}</p>}
        </div>
        {aside}
        {!aside && photos?.length > 0 && <PhotoPile label={`${title} photos`} photos={photos} />}
      </header>
      {showToc && items.length > 2 ? (
        <div className="ay-info__layout">
          <nav className="ay-info__toc" aria-label="On this page">
            <p className="ay-info__toc-title">On this page</p>
            <ol>
              {items.map((it, i) => (
                <li key={it.id}>
                  <a href={`#${it.id}`} className={active === it.id ? 'is-on' : undefined} aria-current={active === it.id ? 'true' : undefined} onClick={(e) => go(e, it.id)}>
                    <b aria-hidden="true">{i + 1}</b><span>{it.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="ay-info__content">{children}</div>
        </div>
      ) : children}
    </div>
  );
}

export function InfoSection({ eyebrow, title, intro, children, className = '' }) {
  return (
    <section className={`ay-info__section${className ? ` ${className}` : ''}`}>
      {(eyebrow || title || intro) && (
        <div className="ay-info__section-head">
          {eyebrow && <span className="ay-info__eyebrow ay-info__eyebrow--sm">{eyebrow}</span>}
          {title && <h2 className="ay-info__h2">{title}</h2>}
          {intro && <p className="ay-info__intro">{intro}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export default InfoPage;
