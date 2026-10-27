import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { checkinDaySet, dayLines, estimatedDaySet, legendFor, monthCells, monthComing, monthKey, periodDaySet, shiftMonth } from '../../health/monthCalendar.js';
import './metric-sheet.css';
import './month-sheet.css';

/**
 * "Your month" (founder: a cute calendar, "only if it looks good and doesn't
 * make it too crowded, overstimulating or confusing"): a calm month grid in
 * the MetricSheet bottom sheet. One marker per day at most (period, estimated
 * period, checked in) plus today's ring; tap a day for one compact row;
 * up to 3 coming-up dates; one button, "Log today". Real data only
 * (monthCalendar.js); estimates always say "estimated".
 */
const at = (iso) => new Date(`${iso}T12:00:00Z`);
const fmt = (iso, o) => at(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MARK_WORDS = { period: 'period logged', estimated: 'period expected, estimated', checkin: 'checked in' };

export default function MonthSheet({ today, rows = [], log = {}, cycle = null, estimate = null, coming = [], hormonalBC = false, onLog, onClose, surface = 'app' }) {
  const [ym, setYm] = useState(() => monthKey(today));
  // Nothing picked until she taps a day (calmer first look; today has its ring).
  const [picked, setPicked] = useState(null);
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

  const sets = useMemo(() => {
    const period = periodDaySet({ rows, log });
    return { period, checkin: checkinDaySet(log), estimated: estimatedDaySet(estimate, { today, periodLength: cycle?.periodLength, logged: period }) };
  }, [rows, log, estimate, cycle, today]);
  const cells = monthCells(ym, { today, ...sets });
  const legend = legendFor(cells, { hormonalBC });
  const soon = monthComing(coming, { hormonalBC });
  const hasCycle = sets.period.size > 0 || sets.estimated.size > 0;
  const pickedCell = cells.find((c) => c?.day === picked) || null;
  const lines = pickedCell ? dayLines(picked, { mark: pickedCell.mark, log, coming: soon, hormonalBC, today }) : [];
  const word = (m) => (hormonalBC ? MARK_WORDS[m].replace('period', 'bleed') : MARK_WORDS[m]);
  const monthName = fmt(`${ym}-01`, { month: 'long', year: 'numeric' });
  const go = (n) => { const next = shiftMonth(ym, n); setYm(next); setPicked(null); };

  let frame = null;
  const body = () => (
    <div className={`ay-msheet-layer is-${surface}`} style={frame || undefined}>
      <div className="ay-msheet-dim" aria-hidden="true" onClick={close} />
      <section ref={sheetRef} className="ay-msheet ay-mcal" role="dialog" aria-modal="true" aria-labelledby="ay-mcal-h">
        <span className="ay-msheet__grab" aria-hidden="true" />
        <header className="ay-msheet__head">
          <h2 id="ay-mcal-h">Your month</h2>
          <button type="button" className="ay-msheet__close" aria-label="Close your month" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="ay-mcal__nav">
          <button type="button" className="ay-mcal__arrow" aria-label="Previous month" onClick={() => go(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <p className="ay-mcal__month" aria-live="polite">{monthName}</p>
          <button type="button" className="ay-mcal__arrow" aria-label="Next month" onClick={() => go(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>

        <div className="ay-mcal__cal">
          <div className="ay-mcal__wk" aria-hidden="true">{WEEK.map((w) => <span key={w}>{w[0]}</span>)}</div>
          <div className="ay-mcal__grid" role="group" aria-label={monthName}>
            {cells.map((c, i) => (c ? (
              <button key={c.day} type="button" aria-pressed={picked === c.day}
                className={`ay-mcal__day${c.mark ? ` is-${c.mark}` : ''}${c.today ? ' is-today' : ''}${picked === c.day ? ' is-picked' : ''}`}
                aria-label={`${fmt(c.day, { weekday: 'long', month: 'long', day: 'numeric' })}${c.today ? ', today' : ''}${c.mark ? `, ${word(c.mark)}` : ''}`}
                onClick={() => setPicked((p) => (p === c.day ? null : c.day))}>
                <span className="ay-mcal__n" aria-hidden="true">{c.n}</span>
              </button>
            ) : <span key={`b${i}`} aria-hidden="true" />))}
          </div>
          {legend.length > 0 && (
            <ul className="ay-mcal__legend" aria-label="Key">
              {legend.map((l) => <li key={l.id} className={`is-${l.id}`}><i aria-hidden="true" />{l.label}</li>)}
            </ul>
          )}
        </div>

        {pickedCell && (
          <div className="ay-mcal__picked" aria-live="polite">
            <p className="ay-mcal__pday">{pickedCell.today ? 'Today' : fmt(picked, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            {lines.map((l) => <p key={l} className="ay-mcal__pline">{l}</p>)}
          </div>
        )}

        {!hasCycle && <p className="ay-mcal__empty">Log a period to see your month.</p>}

        {soon.length > 0 && (
          <section className="ay-mcal__soon" aria-labelledby="ay-mcal-soon">
            <h3 id="ay-mcal-soon">Coming up</h3>
            <ol>
              {soon.map((c) => (
                <li key={`${c.day}-${c.title}`}>
                  <span className="ay-mcal__date" aria-hidden="true"><b>{at(c.day).getUTCDate()}</b><small>{c.day === today ? 'Today' : fmt(c.day, { weekday: 'short' })}</small></span>
                  <span className="ay-mcal__stext"><span className="sr-only">{fmt(c.day, { weekday: 'long', month: 'long', day: 'numeric' })}: </span>{c.title}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {onLog && <button type="button" className="ay-mcal__log" onClick={() => { onClose(); onLog(); }}>Log today</button>}
      </section>
    </div>
  );
  if (typeof document === 'undefined') return body();
  const host = (surface === 'web' ? document.querySelector('.app-container') : document.querySelector('.ayna-mobile')) || document.body;
  // In the app preview on a computer the app is a phone-sized frame: keep the sheet inside it (as MetricSheet).
  if (surface !== 'web' && host !== document.body) {
    const r = host.getBoundingClientRect();
    if (r.width && r.width < window.innerWidth - 1) frame = { left: `${r.left}px`, width: `${r.width}px`, right: 'auto' };
  }
  return createPortal(body(), host);
}
