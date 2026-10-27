import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RANGES } from '../../health/dashboard.js';
import { chartFacts, glanceWords, short } from '../../health/dashView.js';
import { AreaChart, PhaseLine, RangePills } from './DashParts.jsx';
import './metric-sheet.css';

/**
 * One metric's detail as a bottom sheet (founder Oct 26: "different unique
 * ways", WHOOP / Apple Health detail): the number against her usual, a
 * 7 / 30 / 90 day switch, the chart with her usual band, three facts, and
 * the full area one tap further. A dialog: focus moves in, Escape or the
 * dim closes it, focus returns to the dial or tile that opened it.
 * The data is HealthHome's own (chartFor), nothing new is computed.
 */
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function MetricSheet({ metric, chartFor, bandOf, today, cycle = null, hormonalBC = false, estimate = null, areaLabel = '', onSeeArea, onClose, surface = 'app' }) {
  const [range, setRange] = useState('week');
  const sheetRef = useRef(null);
  const [opener] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const close = () => {
    onClose();
    try { if (opener?.isConnected) opener.focus({ preventScroll: true }); } catch { /* gone */ }
  };
  useEffect(() => { sheetRef.current?.querySelector('.ay-msheet__close')?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const nodes = [...sheetRef.current.querySelectorAll('button, a[href], [tabindex="0"]')].filter((n) => !n.disabled);
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const isCycle = metric === 'cycle';
  const days = RANGES.find((r) => r.id === range).days;
  const week = isCycle ? null : chartFor(metric, 30);
  const chart = isCycle ? null : chartFor(metric, days);
  const label = isCycle ? (hormonalBC ? 'Bleeding pattern' : 'Cycle') : metric === 'sleep_minutes' ? 'Sleep' : metric === 'steps' ? 'Steps' : week?.label || 'Detail';
  let frame = null;
  const body = () => (
    <div className={`ay-msheet-layer is-${surface}`} style={frame || undefined}>
      <div className="ay-msheet-dim" aria-hidden="true" onClick={close} />
      <section ref={sheetRef} className="ay-msheet" role="dialog" aria-modal="true" aria-labelledby="ay-msheet-h">
        <span className="ay-msheet__grab" aria-hidden="true" />
        <header className="ay-msheet__head">
          <h2 id="ay-msheet-h">{label}</h2>
          <button type="button" className="ay-msheet__close" aria-label={`Close ${label}`} onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        {isCycle ? (
          <div className={`ay-db is-${surface} ay-msheet__body`}>
            <p className="ay-msheet__big">Day {cycle?.cycleDay}{!hormonalBC && cycle?.avgLength ? <small> of about {cycle.avgLength}</small> : null}</p>
            <PhaseLine cycle={cycle} hormonalBC={hormonalBC} />
            <p className="ay-msheet__line">{estimate ? `Next ${hormonalBC ? 'bleed' : 'period'} around ${fmtDay(estimate.day)}, estimated.` : 'Log a few more periods and ayna can estimate your next one.'}</p>
          </div>
        ) : (
          <div className={`ay-db is-${surface} ay-msheet__body`}>
            {week && <p className="ay-msheet__big">{short(metric, week.week ?? week.avg)}<small>{week.usual != null ? ` usual ${short(metric, week.usual)}` : ' still learning your usual'}</small></p>}
            {week && <p className="ay-msheet__line">{glanceWords(week)}</p>}
            <RangePills ranges={RANGES} value={range} onChange={setRange} />
            {chart ? <AreaChart chart={chart} band={bandOf(metric)} today={today} /> : <p className="ay-msheet__line">No readings in the last {days} days.</p>}
            {chart && <dl className="ay-msheet__facts">{chartFacts(chart).map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>}
          </div>
        )}
        {onSeeArea && <button type="button" className="ay-msheet__more" onClick={() => { onClose(); onSeeArea(); }}>See all {areaLabel || label.toLowerCase()}</button>}
      </section>
    </div>
  );
  if (typeof document === 'undefined') return body();
  // Inside the app shell (or the website's), so the dashboard's chart styles apply.
  const host = (surface === 'web' ? document.querySelector('.app-container') : document.querySelector('.ayna-mobile')) || document.body;
  // In the app preview on a computer the app is a phone-sized frame: keep the sheet inside it
  // (founder 22:45: the sheet spilled past the phone). On a phone the frame is the screen.
  if (surface !== 'web' && host !== document.body) {
    const r = host.getBoundingClientRect();
    if (r.width && r.width < window.innerWidth - 1) frame = { left: `${r.left}px`, width: `${r.width}px`, right: 'auto' };
  }
  return createPortal(surface === 'web' ? <div className="ay-wh">{body()}</div> : body(), host);
}
