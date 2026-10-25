import { useEffect, useId, useState } from 'react';
import { dieCut } from './cutout.js';
/**
 * Oct 21-22 design language, shared by the website and the app
 * (scratchpad DESIGN_SYSTEM_OCT25.md). Decoration only: every piece here is
 * aria-hidden and carries no information that is not also in the text.
 * Styles: src/styles/ds.css (loaded by both shells).
 */

/** Simple marks drawn for ayna (never brand art): asterisk, sparkle, flower, wave, heart, star. */
const MARKS = {
  asterisk: <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  sparkle: <path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5-.7-5.6-4.9-9.8-10.5-10.5C7.1 11.3 11.3 7.1 12 1.5z" fill="currentColor" />,
  flower: <path d="M12 9.2a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm0 12.4a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zM5.8 15.4a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zm12.4 0a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8zM12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" fill="currentColor" />,
  wave: <path d="M1.5 14c2.6 0 2.6-4 5.25-4s2.6 4 5.25 4 2.6-4 5.25-4 2.6 4 5.25 4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
  heart: <path d="M12 20.5s-8.5-5.2-8.5-11a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5c0 5.8-8.5 11-8.5 11z" fill="currentColor" />,
  star: <path d="M12 2.2l2.6 6.1 6.6.5-5 4.3 1.6 6.5L12 16.1l-5.8 3.5 1.6-6.5-5-4.3 6.6-.5z" fill="currentColor" />,
  moon: <path d="M15.5 2.8a9.5 9.5 0 1 0 5.7 13.6A7.6 7.6 0 0 1 15.5 2.8z" fill="currentColor" />,
};

export function Mark({ name = 'sparkle', className = '', style }) {
  return (
    <svg className={`ds-mark ${className}`.trim()} style={style} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {MARKS[name] || MARKS.sparkle}
    </svg>
  );
}

/** A round sticker with one mark in it, for a card corner. */
export function MarkSticker({ name = 'sparkle', tone = 'butter', className = '' }) {
  return (
    <span className={`ds-sticker ds-sticker--${tone} ${className}`.trim()} aria-hidden="true">
      <Mark name={name} />
    </span>
  );
}

const photoOf = (p) => p?.image || p?.imageUrl || p?.image_url || '';

/**
 * Her products' real photos as die-cut stickers: the product cut out of its
 * white backdrop, a thin white die-cut edge with an espresso hairline, a
 * small tilt (cutout.js). Photos that cut cleanly go first; until the cut is
 * ready (or if it can't be made) nothing shows, never a white photo frame.
 * Renders nothing without photos.
 */
export function ProductStickers({ products = [], max = 3, className = '' }) {
  const srcs = [...new Set(products.map(photoOf).filter(Boolean))].slice(0, max + 3);
  const key = srcs.join('|');
  const [cuts, setCuts] = useState({ key: '', list: [] });
  useEffect(() => {
    let live = true;
    const want = key ? key.split('|') : [];
    Promise.all(want.map((s) => dieCut(s))).then((res) => {
      if (!live) return;
      const ok = res.filter(Boolean);
      setCuts({ key, list: [...ok.filter((r) => r.clean), ...ok.filter((r) => !r.clean)].slice(0, max) });
    });
    return () => { live = false; };
  }, [key, max]);
  if (!srcs.length) return null;
  const list = cuts.key === key ? cuts.list : [];
  return (
    <span className={`ds-pstickers ${className}`.trim()} aria-hidden="true">
      {list.map((c, i) => <span key={`${i}-${c.url.length}`} className={`ds-psticker is-${i + 1}${c.clean ? '' : ' is-photo'}`}><img src={c.url} alt="" /></span>)}
    </span>
  );
}

/** Her cycle day as a drawn ring. The arc is drawn only against her own usual length; otherwise a dotted ring. */
export function CycleRing({ day, length = null, className = '', label = 'Cycle day', value = null }) {
  // `value` + `label`: another headline number in the same ring (last night's sleep), dotted track, no arc.
  if (!day && !value) return null;
  const frac = day && length ? Math.min(1, day / length) : null;
  const C = 2 * Math.PI * 38;
  return (
    <span className={`ds-ring${value ? ' is-text' : ''} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 92 92">
        <circle cx="46" cy="46" r="38" className="is-track" />
        {frac != null && <circle cx="46" cy="46" r="38" className="is-arc" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 46 46)" />}
        {frac != null && <circle cx={46 + 38 * Math.sin(2 * Math.PI * frac)} cy={46 - 38 * Math.cos(2 * Math.PI * frac)} r="5.5" className="is-dot" />}
      </svg>
      <b><small>{value ? label : 'Cycle day'}</small>{value || day}</b>
    </span>
  );
}

/** Seven date pills around today, today filled (decorative: the date is also in text). */
export function DayStrip({ iso, className = '' }) {
  const base = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!base || Number.isNaN(base.getTime())) return null;
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i - 3); return d; });
  return (
    <ol className={`ds-days ${className}`.trim()} aria-hidden="true">
      {days.map((d, i) => (
        <li key={i} className={i === 3 ? 'is-today' : ''}>
          <small>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</small>
          <b>{d.getDate()}</b>
        </li>
      ))}
    </ol>
  );
}

/** Geometric drawn shapes around a hero (flower, asterisk, slash, dot), stroke matched to the display face. */
export function Shapes({ className = '' }) {
  return (
    <span className={`ds-shapes ${className}`.trim()} aria-hidden="true">
      <Mark name="flower" className="ds-shape is-flower" />
      <Mark name="asterisk" className="ds-shape is-asterisk" />
      <svg className="ds-shape is-slash" viewBox="0 0 24 24"><path d="M6 21L18 3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
      <i className="ds-shape is-dot" />
    </span>
  );
}

/** A curved-text ring around a number ("your week · your week"). Decorative. */
export function CurvedRing({ text = 'your week · your week · ', className = '' }) {
  const id = `ds-curved-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`ds-curved ${className}`.trim()} viewBox="0 0 100 100" aria-hidden="true">
      <defs><path id={id} d="M50 50m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0" /></defs>
      <text><textPath href={`#${id}`}>{text}</textPath></text>
    </svg>
  );
}
