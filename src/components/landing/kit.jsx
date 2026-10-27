import { useEffect, useState } from 'react';
import SmartSearchInput from '../search/SmartSearchInput.jsx';
import { HOME_SEARCH_HINTS } from '../shop/homeSearchHints.js';
import { motionOff } from '../../utils/motion.js';
import { RAIN_COLS } from './rainData.js';
import './landing-kit.css';

/*
 * The landing kit, shared by the website's / (WebLanding) and the app's
 * one-screen landing (AppLanding): the raining collage and the hero search.
 *
 * Rain (founder, Oct 27 10:40: "pictures and stuff sliding down without a
 * background"): real catalog packshots falling as cut-outs, with small
 * frameless widgets of the app between them. Packshots are on white, so in
 * light mode they multiply onto the butter field and the white disappears.
 * In dark mode each packshot sits on a soft butter circle instead (multiply
 * would turn them dark on espresso). Widgets are their own small shapes
 * (a ring, a pill, a row of dots), never cards, and every one that looks like
 * health data says Sample. All decoration: aria-hidden, still under reduced
 * motion and Pause motion.
 */

const src = (id) => `/products/catalog/${id}.webp`;

const Sample = () => <span className="lk-sample">Sample</span>;

function Ring({ value = 24, of = 28 }) {
  const r = 22; const c = 2 * Math.PI * r;
  return (
    <svg className="lk-ring" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} className="lk-ring__track" />
      <circle cx="28" cy="28" r={r} className="lk-ring__arc" strokeDasharray={`${(c * value / of).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 28 28)" />
      <text x="28" y="34" textAnchor="middle">{value}</text>
    </svg>
  );
}
const SPARK = [6, 9, 7, 8, 11, 10, 13];
function Spark({ w = 112, h = 40 }) {
  const lo = Math.min(...SPARK); const hi = Math.max(...SPARK);
  const pts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * (w - 10) + 5},${h - 5 - ((v - lo) / (hi - lo)) * (h - 12)}`);
  const [lx, ly] = pts[pts.length - 1].split(',');
  return <svg className="lk-spark" viewBox={`0 0 ${w} ${h}`}><polyline points={pts.join(' ')} /><circle cx={lx} cy={ly} r="4" /></svg>;
}
// A month of dots, a few period days filled pink (Your month, the calendar sheet on Home).
const MONTH = Array.from({ length: 28 }, (_, i) => (i >= 3 && i <= 7 ? 'p' : i === 17 ? 'o' : ''));

function Drop({ t, eager }) {
  switch (t.k) {
    case 'p':
      return (
        <span className={`lk-d lk-prod is-${t.s || 'm'}`}>
          <span className="lk-prod__in"><img src={src(t.id)} alt="" width="160" height="160" loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'auto' : 'low'} /></span>
        </span>
      );
    case 'ring':
      return <span className="lk-d lk-w lk-w--ring"><Ring /><b>Cycle day</b><Sample /></span>;
    case 'match':
      return <span className="lk-d lk-w lk-w--match"><span className="lk-pill">87% match</span><Sample /></span>;
    case 'streak':
      return (
        <span className="lk-d lk-w lk-w--streak">
          <b>4-day streak</b>
          <span className="lk-dots">{[1, 1, 1, 1, 0, 0, 0].map((on, i) => <i key={i} className={on ? 'is-on' : ''} />)}</span>
          <Sample />
        </span>
      );
    case 'spark':
      return <span className="lk-d lk-w lk-w--spark"><Spark /><b>Resting heart rate</b><Sample /></span>;
    case 'sleep':
      return (
        <span className="lk-d lk-w lk-w--sleep">
          <span className="lk-bars">{[7, 5, 8, 6, 9, 4, 6].map((v, i) => <i key={i} style={{ '--h': v / 9 }} />)}</span>
          <b>Sleep 6h 40m</b><Sample />
        </span>
      );
    case 'month':
      return (
        <span className="lk-d lk-w lk-w--month">
          <b>Your month</b>
          <span className="lk-month">{MONTH.map((m, i) => <i key={i} className={m ? `is-${m}` : ''} />)}</span>
          <Sample />
        </span>
      );
    case 'ask':
      return <span className="lk-d lk-w lk-w--ask"><span className="lk-bubble">What helps with cramps at night?</span><small>Ask ayna</small></span>;
    case 'rundown':
      return <span className="lk-d lk-w lk-w--rundown"><span className="lk-count">3</span><b>Rundown</b><Sample /></span>;
    default:
      return null;
  }
}

const SPEEDS = [46, 54, 42, 50, 44, 56];

/** The raining collage. cols columns starting at column `from`. Decoration only. */
export function Rain({ cols = 3, from = 0, className = '' }) {
  const list = RAIN_COLS.slice(from, from + cols);
  return (
    <div className={`lk-rain ${className}`.trim()} aria-hidden="true" style={{ '--cols': list.length }}>
      {list.map((col, c) => (
        <div key={c} className="lk-rain__col" style={{ '--dur': `${SPEEDS[(from + c) % SPEEDS.length]}s`, '--delay': `${-((from + c) * 9 % 23)}s` }}>
          <div className="lk-rain__run">
            {[0, 1].map((copy) => (
              <div key={copy} className="lk-rain__set">
                {col.map((t, i) => <Drop key={`${copy}-${i}`} t={t} eager={!copy && i < 2} />)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;

/** The hero search with a rotating example (the tips never cover .lsx-search). */
export function HeroSearch({ onSearch, className = '' }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (q || focused || motionOff()) return undefined;
    const t = window.setInterval(() => setI((v) => (v + 1) % HOME_SEARCH_HINTS.length), 2800);
    return () => window.clearInterval(t);
  }, [q, focused]);
  return (
    <form className={`lsx-search ${className}`.trim()} role="search" onSubmit={(e) => { e.preventDefault(); onSearch?.(q); }}>
      <label>
        <span className="lk-sr">Search products</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <SmartSearchInput
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          suggest={{ kinds: ['need', 'category', 'brand', 'product'], limit: 6 }}
          onPick={(s) => onSearch?.(s.query)} anchor=".lsx-search" placeholder=" " enterKeyHint="search" autoComplete="off"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {!q && <span className="lsx-search__hint" aria-hidden="true">Try: <b key={i}>{HOME_SEARCH_HINTS[i]}</b></span>}
      </label>
      <button type="submit" aria-label="Search"><Arrow /></button>
    </form>
  );
}
