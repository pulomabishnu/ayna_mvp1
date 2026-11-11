import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { todayHelp, TODAY_HELP } from '../../health/todayHelp.js';
import ProductTileImage from '../ProductTileImage.jsx';
import './today-plan.css';

/**
 * Home > For today (founder, Nov 11): "the log should be in the period and symptom log, and For
 * today should give you insights: tap one, set a new goal to improve sleep, product options,
 * important daily stuff, products to add to your routine". "Stop putting things in boxes and
 * stacking them; use research, use the inspo."
 *
 * Her inspo boards (Healthy Heart Rate, Statistics, Today's Plan): a bento of small colour tiles,
 * each one icon, a 2-4 word title and one line; tapping opens the detail. So: a 2-column grid, no
 * outlines, no tall stacked cards. Each tile opens a bottom sheet with the one tip that matters,
 * her matched products for it (Add to routine), "Make it a goal", the rest of the tips and the
 * .gov source (NN/g progressive disclosure: summary first, detail on request).
 */
const ICONS = {
  pain: 'M8 4c-1.5 2 1.5 3 0 5M12 4c-1.5 2 1.5 3 0 5M16 4c-1.5 2 1.5 3 0 5M4 13h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z',
  sleep: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  energy: 'M13 3 5 14h6l-1 7 8-11h-6z',
  mood: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  pms: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
  steady: 'M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z',
  log: 'M12 5v14M5 12h14',
  picks: 'M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0',
  data: 'M4 19V9M10 19V5M16 19v-7M22 19H2',
};
const SHORT = { pain: 'Ease cramps', sleep: 'Sleep better', energy: 'More energy', mood: 'Lift your mood', pms: 'Ease PMS', steady: 'Keep it up' };
// Which of her matched products fit each topic (name, category and needs text).
const FITS = {
  pain: /cramp|heat|warm|tens|period pain|menstrual pain/i,
  sleep: /sleep|melatonin|magnesium|night/i,
  energy: /iron|energy|fatigue|b12|ferr/i,
  mood: /stress|mood|calm|anxiety|ashwagandha/i,
  pms: /pms|bloat|premenstrual|cycle support/i,
};
const textOf = (p) => `${p?.name || ''} ${p?.category || ''} ${p?.subcategory || ''} ${(p?.needs || p?.concerns || []).join?.(' ') || ''} ${p?.description || ''}`;
const TONES = ['is-ink', 'is-pink', 'is-butter', 'is-wash'];

function Icon({ d }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>; }

function Sheet({ open, onClose, labelledBy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    ref.current?.querySelector('.ay-tp-sheet__x')?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); try { opener?.focus?.({ preventScroll: true }); } catch { /* gone */ } };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  const host = document.querySelector('.ayna-mobile') || document.body;
  return createPortal(
    <div className="ay-tp-layer">
      <div className="ay-tp-dim" aria-hidden="true" onClick={onClose} />
      <section ref={ref} className="ay-tp-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <span className="ay-tp-sheet__grab" aria-hidden="true" />
        <button type="button" className="ay-tp-sheet__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        {children}
      </section>
    </div>,
    host,
  );
}

function ProductRows({ products, inRoutine, onOpenProduct, onAddToRoutine }) {
  return (
    <ul className="ay-tp-prods">
      {products.map((p) => {
        const added = inRoutine(p.id);
        return (
          <li key={p.id}>
            <button type="button" className="ay-tp-prod" onClick={() => onOpenProduct?.(p)}>
              <span className="ay-tp-prod__img"><ProductTileImage product={p} alt="" letterNode={<span aria-hidden="true">{(p.brand || p.name || '?').slice(0, 1)}</span>} /></span>
              <span className="ay-tp-prod__txt"><b>{p.name}</b>{p.brand && <small>{p.brand}</small>}</span>
            </button>
            {onAddToRoutine && <button type="button" className="ay-tp-add" disabled={added} onClick={() => onAddToRoutine(p)}>{added ? 'In your routine' : 'Add to routine'}</button>}
          </li>
        );
      })}
    </ul>
  );
}

export default function TodayPlan({
  entry = null, pregnant = false, postCycle = false, insight = null, picks = [], myProductIds = [],
  onOpenLog, onOpenRead, onExplore, onAddGoal, goalsAdded = [], onOpenProduct, onAddToRoutine, onOpenInsight,
}) {
  const [open, setOpen] = useState(null);
  const [added, setAdded] = useState([]);
  const inRoutine = (id) => myProductIds.includes(id) || added.includes(id);
  const addToRoutine = onAddToRoutine ? (p) => { onAddToRoutine(p); setAdded((x) => [...x, p.id]); } : null;
  const help = todayHelp(entry, { pregnant, postCycle });
  const logged = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin', 'energy'].some((f) => entry?.[f] != null);

  // An insight from her data (e.g. sleep under her usual) becomes a topic too, unless her log already brought it.
  const topics = [...help];
  if (insight?.topic && TODAY_HELP[insight.topic] && !topics.some((h) => h.id === insight.topic)) topics.unshift({ ...TODAY_HELP[insight.topic], fromData: insight.line });
  const fits = (h) => picks.filter((p) => FITS[h.id]?.test(textOf(p))).slice(0, 3);

  const tiles = [];
  if (!logged) tiles.push({ key: 'log', icon: ICONS.log, title: 'Log today', line: 'Mood, pain, energy, period', go: onOpenLog });
  topics.slice(0, 3).forEach((h) => tiles.push({ key: h.id, icon: ICONS[h.id] || ICONS.steady, title: SHORT[h.id] || h.title, line: h.fromData || h.tips[0], go: () => setOpen(h.id) }));
  if (insight && !insight.topic && onOpenInsight) tiles.push({ key: 'data', icon: ICONS.data, title: insight.label, line: insight.line, go: onOpenInsight });
  if (picks.length) tiles.push({ key: 'picks', icon: ICONS.picks, title: 'For your routine', line: `${Math.min(3, picks.length)} picks that fit you`, thumbs: picks.slice(0, 2), go: () => setOpen('picks') });
  if (logged && onOpenLog) tiles.push({ key: 'relog', icon: ICONS.log, title: 'Your log', line: 'Add or change today', go: onOpenLog });

  const h = topics.find((x) => x.id === open);
  const products = h ? fits(h) : [];
  return (
    <section className="ay-tp" aria-label="For today">
      <ul className={`ay-tp-grid is-${tiles.length}`}>
        {tiles.map((t, i) => (
          <li key={t.key} className={`ay-tp-tile ${TONES[i % TONES.length]}`}>
            <button type="button" onClick={t.go}>
              <span className="ay-tp-tile__ic"><Icon d={t.icon} /></span>
              <b>{t.title}</b>
              <span className="ay-tp-tile__line">{t.line}</span>
              {t.thumbs && <span className="ay-tp-tile__thumbs" aria-hidden="true">{t.thumbs.map((p) => <span key={p.id}><ProductTileImage product={p} alt="" letterNode={<span>{(p.brand || p.name || '?').slice(0, 1)}</span>} /></span>)}</span>}
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={Boolean(h)} onClose={() => setOpen(null)} labelledBy="ay-tp-h">
        {h && <>
          <p className="ay-tp-sheet__kicker">{h.title}</p>
          <h2 id="ay-tp-h">{h.fromData || h.tips[0]}</h2>
          {h.fromData && <p className="ay-tp-sheet__lead">{h.tips[0]}</p>}
          {h.goal && onAddGoal && <button type="button" className="ay-tp-goal" disabled={goalsAdded.includes(h.goal)} onClick={() => onAddGoal(h.goal)}>{goalsAdded.includes(h.goal) ? 'Added to your goals' : `Make ${h.goalLabel} a goal`}</button>}
          {products.length > 0 && <>
            <h3>Matches that may help</h3>
            <ProductRows products={products} inRoutine={inRoutine} onOpenProduct={onOpenProduct} onAddToRoutine={addToRoutine} />
          </>}
          {h.shop && onExplore && <button type="button" className="ay-tp-link" onClick={() => { setOpen(null); onExplore(h.shop); }}>{products.length ? 'See more in Shop' : 'See products for this'}</button>}
          {h.tips.length > 1 && <>
            <h3>Also try</h3>
            <ul className="ay-tp-tips">{h.tips.slice(1).map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </>}
          <p className="ay-tp-care">{h.care}</p>
          {h.read && onOpenRead && <button type="button" className="ay-tp-link" onClick={() => { setOpen(null); onOpenRead(h.read); }}>Read more</button>}
          <p className="ay-tp-src">From {h.sources.map((s, j) => <span key={s.url}>{j ? ', ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>
        </>}
      </Sheet>

      <Sheet open={open === 'picks'} onClose={() => setOpen(null)} labelledBy="ay-tp-picks-h">
        <p className="ay-tp-sheet__kicker">For your routine</p>
        <h2 id="ay-tp-picks-h">Picks that fit what you told ayna</h2>
        <ProductRows products={picks.slice(0, 3)} inRoutine={inRoutine} onOpenProduct={(p) => { setOpen(null); onOpenProduct?.(p); }} onAddToRoutine={addToRoutine} />
        {onExplore && <button type="button" className="ay-tp-link" onClick={() => { setOpen(null); onExplore(''); }}>Explore Shop</button>}
      </Sheet>
    </section>
  );
}
