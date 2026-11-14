import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { todayHelp, TODAY_HELP, productsForTopic, announceLogChange } from '../../health/todayHelp.js';
import { readGoals, addGoal, removeGoal, toggleDone, weekFor, GOAL_PRESETS, GOALS_CHANGED_EVENT, MAX_GOALS, topicFor } from '../../health/myGoals.js';
import { saveLogEntry, readLog } from '../../health/dailyLog.js';
import ProductTileImage from '../ProductTileImage.jsx';
import { haptic } from '../../utils/haptics.js';
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
// Founder, Nov 11 ("too much colour?"): 60-30-10. The butter page leads, one pink tile is the accent
// (the first thing that may help today), everything else is plain: an icon circle and text, no fill.
const toneFor = (t, firstTopicKey) => (t.key === firstTopicKey ? 'is-pink' : 'is-plain');

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

const SHOW_DAY_RAIL = false;

export default function TodayPlan({
  entry = null, pregnant = false, postCycle = false, insight = null, picks = [], myProductIds = [],
  onOpenLog, onOpenRead, onExplore, onAddGoal, goalsAdded = [], onOpenProduct, onAddToRoutine, onOpenInsight,
  log = {}, today = null, name = '', onLogSaved = null,
}) {
  // Her own goals (focus group Nov 11): set on Home, progress this week, products for each.
  const [goals, setGoals] = useState(() => { try { return readGoals(); } catch { return []; } });
  useEffect(() => {
    const on = () => { try { setGoals(readGoals()); } catch { /* storage blocked */ } };
    window.addEventListener(GOALS_CHANGED_EVENT, on);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, on);
  }, []);
  const [draft, setDraft] = useState({ text: '', perWeek: 5 });
  const [goalOpen, setGoalOpen] = useState(null);
  // Founder, Nov 12 ("do we have to use boxes?"): two layouts to compare before picking one.
  //   'bento'    the tiles as they were
  //   'open'     one card (goals); everything else sits on the page as rows (NN/g: lists beat cards
  //              for similar items people scan)
  //   'timeline' the day as one line: Now, Your goals, For you today
  const layout = (() => { try { return localStorage.getItem('ayna_today_layout') || 'open'; } catch { return 'open'; } })();
  const when = (label) => (layout === 'timeline' ? <p className="ay-tp-when">{label}</p> : null);
  const saveGoal = (g) => {
    const before = new Set(goals.map((x) => x.id));
    const next = addGoal(g);
    haptic('success');
    setGoals(next);
    // A preset (or her words naming one) also tells the matcher, quietly, so her picks follow it.
    const preset = GOAL_PRESETS.find((x) => x.topic === (g.topic === undefined ? topicFor(g.text) : g.topic));
    if (preset && onAddGoal && !goalsAdded.includes(preset.needId)) onAddGoal(preset.needId, { quiet: true });
    setDraft({ text: '', perWeek: 5 });
    // Founder, Nov 12 ("it should suggest products for your goal"): the new goal opens straight
    // to its tip and the products for it.
    const made = next.find((x) => !before.has(x.id));
    if (made) { setGoalOpen(made.id); setOpen('goal'); } else setOpen('goals');
  };
  const feel = (v) => {
    if (!today) return;
    const on = log?.[today]?.mood === v;
    try { saveLogEntry(today, { mood: on ? null : v }); announceLogChange(today); onLogSaved?.(readLog()); } catch { /* storage blocked */ }
  };
  const [open, setOpen] = useState(null);
  const [added, setAdded] = useState([]);
  const inRoutine = (id) => myProductIds.includes(id) || added.includes(id);
  const addToRoutine = onAddToRoutine ? (p) => { haptic('success'); onAddToRoutine(p); setAdded((x) => [...x, p.id]); } : null;
  const help = todayHelp(entry, { pregnant, postCycle });
  const logged = ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin', 'energy'].some((f) => entry?.[f] != null);

  // An insight from her data (e.g. sleep under her usual) becomes a topic too, unless her log already brought it.
  const topics = [...help];
  if (insight?.topic && TODAY_HELP[insight.topic] && !topics.some((h) => h.id === insight.topic)) topics.unshift({ ...TODAY_HELP[insight.topic], fromData: insight.line });
  const fits = (h) => picks.filter((p) => FITS[h.id]?.test(textOf(p))).slice(0, 3);

  const tiles = [];
  const open1 = layout === 'open';
  if (!logged && !open1) tiles.push({ key: 'log', icon: ICONS.log, title: layout === 'bento' ? 'Log today' : 'Log symptoms', line: layout === 'bento' ? 'Mood, pain, energy, period' : 'Pain, period, energy, sleep', go: onOpenLog });
  topics.slice(0, open1 ? 2 : 3).forEach((h) => tiles.push({ key: h.id, icon: ICONS[h.id] || ICONS.steady, title: SHORT[h.id] || h.title, line: h.fromData || h.tips[0], go: () => setOpen(h.id) }));
  if (insight && !insight.topic && onOpenInsight) tiles.push({ key: 'data', icon: ICONS.data, title: insight.label, line: insight.line, go: onOpenInsight });
  // Founder, Nov 11: "one can be a suggestion, adding one thing to your routine, based off the data".
  // The one pick that fits what her data or log brought up first; otherwise her top match.
  const lead = topics.map((t) => ({ t, p: fits(t).find((x) => !inRoutine(x.id)) })).find((x) => x.p) || null;
  const onePick = lead?.p || picks.find((x) => !inRoutine(x.id)) || null;
  const why = lead ? `For ${lead.t.goalLabel || 'today'}` : 'A match for you';
  if (onePick && !open1) tiles.push({ key: 'picks', icon: ICONS.picks, title: 'Add to your routine', line: `${onePick.name}. ${why}.`, thumbs: [onePick], go: () => setOpen('picks') });
  if (logged && onOpenLog && !open1) tiles.push({ key: 'relog', icon: ICONS.log, title: 'Your log', line: 'Add or change today', go: onOpenLog });

  // Founder, Nov 12: "new products ayna recommends daily, so people know they're new". Three of
  // her matches she doesn't have yet, a different three each day (rotates through her list).
  const fresh = picks.filter((x) => x?.id && !inRoutine(x.id));
  const dayNo = today ? Math.floor(new Date(`${today}T12:00:00`).getTime() / 86400000) : 0;
  // The one that fits what her log or data brought up today leads; the rest rotate daily.
  const rotation = fresh.length ? Array.from({ length: fresh.length }, (_, k) => fresh[(dayNo * 3 + k) % fresh.length]) : [];
  // Her goals come first (founder, Nov 12): a pick for each goal she set, labelled with the goal.
  const forGoal = new Map();
  for (const g of goals) {
    if (!g.topic) continue;
    const p = productsForTopic(g.topic, fresh, 3).find((x) => !forGoal.has(x.id));
    if (p) forGoal.set(p.id, g.text);
  }
  const goalPicks = fresh.filter((x) => forGoal.has(x.id));
  const daily = [...new Set([...goalPicks, ...(lead?.p ? [lead.p] : []), ...rotation])].slice(0, 3);

  const h = topics.find((x) => x.id === open);
  const products = h ? fits(h) : [];
  return (
    <section className={`ay-tp is-${layout}`} aria-label="For today">
      {/* Nov 12 run-through (Puloma; Ameera's next step "remove Thursday and the how are you feeling today"):
          the day rail and the mood prompt are off. Logging is the period and symptom log. */}
      {SHOW_DAY_RAIL && today && !open1 && (() => {
        // Nov 11 (founder: "make the today cooler"): the inspo's day rail. This week, today in pink,
        // a dot under each day she logged. Tap today to log.
        const d0 = new Date(`${today}T12:00:00`);
        const days = Array.from({ length: 7 }, (_, k) => { const d = new Date(d0); d.setDate(d0.getDate() - ((d0.getDay() + 6) % 7) + k); const id = d.toLocaleDateString('en-CA'); return { id, dow: d.toLocaleDateString('en-US', { weekday: 'narrow' }), n: d.getDate(), isToday: id === today, logged: ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin', 'energy'].some((f) => log?.[id]?.[f] != null), future: id > today }; });
        const count = days.filter((d) => d.logged).length;
        return (
          <div className="ay-tp-week">
            <p className="ay-tp-week__head"><b>{d0.toLocaleDateString('en-US', { weekday: 'long' })}</b><span>{count ? `Logged ${count} ${count === 1 ? 'day' : 'days'} this week` : 'Your week'}</span></p>
            <ol className="ay-tp-week__rail">{days.map((d, k) => (
              <li key={d.id} className={`${d.isToday ? 'is-today' : ''}${d.future ? ' is-future' : ''}`} style={{ '--k': k }}>
                {d.isToday && onOpenLog
                  ? <button type="button" onClick={onOpenLog} aria-label={`Today, ${d.n}. ${d.logged ? 'Logged. Change your log' : 'Log today'}`}><small>{d.dow}</small><b>{d.n}</b><i className={d.logged ? 'is-on' : ''} /></button>
                  : <span aria-label={`${d.n}${d.logged ? ', logged' : ''}`}><small>{d.dow}</small><b>{d.n}</b><i className={d.logged ? 'is-on' : ''} /></span>}
              </li>
            ))}</ol>
          </div>
        );
      })()}
      {today && when('Now')}
      {SHOW_DAY_RAIL && today && !open1 && (
        // Inspo ("Hello Alex! How are you feeling today?"): one tap logs her mood for today.
        <div className="ay-tp-feel">
          <p className="ay-tp-feel__q">{name ? `Hi ${name}, how are you feeling today?` : 'How are you feeling today?'}</p>
          <div className="ay-tp-feel__row" role="radiogroup" aria-label="Your mood today">
            {[[1, 'Low', 'M8 16.5c2.2-2 5.8-2 8 0'], [2, 'Okay', 'M8 15h8'], [3, 'Good', 'M8 14c2.2 2.6 5.8 2.6 8 0']].map(([v, label, mouth]) => {
              const on = log?.[today]?.mood === v;
              return (
                <button key={v} type="button" role="radio" aria-checked={on} className={on ? 'is-on' : ''} onClick={() => feel(v)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><circle cx="9" cy="10" r="1" className="is-eye" /><circle cx="15" cy="10" r="1" className="is-eye" /><path d={mouth} /></svg>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {today && when('Your goals')}
      {today && (() => {
        // Inspo ("Today's Progress"): one dark card, rings that fill toward her own target.
        const rows = goals.map((g) => ({ g, w: weekFor(g, log, today) }));
        const onTrack = rows.filter((r) => r.w.met).length;
        if (!rows.length) {
          return (
            <div className="ay-tp-goals is-empty is-compact">
              <div className="ay-tp-goals__top"><div className="ay-tp-goals__head is-static"><b>Your goals</b><span>Pick one to track this week</span></div></div>
              <div className="ay-tp-goals__presets">{GOAL_PRESETS.slice(0, 4).map((p) => <button key={p.topic} type="button" onClick={() => saveGoal({ text: p.text, topic: p.topic })}>{p.text}</button>)}<button type="button" className="is-own" onClick={() => setOpen('addgoal')}>+ Your own</button></div>
            </div>
          );
        }
        return (
          // Founder, Nov 12: smaller, no pill buttons; the header opens all her goals.
          <div className="ay-tp-goals is-compact">
            <div className="ay-tp-goals__top">
              <button type="button" className="ay-tp-goals__head" onClick={() => setOpen('goals')} aria-label={`Your goals: ${onTrack} of ${rows.length} on track this week. Open your goals`}>
                <b>Your goals<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></b>
                <span>{onTrack} of {rows.length} on track this week</span>
              </button>
              {goals.length < MAX_GOALS && <button type="button" className="ay-tp-goals__add" onClick={() => setOpen('addgoal')}>+ Add</button>}
            </div>
            <ul className="ay-tp-goals__list">{rows.slice(0, 3).map(({ g, w }) => (
              <li key={g.id}>
                <button type="button" className="ay-tp-goals__row" onClick={() => { setGoalOpen(g.id); setOpen('goal'); }}>
                  <svg className="ay-tp-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" className="is-bg" /><circle cx="18" cy="18" r="15" className="is-fg" style={{ strokeDasharray: `${Math.min(1, w.count / w.of) * 94.25} 94.25` }} /></svg>
                  <b>{g.text}</b>
                  <small>{w.count}/{w.of}</small>
                </button>
                <button type="button" className={`ay-tp-goals__tick${w.doneToday ? ' is-on' : ''}`} aria-pressed={w.doneToday} aria-label={`${g.text}: did it today`} onClick={() => { haptic(w.doneToday ? 'light' : 'success'); setGoals(toggleDone(g.id, today)); }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </button>
              </li>
            ))}</ul>
          </div>
        );
      })()}

      {open1 && daily.length > 0 && (
        <section className="ay-tp-daily" aria-labelledby="ay-tp-daily-h">
          <div className="ay-tp-daily__head"><h3 id="ay-tp-daily-h">{goalPicks.length ? 'Picks for your goals' : 'New from ayna today'}</h3><span>New every day</span></div>
          <ul className="ay-tp-daily__row">{daily.map((p) => (
            <li key={p.id}>
              <button type="button" className="ay-tp-daily__card" onClick={() => onOpenProduct?.(p)}>
                <span className="ay-tp-daily__img"><ProductTileImage product={p} alt="" letterNode={<span>{(p.brand || p.name || '?').slice(0, 1)}</span>} /><i>New</i></span>
                <small>{forGoal.has(p.id) ? 'For your goal' : p.brand}</small>
                <b>{p.name}</b>
              </button>
            </li>
          ))}</ul>
        </section>
      )}
      {open1 ? (tiles.length > 0 && <p className="ay-tp-label">For you today</p>) : when('For you today')}
      <ul className={`ay-tp-grid is-${tiles.length}`}>
        {tiles.map((t, k) => (
          <li key={t.key} className={`ay-tp-tile ${toneFor(t, topics[0]?.id)}`} style={{ '--k': k }}>
            <button type="button" onClick={t.go}>
              <span className="ay-tp-tile__ic"><Icon d={t.icon} /></span>
              <b>{t.title}</b>
              <span className="ay-tp-tile__line">{t.line}</span>
              {t.thumbs && <span className="ay-tp-tile__thumbs" aria-hidden="true">{t.thumbs.map((p) => <span key={p.id}><ProductTileImage product={p} alt="" letterNode={<span>{(p.brand || p.name || '?').slice(0, 1)}</span>} /></span>)}</span>}
              <svg className="ay-tp-tile__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={Boolean(h)} onClose={() => setOpen(null)} labelledBy="ay-tp-h">
        {h && <>
          <p className="ay-tp-sheet__kicker">{h.title}</p>
          <h2 id="ay-tp-h">{h.fromData || h.tips[0]}</h2>
          {h.fromData && <p className="ay-tp-sheet__lead">{h.tips[0]}</p>}
          {h.goal && (() => { const p = GOAL_PRESETS.find((x) => x.needId === h.goal); const has = p && goals.some((g) => g.topic === p.topic); return p && <button type="button" className="ay-tp-goal" disabled={has} onClick={() => saveGoal({ text: p.text, topic: p.topic })}>{has ? 'In your goals' : `Make ${h.goalLabel} a goal`}</button>; })()}
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

      <Sheet open={open === 'addgoal'} onClose={() => setOpen(null)} labelledBy="ay-tp-add-h">
        <p className="ay-tp-sheet__kicker">Your goals</p>
        <h2 id="ay-tp-add-h">Set a goal</h2>
        <p className="ay-tp-sheet__lead">Pick one or write your own. Tick it on the days you do it; for sleep, pain, energy, mood and PMS, good days in your log count too.</p>
        <div className="ay-tp-goals__presets is-sheet">{GOAL_PRESETS.filter((p) => !goals.some((g) => g.topic === p.topic)).map((p) => (
          <button key={p.topic} type="button" className={draft.text === p.text ? 'is-on' : ''} onClick={() => setDraft((d) => ({ ...d, text: p.text, topic: p.topic }))}>{p.text}</button>
        ))}</div>
        <label className="ay-tp-goalform__label" htmlFor="ay-tp-goal-text">Or in your words</label>
        <input id="ay-tp-goal-text" className="ay-tp-goalform__input" type="text" maxLength={60} placeholder="e.g. Walk 20 minutes" value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value, topic: undefined }))} />
        <p className="ay-tp-goalform__label" id="ay-tp-goal-week">How many days a week?</p>
        <div className="ay-tp-goalform__seg" role="radiogroup" aria-labelledby="ay-tp-goal-week">{[3, 5, 7].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={draft.perWeek === n} className={draft.perWeek === n ? 'is-on' : ''} onClick={() => setDraft((d) => ({ ...d, perWeek: n }))}>{n === 7 ? 'Every day' : `${n} days`}</button>
        ))}</div>
        <button type="button" className="ay-tp-goal ay-tp-goal--wide" disabled={!draft.text.trim() || goals.length >= MAX_GOALS} onClick={() => saveGoal(draft)}>{goals.length >= MAX_GOALS ? `Up to ${MAX_GOALS} goals` : 'Save goal'}</button>
      </Sheet>

      <Sheet open={open === 'goals' || open === 'goal'} onClose={() => { setOpen(null); setGoalOpen(null); }} labelledBy="ay-tp-goals-h">
        <p className="ay-tp-sheet__kicker">This week</p>
        <h2 id="ay-tp-goals-h">Your goals</h2>
        <ul className="ay-tp-goallist">{goals.filter((g) => open === 'goals' || g.id === goalOpen).map((g) => {
          const w = today ? weekFor(g, log, today) : { count: 0, of: g.perWeek, doneToday: false };
          const help = g.topic ? TODAY_HELP[g.topic] : null;
          const prods = g.topic ? productsForTopic(g.topic, picks, 2) : [];
          return (
            <li key={g.id}>
              <div className="ay-tp-goallist__row">
                <svg className="ay-tp-ring is-big" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" className="is-bg" /><circle cx="18" cy="18" r="15" className="is-fg" style={{ strokeDasharray: `${Math.min(1, w.count / w.of) * 94.25} 94.25` }} /></svg>
                <div><b>{g.text}</b><span>{w.count} of {w.of} days this week</span></div>
                <button type="button" className={`ay-tp-goals__tick${w.doneToday ? ' is-on' : ''}`} aria-pressed={w.doneToday} aria-label={`${g.text}: did it today`} onClick={() => { haptic(w.doneToday ? 'light' : 'success'); setGoals(toggleDone(g.id, today)); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></button>
              </div>
              {help && <p className="ay-tp-goallist__tip">{help.tips[0]}</p>}
              {prods.length > 0 && <p className="ay-tp-goallist__sub">Products for this goal</p>}
              {prods.length > 0 && <ProductRows products={prods} inRoutine={inRoutine} onOpenProduct={(p) => { setOpen(null); onOpenProduct?.(p); }} onAddToRoutine={addToRoutine} />}
              {onExplore && <button type="button" className="ay-tp-link ay-tp-goallist__rm" onClick={() => { setOpen(null); onExplore(help?.shop || g.text); }}>{prods.length ? 'See more in Shop' : 'Find products for this'}</button>}
              <button type="button" className="ay-tp-link ay-tp-goallist__rm" onClick={() => { setGoals(removeGoal(g.id)); if (open === 'goal') setOpen(null); }}>Remove goal</button>
            </li>
          );
        })}</ul>
        {open === 'goals' && goals.length < MAX_GOALS && <button type="button" className="ay-tp-goal ay-tp-goal--wide" onClick={() => setOpen('addgoal')}>Add a goal</button>}
      </Sheet>

      <Sheet open={open === 'picks'} onClose={() => setOpen(null)} labelledBy="ay-tp-picks-h">
        <p className="ay-tp-sheet__kicker">Add to your routine</p>
        <h2 id="ay-tp-picks-h">{onePick ? `${onePick.name}` : 'New products for you'}</h2>
        {onePick && <p className="ay-tp-sheet__lead">{why}. It fits the answers you gave ayna; tap it for the full match and safety notes.</p>}
        {onePick && <ProductRows products={[onePick]} inRoutine={inRoutine} onOpenProduct={(p) => { setOpen(null); onOpenProduct?.(p); }} onAddToRoutine={addToRoutine} />}
        {picks.filter((x) => x.id !== onePick?.id).length > 0 && <>
          <h3>More new products for you</h3>
          <ProductRows products={picks.filter((x) => x.id !== onePick?.id).slice(0, 3)} inRoutine={inRoutine} onOpenProduct={(p) => { setOpen(null); onOpenProduct?.(p); }} onAddToRoutine={addToRoutine} />
        </>}
        {onExplore && <button type="button" className="ay-tp-link" onClick={() => { setOpen(null); onExplore(''); }}>Explore Shop</button>}
      </Sheet>
    </section>
  );
}
