import React, { useEffect, useRef, useState } from 'react';
import '../../styles/editorial.css';
import { PHOTOS } from '../v3/photos.js';
import InfoHero from '../info/InfoHero.jsx';
import ReadMore from '../info/ReadMore.jsx';

/**
 * Editorial shell for the footer and info pages: the InfoHero (breadcrumb,
 * the page's only H1, one sentence, optional plate photo), then sections
 * with H2s, flat, separated by 1px rules. Long pages (toc) get a contents list built from their own
 * H2s: sticky beside the text on desktop, folded above it on phones.
 * Styles: src/styles/editorial.css (ed-page*, ed-toc*, ed-prose).
 */
function useContents(rootRef, enabled, refreshKey) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!enabled || !rootRef.current) return undefined;
    const heads = [...rootRef.current.querySelectorAll('h2')];
    heads.forEach((h, i) => { if (!h.id) h.id = `ed-s${i + 1}`; });
    setItems(heads.map((h) => ({ id: h.id, label: h.textContent.trim() })));
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen[0]) setActive(seen[0].target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [rootRef, enabled, refreshKey]);
  return [items, active];
}

/* Every info page opens with the one InfoHero (info-pages audit issue 1,
 * section 6): butter, breadcrumb, H1 36px, one sentence, optional photo on
 * the white scalloped plate (now an espresso band). `band` adds the pink band. `tone`, `frame`, `seal` and
 * `kicker` are accepted for old callers and ignored (no eyebrow labels).
 * `photo`: a /landing name, or { src, alt, product } for a packshot.
 * `crumb`: the short page name for the breadcrumb (defaults to the title). */
/* Glance first (founder, Oct 26 16:54): on long text pages each <section> shows
 * its H2 and first paragraph; the rest of that section, verbatim, is one tap
 * away behind "Read the full section". Nothing is removed (the hidden text
 * stays in the DOM). */
function glanceSections(children) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || child.type !== 'section' || child.props['data-keep'] != null) return child;
    const parts = React.Children.toArray(child.props.children);
    const h = parts.findIndex((c) => React.isValidElement(c) && c.type === 'h2');
    const first = parts.findIndex((c, i) => i > h && React.isValidElement(c) && c.type === 'p');
    if (h < 0 || first < 0) return child;
    const rest = parts.slice(first + 1);
    if (!rest.length) return child;
    return React.cloneElement(child, { className: `${child.props.className || ''} uq-glance`.trim() }, <>
      {parts.slice(0, first + 1)}
      <ReadMore label="Read the full section">{rest}</ReadMore>
    </>);
  });
}

export function EdPage({ title, lede, crumb, updated, onBack, backLabel = 'Home', photo, toc = false, tocKey, band = null, bandLabel, glance = false, className = '', children }) {
  const bodyRef = useRef(null);
  const [items, active] = useContents(bodyRef, toc, tocKey);
  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    try { window.history.replaceState(window.history.state, '', `#${id}`); } catch { /* ignore */ }
  };
  const ph = typeof photo === 'string' ? { src: `/landing/${photo}.webp`, alt: PHOTOS[photo] || '' } : photo;
  const list = (
    <ol>
      {items.map((it) => (
        <li key={it.id}><a href={`#${it.id}`} aria-current={active === it.id ? 'true' : undefined} onClick={(e) => go(e, it.id)}>{it.label}</a></li>
      ))}
    </ol>
  );
  return (
    <div className={`ed ed-page ed-page--info${className ? ` ${className}` : ''}`}>
      <div className="ed-wrap">
        <InfoHero title={title} lede={lede} crumb={crumb} updated={updated} onBack={onBack} backLabel={backLabel} photo={ph} />
        {/* Uniqueness pass A: one pink band per page, right under the espresso hero. */}
        {band && <section className="uq-band uq-bleed is-pink" aria-label={bandLabel}>{band}</section>}
        <div className="ed-page__body">
          {toc ? (
            <div className="ed-page__layout">
              <nav className="ed-toc" aria-label="On this page">
                {items.length > 0 && <>
                  <p className="ed-toc__title">On this page</p>
                  <div className="ed-toc__wide">{list}</div>
                  <details className="ed-toc__fold"><summary>On this page ({items.length} sections)</summary>{list}</details>
                </>}
              </nav>
              <div ref={bodyRef} className="ed-prose">{glance ? glanceSections(children) : children}</div>
            </div>
          ) : <div ref={bodyRef}>{glance ? glanceSections(children) : children}</div>}
        </div>
      </div>
    </div>
  );
}

/** A titled block on an info page: H2, optional intro line, content. */
export function EdBlock({ title, intro, children, className = '', id }) {
  return (
    <section className={`ed-block${className ? ` ${className}` : ''}`} id={id}>
      {(title || intro) && (
        <header className="ed-head">
          {title && <h2 className="ed-h2">{title}</h2>}
          {intro && <p className="ed-head__sub">{intro}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export default EdPage;

/** A small one-message page (email confirmed, signing in, errors): heading,
 *  a sentence or two, at most one action. Left-aligned in the page column. */
export function EdState({ title, children, actions, busy = false, full = false, tone }) {
  return (
    <div className="ed">
      <div className="ed-wrap">
        <div className={`ed-state${full ? ' ed-state--full' : ''}`} aria-busy={busy || undefined} role={tone === 'error' ? 'alert' : undefined}>
          {title && <h1 className="ed-h1">{title}</h1>}
          {children}
          {actions && <div className="ed-state__actions">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
