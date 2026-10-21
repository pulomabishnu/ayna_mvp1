import React, { useEffect, useRef, useState } from 'react';
import '../../styles/editorial.css';
import { PHOTOS } from '../v3/photos.js';
import { Seal } from '../personality/Bits.jsx';
import BackLink from '../nav/BackLink.jsx';

/**
 * Editorial shell for the footer and info pages (design direction, "Footer
 * pages"): a back link, the page's only H1 with its intro in the reading
 * column, an optional photo beside it, then sections with H2s and no boxes
 * around prose. Long pages (toc) get a contents list built from their own
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

/* Marketing info pages (About, How it works, How we make money, Partners)
 * pass `tone` ('pink' | 'sky' | 'espresso') for a full-bleed colour-block
 * header with a scalloped edge, and `frame` ('polaroid' | 'flower' | 'frame')
 * for the photo; `seal` puts the "Matched to you" seal on the photo.
 * Utility pages (legal, contact, forms) leave them off and stay calm. */
export function EdPage({ title, lede, kicker, updated, onBack, backLabel = 'Back', photo, aside, toc = false, tocKey, className = '', tone = null, frame = null, caption = null, seal = false, children }) {
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
  const img = ph ? <img src={ph.src} alt={ph.alt} loading="eager" style={ph.pos ? { objectPosition: ph.pos } : undefined} /> : null;
  const framed = !img ? null
    : frame === 'polaroid' ? <figure className="ay-polaroid ed-page__polaroid" style={{ '--tilt': '1.8deg' }}>{img}{caption && <figcaption>{caption}</figcaption>}{seal && <Seal className="ed-page__seal" />}</figure>
      : frame === 'flower' ? <span className="ed-page__flowerwrap"><span className="ay-flower ed-page__flower">{img}</span>{seal && <Seal className="ed-page__seal" />}</span>
        : frame === 'stamp' ? <span className="ed-page__framewrap"><span className="ay-stamp ed-page__stamp">{img}</span>{seal && <Seal className="ed-page__seal" />}</span>
        : frame === 'frame' ? <span className="ed-page__framewrap"><span className="ay-frame ed-page__frame">{img}</span>{seal && <Seal className="ed-page__seal" />}</span>
          : img;
  const side = aside || framed;
  const list = (
    <ol>
      {items.map((it) => (
        <li key={it.id}><a href={`#${it.id}`} aria-current={active === it.id ? 'true' : undefined} onClick={(e) => go(e, it.id)}>{it.label}</a></li>
      ))}
    </ol>
  );
  const head = (
        <header className={`ed-page__head${side ? '' : ' ed-page__head--plain'}${tone ? ' ed-page__head--band' : ''}`}>
          <div className="ed-page__titles">
            {onBack && (
              <BackLink className="ed-page__back" label={backLabel} onClick={onBack} />
            )}
            {kicker && <p className="ed-page__kicker">{kicker}</p>}
            <h1 className="ed-h1">{title}</h1>
            {lede && <p className="ed-lead">{lede}</p>}
            {updated && <p className="ed-page__updated">{updated}</p>}
          </div>
          {side && <div className={`ed-page__aside${frame ? ` ed-page__aside--${frame}` : ''}`}>{side}</div>}
        </header>
  );
  return (
    <div className={`ed ed-page${tone ? ' ed-page--toned' : ''}${className ? ` ${className}` : ''}`}>
      {tone && <div className={`ay-band ay-band--${tone} ay-band--scallop-bottom ed-page__band`}><div className="ed-wrap">{head}</div></div>}
      <div className="ed-wrap">
        {!tone && head}
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
              <div ref={bodyRef} className="ed-prose">{children}</div>
            </div>
          ) : <div ref={bodyRef}>{children}</div>}
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
