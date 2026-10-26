import { useState } from 'react';
import { splitShow } from '../../pdp/pdpParts.js';
import './ay-primitives.css';

/*
 * The shared look (v2 audits, section 10): the signature elements every page
 * uses, rebuilt in butter, espresso and pink. Plate, Chip, PillTabs and the
 * buttons have their own files; these are the rest. See PRIMITIVES.md.
 */

/**
 * Scallop / wave edge (#8 Nectar header scallops, #10 Hey Georgia and #31
 * Gerry's wavy dividers): ONLY at a section edge (the espresso header band,
 * the footer). Never inside cards. `shape`: 'scallop' (round lobes) | 'wave'.
 * The svg is the colour of the band it hangs from (`tone`).
 */
export function ScallopEdge({ side = 'bottom', tone = 'ink', shape = 'scallop', className = '' }) {
  // 24 lobes / 6 waves across; scales with the width, fixed 12px tall.
  const d = shape === 'wave'
    ? `M0 0H240V6${Array.from({ length: 6 }, (_, i) => `Q${230 - i * 40} 12 ${220 - i * 40} 6Q${210 - i * 40} 0 ${200 - i * 40} 6`).join('')}Z`
    : `M0 0H240V6${Array.from({ length: 24 }, (_, i) => `A5 5 0 0 1 ${230 - i * 10} 6`).join('')}Z`;
  return (
    <svg className={`ayk-edge is-${side} is-${tone} ${className}`.trim()} viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

/**
 * Big-number fact (#29 Glossier "80% / 90%" claims, #56 Huel "20g protein",
 * #6 journal "420"): Bricolage 800 number + a 13px caption on a white tile.
 * A number is never shown alone. `inline`: caption beside the number (#29, #56).
 */
export function BigFact({ value, unit = '', caption, label = '', inline = false, className = '' }) {
  return (
    <div className={`ayk-fact${inline ? ' is-inline' : ''} ${className}`.trim()}>
      {label && <span className="ayk-fact__label">{label}</span>}
      <span className="ayk-fact__num">{value}{unit && <span className="ayk-fact__unit">{unit}</span>}</span>
      <span className="ayk-fact__cap">{caption}</span>
    </div>
  );
}

/**
 * Label / value rows with thin rules (#58 The Ordinary "Targets / Cleansing",
 * #17 nutrient rows): every fact list (product, service, health metric,
 * settings). Label above value by default ("Sleep / Less than usual"); pass
 * `columns` for a two-column table on wide screens.
 */
export function FactRows({ rows = [], className = '', columns = false }) {
  const list = rows.filter((r) => r && r.value != null && r.value !== '');
  if (!list.length) return null;
  return (
    <dl className={`ayk-rows${columns ? ' is-columns' : ''} ${className}`.trim()}>
      {list.map((r) => (
        <div className="ayk-rows__row" key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}{r.note && <span className="ayk-rows__note">{r.note}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One category sticker per card (#9 Nectar, #39 Glossier, #53 Glowie): small outlined label, top-left of the plate (Period · Pain · Sleep). */
export function CategorySticker({ children, className = '' }) {
  return <span className={`ayk-sticker ${className}`.trim()}>{children}</span>;
}

/** Status pill (#4 "In progress / Completed", #52 "Sale / Low stock"): "In my routine", "Day 7", "In 5 days", "New". `tone`: 'ink' (on) | 'quiet'. */
export function StatusPill({ children, tone = 'quiet', className = '' }) {
  return <span className={`ayk-status is-${tone} ${className}`.trim()}>{children}</span>;
}

/**
 * Progress as a count (#12 Pai "2/6 tasks", #15 GlowCare "0/4 step"),
 * starting with what she already did ("2 of 7 days"). An optional thin bar.
 * Rings are only for cycle and routine streak: use CountRing for those.
 */
export function ProgressCount({ done = 0, total, unit = '', bar = true, className = '' }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
  const text = `${done} of ${total}${unit ? ` ${unit}` : ''}`;
  return (
    <div className={`ayk-progress ${className}`.trim()}>
      <span className="ayk-progress__text">{text}</span>
      {bar && <span className="ayk-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={text}><span style={{ width: `${pct}%` }} /></span>}
    </div>
  );
}

/** The ring, for cycle day and routine streak ONLY (#61 Elure "4/21 days", #15 GlowCare). Count in the middle, caption under. */
export function CountRing({ value = 0, total, caption = '', size = 72, className = '' }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <div className={`ayk-ring ${className}`.trim()} style={{ '--ayk-ring-size': `${size}px` }}>
      <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <circle className="ayk-ring__track" cx="18" cy="18" r={r} />
        <circle className="ayk-ring__fill" cx="18" cy="18" r={r} strokeDasharray={`${(c * pct).toFixed(2)} ${c.toFixed(2)}`} transform="rotate(-90 18 18)" />
      </svg>
      <span className="ayk-ring__num">{value}<span className="ayk-ring__of">/{total}</span></span>
      {caption && <span className="ayk-ring__cap">{caption}</span>}
      <span className="sr-only">{`${value} of ${total}${caption ? ` ${caption}` : ''}`}</span>
    </div>
  );
}

const Tick = () => <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
const Cross = () => <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>;

/** "Show all N" in place: the strongest few first; nothing is cut, the rest are hidden until asked. */
export function ShowAllList({ items = [], n = 3, render, label = '', className = '', itemClassName = '' }) {
  const [open, setOpen] = useState(false);
  const { shown, rest, total } = splitShow(items, n);
  if (!total) return null;
  return (
    <>
      <ul className={`ayk-list ${className}`.trim()}>
        {shown.map((x, i) => <li key={i} className={itemClassName || undefined}>{render(x, i)}</li>)}
        {rest.map((x, i) => <li key={i + shown.length} className={itemClassName || undefined} hidden={!open || undefined}>{render(x, i + shown.length)}</li>)}
      </ul>
      {rest.length > 0 && (
        <button type="button" className="ayk-showall" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show fewer' : `Show all ${total}${label ? ` ${label}` : ''}`}
        </button>
      )}
    </>
  );
}

/** Do / Don't (or Good for / Not for), from #21 Clean Curls: tick and cross, two columns, 3 + 2 visible then "Show all". */
export function DoDont({ good = [], bad = [], goodTitle = 'Good for', badTitle = 'Not for', className = '' }) {
  return (
    <div className={`ayk-dodont ${className}`.trim()}>
      {good.length > 0 && <div className="ayk-dodont__col is-good">
        <h3 className="ay-t-h3">{goodTitle}</h3>
        <ShowAllList items={good} n={3} render={(x) => <><Tick />{x}</>} />
      </div>}
      {bad.length > 0 && <div className="ayk-dodont__col is-bad">
        <h3 className="ay-t-h3">{badTitle}</h3>
        <ShowAllList items={bad} n={2} render={(x) => <><Cross />{x}</>} />
      </div>}
    </div>
  );
}

/**
 * Standards, said once per page in one full-width band (#18 Tower 28 three-up
 * "Safety first / ...", #47 the one-line guideline band): ".gov-checked",
 * "Partnerships never change your match", "Not medical advice". Never per
 * card. Items: strings, or { title, text, icon } (up to 3 across).
 */
export function StandardsBand({ items = [], className = '' }) {
  if (!items.length) return null;
  return (
    <ul className={`ayk-standards ${className}`.trim()}>
      {items.slice(0, 3).map((x) => {
        const it = typeof x === 'string' ? { title: x } : x;
        return (
          <li key={it.title || it.text}>
            {it.icon && <span className="ayk-standards__icon" aria-hidden="true">{it.icon}</span>}
            {it.title && <b>{it.title}</b>}
            {it.text && <span>{it.text}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Calm register for health content (#24 Rhode restraint, #3 heart-health apps): white surface, ink left rule, Figtree, no pink, no stickers. */
export function CalmBlock({ title = '', as = 'section', children, className = '', ...rest }) {
  const Tag = as;
  return (
    <Tag className={`ayk-calm ${className}`.trim()} {...rest}>
      {title && <h3 className="ay-t-h3">{title}</h3>}
      {children}
    </Tag>
  );
}

/** Pink as a full section background (#27 Tellmi, #39 Glossier home), at most one per page, never behind health findings. */
export function PinkSection({ as = 'section', children, className = '', ...rest }) {
  const Tag = as;
  return <Tag className={`ayk-pink ${className}`.trim()} {...rest}>{children}</Tag>;
}
