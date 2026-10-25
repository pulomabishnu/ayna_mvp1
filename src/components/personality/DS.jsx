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

/** A perforated postage stamp holding today's date: the day as the numeral, the weekday under it. */
export function DateStamp({ iso, tone = 'pink', className = '' }) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return (
    <span className={`ds-stamp ds-stamp--${tone} ds-datestamp ${className}`.trim()} aria-hidden="true">
      <span className="ds-stamp__in">
        <small>{d.toLocaleDateString('en-US', { month: 'short' })}</small>
        <b>{d.getDate()}</b>
        <small>{d.toLocaleDateString('en-US', { weekday: 'short' })}</small>
      </span>
    </span>
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

/** Her products' real photos as die-cut stickers (white tile, outline, hard shadow, tilt). Renders nothing without photos. */
export function ProductStickers({ products = [], max = 3, className = '' }) {
  const list = products.filter((p) => photoOf(p)).slice(0, max);
  if (!list.length) return null;
  return (
    <span className={`ds-pstickers ${className}`.trim()} aria-hidden="true">
      {list.map((p, i) => <span key={p.id || i} className={`ds-psticker is-${i + 1}`}><img src={photoOf(p)} alt="" /></span>)}
    </span>
  );
}

/** Her cycle day as a drawn ring. The arc is drawn only against her own usual length; otherwise a dotted ring. */
export function CycleRing({ day, length = null, className = '' }) {
  if (!day) return null;
  const frac = length ? Math.min(1, day / length) : null;
  const C = 2 * Math.PI * 38;
  return (
    <span className={`ds-ring ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 92 92">
        <circle cx="46" cy="46" r="38" className="is-track" />
        {frac != null && <circle cx="46" cy="46" r="38" className="is-arc" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 46 46)" />}
        {frac != null && <circle cx={46 + 38 * Math.sin(2 * Math.PI * frac)} cy={46 - 38 * Math.cos(2 * Math.PI * frac)} r="5.5" className="is-dot" />}
      </svg>
      <b><small>Cycle day</small>{day}</b>
    </span>
  );
}
