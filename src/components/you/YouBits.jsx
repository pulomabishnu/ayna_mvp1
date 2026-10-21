import { useEffect, useRef, useState } from 'react';
import { readBlend, applyBlend } from '../../utils/houseBlend.js';
import { toast } from '../../utils/toast.js';
import './you-bits.css';

/* Pieces for You (website and app). Board: 72419ae7 (outlined stat boxes,
   segmented pill tabs), Bordeaux arch frame, 007b85fd "house blend"
   this-or-that sliders. Rebuilt in ayna's outline + offset language. */

/** Three outlined stat boxes; each is a button to the thing it counts. */
export function StatBoxes({ items, className = '' }) {
  return (
    <ul className={`ay-stats ${className}`} aria-label="Your numbers">
      {items.map((s) => (
        <li key={s.key}>
          <button type="button" className="ay-stat" onClick={s.onClick} disabled={!s.onClick} aria-label={`${s.value == null ? 'Loading' : s.value} ${s.label}`}>
            <b className={s.value == null ? 'is-loading' : ''}>{s.value == null ? <span className="ay-skel ay-stat__skel" /> : s.value}</b>
            <span>{s.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Segmented pill tab bar (WAI-ARIA tabs: arrows, Home, End). */
export function PillTabs({ tabs, active, onChange, label, idBase = 'ay-ptab' }) {
  const ref = useRef(null);
  const onKey = (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[n].id);
    requestAnimationFrame(() => ref.current?.querySelector(`#${idBase}-${tabs[n].id}`)?.focus());
  };
  return (
    <div className="ay-ptabs" role="tablist" aria-label={label} ref={ref} onKeyDown={onKey} style={{ '--n': tabs.length, '--i': Math.max(0, tabs.findIndex((t) => t.id === active)) }}>
      <span className="ay-ptabs__thumb" aria-hidden="true" />
      {tabs.map((t) => (
        <button key={t.id} id={`${idBase}-${t.id}`} type="button" role="tab" aria-selected={t.id === active} aria-controls={`${idBase}-panel`} tabIndex={t.id === active ? 0 : -1} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}

/** Profile photo (or initials) in an arch frame. */
export function ArchAvatar({ src, initial, onError, className = '' }) {
  return (
    <span className={`ay-arch${src ? ' has-photo' : ''} ${className}`} aria-hidden="true">
      {src ? <img src={src} alt="" onError={onError} /> : <span>{initial}</span>}
    </span>
  );
}

const TONES = ['pink', 'sky', 'butter', 'pink'];

/**
 * Your house blend: four this-or-that sliders over her real quiz answers.
 * onSave(nextIntake) saves through the same path as the quiz and resolves
 * true/false; a failed save puts the slider back and says so.
 */
export function HouseBlend({ intake, onSave, className = '', headingLevel = 2 }) {
  const rows = readBlend(intake);
  const [draft, setDraft] = useState({});
  const timers = useRef({});
  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);
  if (!intake) return null;
  const H = `h${headingLevel}`;
  const commit = (row, v) => {
    window.clearTimeout(timers.current[row.id]);
    timers.current[row.id] = window.setTimeout(async () => {
      const ok = await Promise.resolve(onSave?.(applyBlend(intake, row.id, v))).catch(() => false);
      setDraft((d) => { const n = { ...d }; delete n[row.id]; return n; });
      toast(ok ? `Saved: ${row.steps[v]}. Your matches re-rank.` : 'Couldn’t save that. Check your connection and try again.');
    }, 600);
  };
  return (
    <section className={`ay-blend ${className}`} aria-labelledby="ay-blend-h">
      <H className="ay-blend__h" id="ay-blend-h">Your house blend</H>
      <p className="ay-blend__sub">From your quiz answers. Slide to change one.</p>
      <ul className="ay-blend__rows">
        {rows.map((row, i) => {
          const value = draft[row.id] ?? row.value;
          const unset = value == null;
          const max = row.steps.length - 1;
          const shown = unset ? Math.floor(max / 2) : value;
          const id = `ay-blend-${row.id}`;
          return (
            <li key={row.id} className={`ay-blend__row is-${TONES[i]}${unset ? ' is-unset' : ''}`}>
              <div className="ay-blend__ends" aria-hidden="true"><span>{row.left}</span><span>{row.right}</span></div>
              <input
                id={id}
                type="range"
                min={0}
                max={max}
                step={1}
                value={shown}
                disabled={!onSave}
                aria-label={`${row.left} or ${row.right}`}
                aria-valuetext={unset ? 'Not set yet' : row.steps[value]}
                aria-describedby={`${id}-note`}
                style={{ '--pct': `${(shown / max) * 100}%` }}
                onChange={(e) => { const v = Number(e.target.value); setDraft((d) => ({ ...d, [row.id]: v })); commit(row, v); }}
              />
              <p className="ay-blend__now" id={`${id}-note`}><b>{unset ? 'Not set yet' : row.steps[value]}</b> <span>{row.note}</span></p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
