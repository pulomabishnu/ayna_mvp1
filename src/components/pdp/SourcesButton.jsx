import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * One small "Sources" text button per section (founder, Oct 27 15:54: "source things so it doesnt
 * take up too much space or a small text that says sources then it pops up"). Wikipedia's
 * reference previews and Apple's numbered footnotes do the same job: the claim reads clean and
 * the receipt is one tap away.
 *
 * Website: a popover under the button. App and phone widths: a bottom sheet (CSS decides, so
 * the same markup serves the website page, the app page and the app sheet).
 *
 * Every source stays in the page: the list is rendered (hidden) even when closed, so it is
 * searchable, server-rendered and reachable. Button + dialog: aria-expanded / aria-controls,
 * focus moves into the dialog, Esc or Close returns focus to the button, a tap outside closes.
 *
 * items: [{ url, title, publisher?, meta?, summary? }]
 */
export default function SourcesButton({ items = [], title = 'Sources', label = 'Sources', className = '' }) {
  const list = dedupe(items);
  const uid = useId().replace(/:/g, '');
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) try { btnRef.current?.focus({ preventScroll: true }); } catch { /* gone */ }
  }, [setOpen]);

  // Popover position (website): under the button, kept inside the window. Fixed, so no
  // accordion or card can clip it; it follows the button on scroll.
  const place = useCallback(() => {
    const b = btnRef.current;
    const r = b?.getBoundingClientRect();
    if (!r) return;
    // The app page and sheet, and phone widths: a bottom sheet. Dark when the page is dark.
    const sheet = Boolean(b.closest('#ay-pdp, #ay-psheet')) || window.innerWidth <= 640;
    const dark = /dark/.test(b.closest('[data-theme]')?.getAttribute('data-theme') || '');
    const w = Math.min(420, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left, window.innerWidth - w - 16));
    const below = window.innerHeight - r.bottom;
    setPos(below > 260 || below > r.top ? { top: r.bottom + 8, left, w, up: false, sheet, dark } : { top: r.top - 8, left, w, up: true, sheet, dark });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    window.requestAnimationFrame(() => boxRef.current?.querySelector('button, a')?.focus({ preventScroll: true }));
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    const onDown = (e) => { if (!boxRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) close(false); };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, close, place]);

  if (!list.length) return null;
  const dialogId = `ay-src-${uid}`;
  const style = pos ? { '--pop-top': `${pos.top}px`, '--pop-left': `${pos.left}px`, '--pop-w': `${pos.w}px` } : undefined;
  const mode = [open && 'is-open', pos?.up && 'is-up', pos?.sheet && 'is-sheet', pos?.dark && 'is-dark'].filter(Boolean).join(' ');
  const pop = (
    <span className={`ayv-srcpop${mode ? ` ${mode}` : ''}`} style={style}>
        <span className="ayv-srcpop__dim" aria-hidden="true" onClick={() => close(false)} />
        <span
          ref={boxRef}
          id={dialogId}
          className="ayv-srcpop__box"
          role="dialog"
          aria-labelledby={`${dialogId}-h`}
          onBlur={(e) => { if (open && e.relatedTarget && !boxRef.current?.contains(e.relatedTarget) && e.relatedTarget !== btnRef.current) close(false); }}
        >
          <span className="ayv-srcpop__grab" aria-hidden="true" />
          <span className="ayv-srcpop__head">
            <span className="ayv-srcpop__h" id={`${dialogId}-h`} role="heading" aria-level={4}>{title}</span>
            <button type="button" className="ayv-srcpop__close" onClick={() => close()} aria-label={`Close ${title.toLowerCase()}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </span>
          <span className="ayv-srcpop__list" role="list">
            {list.map((s) => (
              <span key={s.url} className="ayv-srcpop__item" role="listitem">
                {s.publisher && <span className="ayv-srcpop__pub">{s.publisher}</span>}
                <span className="ayv-srcpop__title">{s.title || s.url}</span>
                {s.meta && <span className="ayv-srcpop__meta">{s.meta}</span>}
                {s.summary && <span className="ayv-srcpop__sum">{s.summary}</span>}
                <a className="ayv-srcpop__go" href={s.url} target="_blank" rel="noopener noreferrer">Read the source<span aria-hidden="true"> ↗</span><span className="sr-only">: {s.title || s.url} (opens in a new tab)</span></a>
              </span>
            ))}
          </span>
        </span>
    </span>
  );
  return (
    <span className={`ayv-srcbtn${className ? ` ${className}` : ''}`}>
      <button
        ref={btnRef}
        type="button"
        className="ayv-srcbtn__btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => { if (open) { close(); return; } place(); setOpen(true); }}
      >
        {`${label} (${list.length})`}
      </button>
      {/* Closed: in place, display none by class (the list stays in the markup for search and the
          server render). Open: moved to the end of the page, so no card, accordion, scroller or tab
          bar can clip or cover it. */}
      {open && pos && typeof document !== 'undefined' ? createPortal(pop, document.body) : pop}
    </span>
  );
}


/** Each page once (same URL). */
function dedupe(items) {
  const seen = new Set();
  return (items || []).filter((s) => s && s.url && !seen.has(s.url) && seen.add(s.url));
}
