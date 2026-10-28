import { useState } from 'react';
import { useRoutines } from './useRoutines.js';
import { isMedicineProduct } from '../../health/medicineProduct.js';
import { Plate } from '../ui/ay/index.js';
import { resolveCatalogProductImage } from '../ProductTileImage.jsx';
import { slotFor, SLOTS, howLine } from '../../health/plan.js';
import './routine-timeline.css';

/**
 * Her routine as a day timeline (founder Oct 26 21:45: "a day timeline, not a
 * carousel of small cards"). The Start-here steps of every active routine,
 * grouped by when they happen ("When cramps start", "During your period",
 * "Every night"). Each step: its name (tap to open), one line of how (founder, Oct 28: no photos, they only took space; was one big square photo, the old product-card
 * look), its name and one line of why; a tap opens How, When and how long.
 * The section that applies right now (her cycle day, the time of day) is the
 * pink "Now" block. Same data as RoutineSummary (useRoutines); medicines are
 * information only and never listed here.
 */
const cap = (x) => (x ? `${x.charAt(0).toUpperCase()}${x.slice(1)}` : '');

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
  const photo = product
    ? <Plate src={resolveCatalogProductImage(it.product) || ''} alt="" fallback={it.product?.brand || it.title} className="ay-rtl__plate" />
    // A step with no product (a habit): a solid monogram, never a placeholder icon (review, Oct 26).
    : <span className="ay-rtl__mono" aria-hidden="true">{String(it.title || '?').trim().replace(/^(a|an|the|your)\s+/i, '').charAt(0).toUpperCase()}</span>;
  const head = <>
    <span className="ay-rtl__photo">{photo}</span>
    <span className="ay-rtl__text">
      <span className="ay-rtl__name">{it.title}</span>
      {it.why && <span className="ay-rtl__why">{it.why}</span>}
      {product && it.how && <span className="ay-rtl__how">{it.how}</span>}
    </span>
  </>;
  return (
    <li className={`ay-rtl__step${open ? ' is-open' : ''}`}>
      {/* The row opens the product (one tap target); "How and when" opens in place. */}
      {product && onOpenProduct
        ? <button type="button" className="ay-rtl__row" onClick={() => onOpenProduct(it.product)} aria-label={`${it.title}. Open product.`}>{head}</button>
        : <div className="ay-rtl__row">{head}</div>}
      <button type="button" className="ay-rtl__more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {open ? 'Less' : 'How and when'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <dl id={id} className="ay-rtl__detail" hidden={!open}>
        {it.when && <div><dt>When</dt><dd>{cap(it.when)}</dd></div>}
        {it.how && <div><dt>How</dt><dd>{it.how}</dd></div>}
        {it.horizon && <div><dt>Try it for</dt><dd>{it.horizon.label}</dd></div>}
        {it.know && <div><dt>How you will know</dt><dd>{it.know}</dd></div>}
      </dl>
    </li>
  );
}

// Her ecosystem products that no routine step covers yet, as timeline steps
// placed by when they're used (founder, Oct 28: "integrate products into the
// routine more"). Medicines stay out (information only).
const SLOT_TITLE = Object.fromEntries(SLOTS.map((x) => [x.id, x.title]));
function ecosystemSteps(products, covered) {
  const list = Array.isArray(products) ? products : Object.values(products || {});
  return list
    .filter((p) => p?.id && !covered.has(String(p.id)) && !isMedicineProduct(p) && p.userAdded !== true)
    .map((p) => {
      const how = howLine(p);
      return { key: `eco:${p.id}`, kind: 'product', product: p, title: p.name, why: 'In your ecosystem', how: how?.text || null, when: SLOT_TITLE[slotFor(p)] || 'When you need it' };
    });
}

export default function RoutineTimeline({ compact = true, cycle = null, onOpenRoutine, onOpenProduct, onCheckIn, emptyAction = null, max = 3, ecoMax = 4, ...source }) {
  const { routines } = useRoutines(source);
  const list = routines.slice(0, max);
  const covered = new Set(list.flatMap((r) => r.start.filter((it) => it.kind === 'product').map((it) => String(it.product?.id))));
  const extras = ecosystemSteps(source.products, covered).slice(0, ecoMax);
  if (!list.length && !extras.length) {
    return (
      <div className="ay-rtl is-empty" data-tour="routine">
        <p>Your routine shows here once you add products.</p>
        {emptyAction}
      </div>
    );
  }
  const hour = new Date().getHours();
  // One timeline across her routines: steps grouped by when they happen, in the order they first appear.
  const groups = [];
  const seen = new Set();
  const place = (it) => {
    if (it.kind === 'product' && isMedicineProduct(it.product)) return;
    if (seen.has(it.key)) return;
    seen.add(it.key);
    const when = cap(it.when || 'Any time');
    let g = groups.find((x) => x.when.toLowerCase() === when.toLowerCase());
    if (!g) { g = { when, steps: [], now: isNow(when, cycle, hour) }; groups.push(g); }
    g.steps.push(it);
  };
  for (const r of list) r.start.forEach(place);
  extras.forEach(place);
  // What applies now comes first.
  groups.sort((a, b) => Number(b.now) - Number(a.now));
  const tracks = list.map((r) => r.track).filter(Boolean);
  return (
    <div className={`ay-rtl${compact ? ' is-compact' : ''}`} data-tour="routine">
      <ol className="ay-rtl__line">
        {groups.map((g) => (
          <li key={g.when} className={`ay-rtl__sec is-${g.now ? 'now' : 'surface'}`}>
            <h3 className="ay-rtl__when">{g.now && <em>Now</em>}{g.when}</h3>
            <ul>{g.steps.map((it) => <Step key={it.key} it={it} onOpenProduct={onOpenProduct} />)}</ul>
          </li>
        ))}
        {tracks.length > 0 && (
          <li className="ay-rtl__sec is-track">
            <h3 className="ay-rtl__when">Your check-in</h3>
            <button type="button" className="ay-rtl__check" onClick={onCheckIn} disabled={!onCheckIn}>
              <span className="ay-rtl__tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <span><b>{tracks.map((t, i) => (i ? `${t.title.charAt(0).toLowerCase()}${t.title.slice(1)}` : t.title)).join(' and ')}</b><small>About 30 seconds{onCheckIn ? '. Check in' : ''}</small></span>
            </button>
          </li>
        )}
      </ol>
      {onOpenRoutine && <button type="button" className="ay-rtl__all" onClick={onOpenRoutine}>See your full routine</button>}
    </div>
  );
}
