import { useState } from 'react';
import { useRoutines } from './useRoutines.js';
import { isMedicineProduct } from '../../health/medicineProduct.js';
import { Plate } from '../ui/ay/index.js';
import { resolveCatalogProductImage } from '../ProductTileImage.jsx';
import './routine-timeline.css';

/**
 * Her routine as a day timeline (founder Oct 26 21:45: "a day timeline, not a
 * carousel of small cards"). The Start-here steps of every active routine,
 * grouped by when they happen ("When cramps start", "During your period",
 * "Every night"). Each step: one big square photo (the old product-card
 * look), its name and one line of why; a tap opens How, When and how long.
 * The section that applies right now (her cycle day, the time of day) is the
 * pink "Now" block. Same data as RoutineSummary (useRoutines); medicines are
 * information only and never listed here.
 */
const cap = (x) => (x ? `${x.charAt(0).toUpperCase()}${x.slice(1)}` : '');
const ICON = { habit: 'M12 6v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', track: 'M5 19V9m7 10V5m7 14v-7' };
const TONES = ['butter', 'ink', 'deep'];

// Is this "when" happening now? From her cycle day and the clock only.
function isNow(when, cycle, hour) {
  const w = String(when || '').toLowerCase();
  const onPeriod = cycle?.cycleDay && cycle.cycleDay <= (cycle.periodLength || 5);
  if (/period|cramp|bleed/.test(w)) return Boolean(onPeriod);
  if (/night|bed|evening/.test(w)) return hour >= 17 || hour < 4;
  if (/morning/.test(w)) return hour >= 4 && hour < 12;
  return false;
}

function Step({ it, onOpenProduct }) {
  const [open, setOpen] = useState(false);
  const id = `ay-rtl-${it.key}`;
  const product = it.kind === 'product';
  return (
    <li className={`ay-rtl__step${open ? ' is-open' : ''}`}>
      <div className="ay-rtl__photo">
        {product
          ? <Plate src={resolveCatalogProductImage(it.product) || ''} alt="" fallback={it.product?.brand || it.title} className="ay-rtl__plate" />
          : <span className="ay-rtl__habit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICON.habit} /></svg></span>}
      </div>
      <div className="ay-rtl__body">
        <h4 className="ay-rtl__name">{it.title}</h4>
        {it.why && <p className="ay-rtl__why">{it.why}</p>}
        <button type="button" className="ay-rtl__more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {open ? 'Less' : 'How and when'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <dl id={id} className="ay-rtl__detail" hidden={!open}>
          {it.when && <div><dt>When</dt><dd>{cap(it.when)}</dd></div>}
          {it.how && <div><dt>How</dt><dd>{it.how}</dd></div>}
          {it.horizon && <div><dt>Try it for</dt><dd>{it.horizon.label}</dd></div>}
          {it.know && <div><dt>How you will know</dt><dd>{it.know}</dd></div>}
        </dl>
        {product && onOpenProduct && <button type="button" className="ay-rtl__open" onClick={() => onOpenProduct(it.product)}>See product</button>}
      </div>
    </li>
  );
}

export default function RoutineTimeline({ cycle = null, onOpenRoutine, onOpenProduct, onCheckIn, emptyAction = null, max = 3, ...source }) {
  const { routines } = useRoutines(source);
  const list = routines.slice(0, max);
  if (!list.length) {
    return (
      <div className="ay-rtl is-empty">
        <p>Your routine shows here once you add products.</p>
        {emptyAction}
      </div>
    );
  }
  const hour = new Date().getHours();
  // One timeline across her routines: steps grouped by when they happen, in the order they first appear.
  const groups = [];
  const seen = new Set();
  for (const r of list) {
    for (const it of r.start) {
      if (it.kind === 'product' && isMedicineProduct(it.product)) continue;
      if (seen.has(it.key)) continue;
      seen.add(it.key);
      const when = cap(it.when || 'Any time');
      let g = groups.find((x) => x.when === when);
      if (!g) { g = { when, steps: [], now: isNow(when, cycle, hour) }; groups.push(g); }
      g.steps.push(it);
    }
  }
  const tracks = list.map((r) => r.track).filter(Boolean);
  let tone = 0;
  return (
    <div className="ay-rtl">
      <ol className="ay-rtl__line">
        {groups.map((g) => (
          <li key={g.when} className={`ay-rtl__sec is-${g.now ? 'now' : TONES[tone++ % TONES.length]}`}>
            <h3 className="ay-rtl__when">{g.now && <em>Now</em>}{g.when}</h3>
            <ul>{g.steps.map((it) => <Step key={it.key} it={it} onOpenProduct={onOpenProduct} />)}</ul>
          </li>
        ))}
        {tracks.length > 0 && (
          <li className="ay-rtl__sec is-track">
            <h3 className="ay-rtl__when">Your check-in</h3>
            <button type="button" className="ay-rtl__check" onClick={onCheckIn} disabled={!onCheckIn}>
              <span className="ay-rtl__habit is-small" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICON.track} /></svg></span>
              <span><b>{tracks.map((t, i) => (i ? `${t.title.charAt(0).toLowerCase()}${t.title.slice(1)}` : t.title)).join(' and ')}</b><small>About 30 seconds{onCheckIn ? '. Check in' : ''}</small></span>
            </button>
          </li>
        )}
      </ol>
      {onOpenRoutine && <button type="button" className="ay-rtl__all" onClick={onOpenRoutine}>See your full routine</button>}
    </div>
  );
}
