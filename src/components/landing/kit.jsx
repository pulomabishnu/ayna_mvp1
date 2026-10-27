import { useEffect, useState } from 'react';
import SmartSearchInput from '../search/SmartSearchInput.jsx';
import { HOME_SEARCH_HINTS } from '../shop/homeSearchHints.js';
import { motionOff } from '../../utils/motion.js';
import { isPlainLeftClick } from '../../utils/productRoute.js';
import { PARTNER_BRANDS } from '../../utils/partnerBrands.js';
import { Marquee } from '../ui/ay/index.js';
import useMotionPaused from './useMotionPaused.js';
import { RAIN_COLS } from './rainData.js';
import './landing-kit.css';

/*
 * The landing kit, shared by the website's / (WebLanding) and the app's
 * one-screen landing (AppLanding): the raining background, the hero search
 * and the brown and pink bar.
 *
 * Rain (founder, Oct 27 10:40-11:36: "pictures and stuff sliding down", "put
 * it in the back, make it kinda transparent", "i liked the fun aspect"):
 * real catalog packshots and a few of the app's shapes (a cycle ring, streak
 * dots, a chart line, a match pill), drifting down around the edges behind the
 * centred hero, in a soft see-through layer. No numbers, so nothing reads as
 * data. Packshots are on white: on butter they multiply and the white
 * disappears (cut-outs); on espresso (`onInk`, and in dark mode) each sits on
 * a small rounded butter tile. Decoration only: aria-hidden, no pointer
 * events, still under reduced motion and Pause motion.
 */

const src = (id) => `/products/catalog/${id}.webp`;

function Ring() {
  const r = 22; const c = 2 * Math.PI * r;
  return (
    <svg className="lk-ring" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} className="lk-ring__track" />
      <circle cx="28" cy="28" r={r} className="lk-ring__arc" strokeDasharray={`${(c * 0.7).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 28 28)" />
    </svg>
  );
}
const SLEEP = [7, 5, 8, 6, 9, 4, 6];
// A month of dots, a few period days filled (Your month, the calendar sheet on Home).
const MONTH = Array.from({ length: 21 }, (_, i) => (i >= 2 && i <= 5 ? 'p' : ''));

// Each of the app's features as a small recognisable shape with a one-word
// label (words only, never a number, so nothing reads as her data).
function Widget({ k }) {
  switch (k) {
    case 'ring':
      return <><Ring /><small>Cycle</small></>;
    case 'sleep':
      return <><span className="lk-bars">{SLEEP.map((v, i) => <i key={i} style={{ '--h': v / 9 }} />)}</span><small>Sleep</small></>;
    case 'streak':
      return <><span className="lk-dots">{[1, 1, 1, 1, 0, 0, 0].map((on, i) => <i key={i} className={on ? 'is-on' : ''} />)}</span><small>Streak</small></>;
    case 'match':
      return <span className="lk-pill"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>Match</span>;
    case 'ask':
      return <span className="lk-bubble">Ask ayna</span>;
    case 'month':
      return <><span className="lk-month">{MONTH.map((m, i) => <i key={i} className={m ? 'is-p' : ''} />)}</span><small>Your month</small></>;
    default:
      return null;
  }
}

// One even slot per item (a jittered grid: columns fall at different speeds
// and alternate sides), products and the app's features taking turns.
function Drop({ t, eager }) {
  if (t.k === 'p') {
    return (
      <span className="lk-slot">
        <span className={`lk-d lk-prod is-${t.s || 'm'}`}>
          <span className="lk-prod__in"><img src={src(t.id)} alt="" width="160" height="160" loading="eager" decoding="async" fetchPriority={eager ? 'auto' : 'low'} /></span>
        </span>
      </span>
    );
  }
  return <span className="lk-slot"><span className={`lk-d lk-w lk-w--${t.k}`}><Widget k={t.k} /></span></span>;
}

// Slow but visible: one fall takes 40 to 60 seconds, each column at its own pace.
const SPEEDS = [48, 58, 44, 54];
// Six copies of each column, one copy's height per loop (lk-fall in landing-kit.css).
const COPIES = [0, 1, 2, 3, 4, 5];

/** The raining background: `cols` columns (the CSS may show fewer). Decoration only. */
export function Rain({ cols = 4, layout = RAIN_COLS, onInk = false, className = '' }) {
  const list = layout.slice(0, cols);
  return (
    <div className={`lk-rainbox${onInk ? ' lk-rainbox--ink' : ''} ${className}`.trim()} aria-hidden="true">
      <div className="lk-rain" style={{ '--cols': list.length }}>
        {list.map((col, c) => (
          <div key={c} className="lk-rain__col" style={{ '--dur': `${SPEEDS[c % SPEEDS.length]}s`, '--delay': `${-(c * 37 % 61)}s` }}>
            <div className="lk-rain__run">
              {COPIES.map((copy) => (
                <div key={copy} className="lk-rain__set">
                  {col.map((t, i) => <Drop key={`${copy}-${i}`} t={t} eager={!copy} />)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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

/* The brown and pink bar (founder, Oct 27 11:36: "i liked also the brown and
   pink bar we used to have that was cute"): an espresso tab, then the real
   partner names running on pink. Paused by reduced motion, on hover, and by
   Pause motion (this button and the footer share one setting; it also stops
   the rain). */
export function BrandBar({ onOpen, href = '/partners', className = '' }) {
  const [paused, toggle] = useMotionPaused();
  return (
    <section className={`lk-bar ${className}`.trim()} aria-labelledby="lk-bar-title">
      <h2 id="lk-bar-title" className="lk-sr">Brands we work with</h2>
      <a className="lk-bar__tab" href={href} onClick={(e) => { if (!onOpen || !isPlainLeftClick(e)) return; e.preventDefault(); onOpen(); }}><span className="lk-bar__long">Brands we work with</span><span className="lk-bar__short" aria-hidden="true">Our brands</span><Arrow /></a>
      <Marquee items={PARTNER_BRANDS.map((b) => b.name)} tone="pink" className="lk-bar__run" />
      <button type="button" className="lk-bar__pause" aria-pressed={paused} onClick={toggle} aria-label={paused ? 'Play motion' : 'Pause motion'}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="M8 5l11 7-11 7z" /> : <path d="M8 5v14M16 5v14" />}</svg>
      </button>
    </section>
  );
}
