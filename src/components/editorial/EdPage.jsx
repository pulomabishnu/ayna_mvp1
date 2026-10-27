import React, { useEffect, useId, useRef, useState } from 'react';
import '../../styles/editorial.css';
import { PHOTOS } from '../v3/photos.js';
import InfoHero from '../info/InfoHero.jsx';

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
/* One open at a time (founder, Oct 26 20:17: "think of different unique ways",
 * accordion for policies and FAQ-like pages). On long text pages each <section>
 * with an H2 becomes an accordion row: the H2 holds a 44px button with a
 * chevron (aria-expanded, aria-controls) and the rest of the section, verbatim,
 * is its panel. Opening one closes the others. Closed panels use
 * hidden="until-found", so find-in-page still reaches every word and opens the
 * row. A section marked data-keep (e.g. the Amazon Associates disclosure) stays
 * a plain open section. The first row starts open. */
function AccordionSections({ children }) {
  const rows = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== 'section' || child.props['data-keep'] != null) return;
    const parts = React.Children.toArray(child.props.children);
    if (parts.some((c) => React.isValidElement(c) && c.type === 'h2')) rows.push(child);
  });
  const [open, setOpen] = useState(rows[0]?.key ?? null);
  const uid = useId().replace(/:/g, '');
  return React.Children.map(children, (child, index) => {
    if (!rows.includes(child)) return child;
    const parts = React.Children.toArray(child.props.children);
    const h = parts.findIndex((c) => React.isValidElement(c) && c.type === 'h2');
    const head = parts[h];
    const rest = [...parts.slice(0, h), ...parts.slice(h + 1)];
    const key = child.key ?? index;
    const isOpen = open === key;
    const panelId = `ed-acc-${uid}-${index}`;
    return React.cloneElement(child, { className: `${child.props.className || ''} ed-acc${isOpen ? ' is-open' : ''}`.trim() }, <>
      {React.cloneElement(head, { className: `${head.props.className || ''} ed-acc__h`.trim() },
        <button type="button" className="ed-acc__btn" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : key)}>
          <span>{head.props.children}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>)}
      <div id={panelId} className="ed-acc__panel" hidden={isOpen ? undefined : 'until-found'} ref={(el) => { if (el && !el.dataset.bm) { el.dataset.bm = '1'; el.addEventListener('beforematch', () => setOpen(key)); } }}>{rest}</div>
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
    const btn = el.querySelector('.ed-acc__btn');
    if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
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
              <div ref={bodyRef} className="ed-prose">{glance ? <AccordionSections>{children}</AccordionSections> : children}</div>
            </div>
          ) : <div ref={bodyRef}>{glance ? <AccordionSections>{children}</AccordionSections> : children}</div>}
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
