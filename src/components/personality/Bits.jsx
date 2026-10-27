import React, { useEffect, useId, useRef, useState } from 'react';

/* Decorative pieces for the personality layer (design direction,
 * "Personality"). Styles live in src/styles/ayna-system.css (.ay-seal,
 * .ay-clip, .ay-ribbon, .ay-sticker, .ay-envelope). Everything here is
 * aria-hidden except the ribbon's list, which carries real names. */

const MATCHED = 'matched to you · matched to you · ';
export function Seal({ className = '', text = MATCHED }) {
  const id = useId().replace(/:/g, '');
  // The rotating "matched to you" stamp is retired everywhere (founder, Oct 27: no stickers).
  // Seals with their own words (e.g. the Rundown's closing) still draw.
  if (text === MATCHED) return null;
  return (
    <span className={`ay-seal ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs><path id={`ay-seal-${id}`} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0" /></defs>
        <text><textPath href={`#ay-seal-${id}`} startOffset="0">{text}</textPath></text>
      </svg>
      <b>ayna</b>
    </span>
  );
}

export function Clip({ className = '', style }) {
  return (
    <svg className={`ay-clip ${className}`} style={style} viewBox="0 0 26 64" aria-hidden="true">
      <path d="M8 22V10a5 5 0 0 1 10 0v40a8 8 0 0 1-16 0V16" />
    </svg>
  );
}

const ICONS = {
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  book: <><path d="M3 5c3-1 6-1 9 1v14c-3-2-6-2-9-1z" /><path d="M21 5c-3-1-6-1-9 1v14c3-2 6-2 9-1z" /></>,
  shelf: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 12h16M9 7v2M15 16v2" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  spark: <path d="M12 3c.6 4.8 4.2 8.4 9 9-4.8.6-8.4 4.2-9 9-.6-4.8-4.2-8.4-9-9 4.8-.6 8.4-4.2 9-9z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  leaf: <><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19 13 11" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2.1-.5-2.6-1.5M12 6.5v1.5M12 16v1.5" /></>,
  hand: <><path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11" /><path d="M10 10V5a1.5 1.5 0 0 1 3 0v6" /><path d="M13 10.5V6.5a1.5 1.5 0 0 1 3 0V13" /><path d="M16 11a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-12.6 4.2L4 15a1.6 1.6 0 0 1 2.4-2L7 14" /></>,
};

export function Sticker({ icon = 'spark', className = '', style }) {
  return (
    <span className={`ay-sticker ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 24 24">{ICONS[icon] || ICONS.spark}</svg>
    </span>
  );
}

export function LineIcon({ icon = 'spark' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[icon] || ICONS.spark}</svg>;
}

/* The one marquee ribbon on a page. `tab` is an optional fixed label
 * (a link) on the left; `items` are real names or a short phrase. */
export function Ribbon({ items, tab = null, label, className = '', onPick = null }) {
  // The page's one moving row. It stops while offscreen (and on hover, focus,
  // the footer's Pause motion and reduced motion, in ayna-system.css).
  const ref = useRef(null);
  const [offscreen, setOffscreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // With onPick each phrase is a button (the copy that loops is hidden from
  // screen readers and the tab order).
  const row = (hidden) => (
    <ul aria-hidden={hidden || undefined} aria-label={hidden ? undefined : label}>
      {items.map((t, i) => <li key={`${t}-${i}`}>{onPick ? <button type="button" className="ay-ribbon__pick" tabIndex={hidden ? -1 : undefined} onClick={() => onPick(t)}>{t}</button> : t}</li>)}
    </ul>
  );
  return (
    <div ref={ref} className={`ay-ribbon${offscreen ? ' is-offscreen' : ''} ${className}`}>
      {tab}
      <div className="ay-ribbon__view"><div className="ay-ribbon__track">{row(false)}{row(true)}</div></div>
    </div>
  );
}

/* Closing letter: paper card in a pink envelope with a wax seal. */
export function Envelope({ children, className = '' }) {
  return (
    <div className={`ay-envelope ${className}`}>
      <span className="ay-envelope__back" aria-hidden="true" />
      <div className="ay-envelope__letter">{children}</div>
      <span className="ay-envelope__flap" aria-hidden="true">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0.8 0.8 50 38 99.2 0.8V59.2H0.8Z" fill="#f7badd" stroke="#3e2723" strokeWidth="1" vectorEffect="non-scaling-stroke" /></svg>
      </span>
      <span className="ay-envelope__seal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg></span>
    </div>
  );
}
