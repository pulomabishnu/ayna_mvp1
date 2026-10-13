import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lookupGlossaryTerm, getGlossaryEntry, findHardTerms } from '../data/glossary';
import './GlossaryTerm.css';

/**
 * A hard word with a dotted underline. Tap (or hover on desktop) opens a small
 * card with the plain-English definition from the central glossary
 * (src/data/glossary.js), and an optional "Learn more". On phones the card is
 * a bottom sheet. Shared by the website and the app.
 *
 *   <GlossaryTerm term="NSAID" />                 looks the term up
 *   <GlossaryTerm term="PCOS">pcos</GlossaryTerm> custom label
 *   <GlossaryTerm term="X" define="..." />        one-off definition
 *
 * A term with no definition renders as plain text, never a dead underline.
 */
const SHEET_QUERY = '(max-width: 600px)';
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
const mq = (q) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

export default function GlossaryTerm({ term, define, children, inline = true }) {
  const entry = define ? null : getGlossaryEntry(term);
  const short = define || entry?.short || lookupGlossaryTerm(term);
  const label = children ?? term;
  const id = useId();
  const btnRef = useRef(null);
  const cardRef = useRef(null);
  const closeTimer = useRef(0);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [more, setMore] = useState(false);
  const [layout, setLayout] = useState(null);

  function close(refocus = false) {
    setOpen(false);
    setPinned(false);
    setMore(false);
    if (refocus) btnRef.current?.focus();
  }

  // Place the card next to the word (or as a sheet on phones).
  const place = () => {
    if (!btnRef.current) return;
    const host = btnRef.current.closest('.ayna-mobile, .app-container') || document.body;
    if (mq(SHEET_QUERY)) { setLayout({ host, sheet: true }); return; }
    const r = btnRef.current.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 16));
    const below = r.top < 200;
    setLayout({ host, sheet: false, width, left, top: below ? r.bottom + 8 : null, bottom: below ? null : window.innerHeight - r.top + 8 });
  };

  useEffect(() => {
    if (!open) return undefined;
    const shut = (refocus) => {
      setOpen(false);
      setPinned(false);
      setMore(false);
      if (refocus) btnRef.current?.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') shut(true); };
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || cardRef.current?.contains(e.target)) return;
      shut(false);
    };
    const onScroll = () => { if (!mq(SHEET_QUERY)) shut(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  if (!short) return <>{label}</>;

  const hoverOpen = () => {
    if (!mq(HOVER_QUERY)) return;
    window.clearTimeout(closeTimer.current);
    if (!open) place();
    setOpen(true);
  };
  const hoverClose = () => {
    if (!mq(HOVER_QUERY) || pinned) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => close(), 160);
  };

  const title = entry?.term || term;
  const card = open && layout && (
    <>
      {layout.sheet && <div className="ay-gloss-scrim" aria-hidden="true" onClick={() => close()} />}
      <div
        ref={cardRef}
        id={id}
        role="dialog"
        aria-label={`${title}: definition`}
        className={`ay-gloss-card${layout.sheet ? ' is-sheet' : ''}`}
        style={layout.sheet ? undefined : { width: layout.width, left: layout.left, top: layout.top ?? 'auto', bottom: layout.bottom ?? 'auto' }}
        onMouseEnter={() => window.clearTimeout(closeTimer.current)}
        onMouseLeave={hoverClose}
      >
        <div className="ay-gloss-card__head">
          <strong>{title}</strong>
          <button type="button" className="ay-gloss-card__x" aria-label="Close definition" onClick={() => close(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <p>{short}</p>
        {entry?.long && !more && (
          <button type="button" className="ay-gloss-card__more" onClick={() => { setMore(true); setPinned(true); }}>Learn more</button>
        )}
        {more && entry?.long && <p className="ay-gloss-card__long">{entry.long}</p>}
        {more && entry?.related?.length > 0 && (
          <p className="ay-gloss-card__related">Related: {entry.related.join(', ')}</p>
        )}
        <small>General info, not medical advice.</small>
      </div>
    </>
  );

  const Wrapper = inline ? 'span' : 'div';
  return (
    <Wrapper className="ay-gloss-wrap">
      <button
        ref={btnRef}
        type="button"
        className="ay-gloss"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        onMouseEnter={hoverOpen}
        onMouseLeave={hoverClose}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          window.clearTimeout(closeTimer.current);
          if (open && pinned) close();
          else { if (!open) place(); setOpen(true); setPinned(true); }
        }}
      >
        {label}
      </button>
      {card && createPortal(card, layout.host)}
    </Wrapper>
  );
}

/**
 * Plain text with its hard words underlined. `terms` (entry names from
 * planGlossaryTerms) limits which words get the underline, first appearance
 * only, so a page never turns into a sea of dotted lines.
 */
export function GlossaryText({ text, terms }) {
  const t = String(text || '');
  if (!t) return null;
  const allow = terms ? new Set(terms) : null;
  if (allow && allow.size === 0) return <>{t}</>;
  const seen = new Set();
  const parts = [];
  let cursor = 0;
  for (const hit of findHardTerms(t)) {
    const key = hit.entry.term;
    if (seen.has(key) || (allow && !allow.has(key)) || (!allow && seen.size >= 3)) continue;
    seen.add(key);
    if (hit.index > cursor) parts.push(t.slice(cursor, hit.index));
    parts.push(<GlossaryTerm key={`${key}-${hit.index}`} term={key}>{hit.text}</GlossaryTerm>);
    cursor = hit.index + hit.length;
  }
  if (cursor < t.length) parts.push(t.slice(cursor));
  return <>{parts}</>;
}
