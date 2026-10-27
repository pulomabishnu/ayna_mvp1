import { useEffect, useState } from 'react';
import ScoreRings from './ScoreRings.jsx';
import { Sparkline } from './DashParts.jsx';
import { ScallopEdge, Plate, SnapCarousel } from '../../components/ui/ay/index.js';
import { resolveCatalogProductImage } from '../../components/ProductTileImage.jsx';
import { short, lastDays } from '../../health/dashView.js';
import './home-hero.css';

/**
 * Home's hero (founder Oct 26 21:45: "really really cute", "the data is the
 * hero"): one espresso band with a wavy edge holding the greeting, her three
 * dials (the same ScoreRings as Your data, filling once on load), then one
 * small row: the Daily Rundown as a story bubble and her logging streak.
 * Real data only; without data the dials say so with one Connect button.
 */

const hello = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Hello' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
const fmtLong = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const weekday = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' });
const weekdayLong = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

/** The Daily Rundown as a story bubble: Rundown.jsx says how many cards (ayna:rundown-state) and starts on ayna:rundown-start. */
function useRundownCount() {
  const [state, setState] = useState({ count: null, done: false });
  useEffect(() => {
    const on = (e) => {
      const d = e?.detail || {};
      if (d.completed) setState((s) => ({ ...s, done: true }));
      else if (Number.isFinite(d.count)) setState((s) => ({ ...s, count: d.count }));
    };
    window.addEventListener('ayna:rundown-state', on);
    try { window.dispatchEvent(new CustomEvent('ayna:rundown-ask')); } catch { /* old browser */ }
    return () => window.removeEventListener('ayna:rundown-state', on);
  }, []);
  return state;
}

function RundownBubble({ count, done }) {
  const start = () => { try { window.dispatchEvent(new CustomEvent('ayna:rundown-start')); } catch { /* old browser */ } };
  return (
    <button type="button" className={`ay-hh-bubble${done ? ' is-done' : ''}`} data-tour="rundown-bubble" onClick={start} aria-label={`Your Daily Rundown: ${count} ${count === 1 ? 'thing' : 'things'}${done ? ', seen today' : ''}. Start.`}>
      <span className="ay-hh-bubble__ring" aria-hidden="true">
        <b>{count}</b>
        {done && <i className="ay-hh-bubble__check"><svg viewBox="0 0 24 24"><path d={CHECK} /></svg></i>}
      </span>
      <span className="ay-hh-bubble__label" aria-hidden="true">Rundown</span>
    </button>
  );
}

// A small calendar: the streak row opens "Your month" (MonthSheet.jsx).
const CAL = 'M7 3.5v3M17 3.5v3M4.5 9.5h15M6 5.5h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V7A1.5 1.5 0 0 1 6 5.5z';

function Streak({ streak, onLog, onMonth = null }) {
  const { count, loggedToday, week } = streak;
  const said = week.filter((d) => d.on).map((d) => weekdayLong(d.day)).join(', ');
  const title = count > 0 ? `${count}-day streak` : 'Start your streak';
  const sub = loggedToday ? 'Logged today' : count > 0 ? 'Log today to keep it' : 'Log today, about 30 seconds';
  return (
    <button type="button" className="ay-hh-streak" data-tour="streak" onClick={onMonth || onLog} aria-haspopup={onMonth ? 'dialog' : undefined}
      aria-label={`${title}. ${said ? `Logged ${said}.` : 'Nothing logged this week yet.'} ${sub}.${onMonth ? ' Open your month.' : ''}`}>
      <span className="ay-hh-streak__top" aria-hidden="true"><b>{title}</b><small>{sub}</small>{onMonth && <svg className="ay-hh-streak__cal" viewBox="0 0 24 24"><path d={CAL} /></svg>}</span>
      <span className="ay-hh-streak__days" aria-hidden="true">
        {week.map((d) => (
          <span key={d.day} className={`${d.on ? 'is-on' : ''}${d.today ? ' is-today' : ''}`}>
            <i>{d.on && d.today && <svg viewBox="0 0 24 24"><path d={CHECK} /></svg>}</i>
            <small>{weekday(d.day)}</small>
          </span>
        ))}
      </span>
    </button>
  );
}

/** The story bubble alone (the website's hero uses it too). Renders nothing until the Rundown has cards. */
export function RundownStory() {
  const { count, done } = useRundownCount();
  return count > 0 ? <RundownBubble count={count} done={done} /> : null;
}

export function HomeHero({ name = '', today, cycle = null, hormonalBC = false, sleep = null, activity = null, onOpenMetric = null, onConnect = null, streak = null, onLog = null, onMonth = null }) {
  const { count, done } = useRundownCount();
  return (
    <section className="ay-hh" aria-labelledby="ay-hh-hi">
      <div className="ay-hh__band">
        <p className="ay-hh__date">{fmtLong(today)}</p>
        <h2 id="ay-hh-hi" className="ay-hh__hi">{hello()}{name ? `, ${name}` : ''}.</h2>
        <ScoreRings bare animate label="Your scores today" cycle={cycle} hormonalBC={hormonalBC} sleep={sleep} activity={activity}
          onOpen={onOpenMetric ? (area) => onOpenMetric(area === 'cycle' ? 'cycle' : area === 'sleep' ? 'sleep_minutes' : activity?.metric || 'steps') : null}
          onConnect={onConnect} />
        {(count > 0 || streak) && (
          <div className="ay-hh__row">
            {count > 0 && <RundownBubble count={count} done={done} />}
            {streak && <Streak streak={streak} onLog={onLog} onMonth={onMonth} />}
          </div>
        )}
      </div>
      <ScallopEdge shape="wave" tone="ink" className="ay-hh__edge" />
    </section>
  );
}

/**
 * Highlights (Oura's top stories, the Your data carousel taken further): one
 * card per change in her week (one calm surface, founder Oct 27 11:40),
 * its last 7 days against her usual band with today's dot, and one plain
 * sentence. A tap opens that metric's detail (MetricSheet) to see why.
 */
export function HomeHighlights({ items = [], today, onOpen }) {
  if (!items.length) return null;
  return (
    <section className="ay-hhl" aria-labelledby="ay-hhl-h">
      <h2 id="ay-hhl-h" className="ay-hhl__h">This week&rsquo;s highlights</h2>
      <SnapCarousel
        label="This week's highlights"
        items={items.map((it) => ({
          key: it.id,
          node: (
            <button type="button" className="ay-hhl__card" onClick={() => onOpen?.(it.metric)} aria-label={`${it.title}. See why.`} aria-haspopup={it.chart ? 'dialog' : undefined}>
              <span className="ay-hhl__kicker" aria-hidden="true">{it.label}{it.isNew && <em>New</em>}</span>
              {it.chart && it.chart.points?.length > 1 && (
                <span className="ay-hhl__chart" aria-hidden="true">
                  <Sparkline points={lastDays(it.chart.points, today)} band={it.band} metric={it.metric} label={it.label} w={280} h={64} />
                  <span className="ay-hhl__axis"><small>7 days ago</small><small>Today</small></span>
                </span>
              )}
              <span className="ay-hhl__title" aria-hidden="true">{it.title}</span>
              <span className="ay-hhl__why" aria-hidden="true">See why<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></span>
            </button>
          ),
        }))}
      />
    </section>
  );
}

/** Two big shortcuts right under the highlights: Your data (the espresso feature tile) and Your products (calm surface, Oct 27). */
export function HomeShortcuts({ cycle = null, sleep = null, products = [], onData, onProducts }) {
  // Two photos: three ran under the corner arrow once the plates kept their 44px size (Oct 27).
  const shown = products.filter((p) => p?.id).slice(0, 2);
  const R = 22;
  const C = 2 * Math.PI * R;
  const ring = cycle?.cycleDay
    ? { n: String(cycle.cycleDay), k: 'Cycle day', f: cycle.avgLength ? Math.min(1, cycle.cycleDay / cycle.avgLength) : 0 }
    : sleep && (sleep.week ?? sleep.avg) != null
      ? { n: short('sleep_minutes', sleep.week ?? sleep.avg).replace(/\s/g, ''), k: 'Sleep', f: sleep.usual ? Math.min(1, (sleep.week ?? sleep.avg) / sleep.usual) : 0 }
      : null;
  return (
    <div className="ay-hsc" role="group" aria-label="Shortcuts">
      <button type="button" className="ay-hsc__tile is-data" onClick={onData} aria-label={`Your data${ring ? `: ${ring.k} ${ring.n}` : ''}. Open your dashboard.`}>
        <span className="ay-hsc__ring" aria-hidden="true">
          <svg viewBox="0 0 56 56"><circle cx="28" cy="28" r={R} className="is-track" />{ring?.f > 0 && <circle cx="28" cy="28" r={R} className="is-arc" strokeDasharray={`${(C * ring.f).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 28 28)" />}</svg>
          <b className={ring && ring.n.length > 3 ? 'is-long' : ''}>{ring ? ring.n : '+'}</b>
        </span>
        <span className="ay-hsc__text" aria-hidden="true"><b>Your data</b><small>{ring ? 'Trends and charts' : 'Connect to start'}</small></span>
        <svg className="ay-hsc__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <button type="button" className="ay-hsc__tile is-products" onClick={onProducts} aria-label={`Your products: ${products.length} ${products.length === 1 ? 'product' : 'products'}. Open.`}>
        <span className="ay-hsc__photos" aria-hidden="true">
          {shown.length
            ? shown.map((p) => <Plate key={p.id} src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="ay-hsc__plate" />)
            : <span className="ay-hsc__none">Your matches</span>}
        </span>
        <span className="ay-hsc__text" aria-hidden="true"><b>Your products</b><small>{products.length ? `${products.length} in your ecosystem` : 'Find what fits you'}</small></span>
        <svg className="ay-hsc__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

const PHRASE = {
  sleep_minutes: ['Sleep dipped', 'Sleep steady', 'Sleep up'],
  steps: ['steps down', 'steps steady', 'steps up'],
  resting_hr_bpm: ['heart a little low', 'heart steady', 'heart a little high'],
  hrv_rmssd_ms: ['recovery lower', 'recovery steady', 'recovery higher'],
  hrv_sdnn_ms: ['recovery lower', 'recovery steady', 'recovery higher'],
  temp_deviation_c: ['temperature down', 'temperature steady', 'temperature up'],
  basal_temp_c: ['temperature down', 'temperature steady', 'temperature up'],
  skin_temp_night_c: ['temperature down', 'temperature steady', 'temperature up'],
};

/** Her week in one line, from her own comparisons ("Sleep dipped, steps steady, heart a little high."). */
export function weekSentence(charts = [], takeawayOf) {
  const parts = charts.map((c) => {
    const t = takeawayOf(c);
    if (!t || !PHRASE[c.metric] || c.usual == null) return null;
    return PHRASE[c.metric][t.dir + 1];
  }).filter(Boolean);
  if (!parts.length) return '';
  const s = parts.join(', ');
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

/** The line that leads Your week, on the page with a pink highlight underline (no band, Oct 27). */
export function WeekLine({ text }) {
  if (!text) return null;
  return (
    <div className="ay-hwl">
      <p className="ay-hwl__k">This week, against your usual</p>
      <p className="ay-hwl__t"><span>{text}</span></p>
      <svg className="ay-hwl__edge" viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={`M0 0H240V6${Array.from({ length: 6 }, (_, i) => `Q${230 - i * 40} 12 ${220 - i * 40} 6Q${210 - i * 40} 0 ${200 - i * 40} 6`).join('')}Z`} /></svg>
    </div>
  );
}
