import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { sleepReport, readSleepEntries, saveSleepEntry, removeSleepEntry, SLEEP_EVENT, fmtMin, MIN_NIGHTS } from '../../health/sleepReport.js';
import { readLog, saveLogEntry, LOG_SAVED_EVENT, addDays } from '../../health/dailyLog.js';
import { addGoal, readGoals } from '../../health/myGoals.js';
import { toast } from '../../utils/toast.js';
import { haptic } from '../../utils/haptics.js';
import { fmtTime } from '../../health/medications.js';
import '../routine/day-plan.css';
import './sleep-report.css';

/**
 * Last night's sleep, with or without a watch (Eliz / Flo; founder brief Nov 15). One focal number,
 * one line against her usual, where it came from, one sourced step, and "Enter last night" for
 * anyone without a wearable. Says plainly when there isn't enough yet. No boxes (Nov 11 rules).
 */
const GOAL_TEXT = 'Same bedtime and wake-up time';
const RATES = [[1, 'Rough'], [2, 'Okay'], [3, 'Good']];

export default function SleepReport({ healthRows = [], today, headingLevel = 2 }) {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener(SLEEP_EVENT, on);
    window.addEventListener(LOG_SAVED_EVENT, on);
    return () => { window.removeEventListener(SLEEP_EVENT, on); window.removeEventListener(LOG_SAVED_EVENT, on); };
  }, []);
  const rep = useMemo(() => {
    let log = {};
    try { log = readLog(); } catch { /* storage blocked */ }
    return sleepReport({ healthRows, entries: readSleepEntries(), log, today });
  }, [healthRows, today, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const H = `h${headingLevel}`;
  const hasGoal = (() => { try { return readGoals().some((g) => g.text === GOAL_TEXT); } catch { return true; } })();
  const est = rep.kind && rep.kind !== 'measured';
  // One short line under the number (Ameera: nothing word-heavy). The full sentences live in Details.
  const short = rep.state === 'ready'
    ? (rep.status === 'usual' ? 'About your usual' : `${fmtMin(Math.abs(rep.diff))} ${rep.status === 'shorter' ? 'under' : 'over'} your usual`)
    : rep.state === 'learning' ? `${MIN_NIGHTS - rep.nights} more ${MIN_NIGHTS - rep.nights === 1 ? 'night' : 'nights'} to learn your usual`
      : rep.state === 'rating_only' ? `Rated ${rep.rating.toLowerCase()}`
        : 'Nothing for last night yet';
  const enterLabel = rep.kind === 'entered' && rep.day === today ? 'Edit' : 'Enter';

  return <div className="ay-sr" role="region" aria-labelledby="ay-sr-h">
    <div className="ay-sr__top">
      <H id="ay-sr-h" className="ay-sr__h">Last night</H>
      {rep.state !== 'none' && <button type="button" className="ay-sr__enter" onClick={() => setOpen(true)} aria-label={`${enterLabel} last night's sleep`}>{enterLabel}</button>}
    </div>
    {rep.minutes
      ? <p className="ay-sr__big" key={rep.minutes}>{est && <span className="ay-sr__approx" aria-label="about">≈</span>}{fmtMin(rep.minutes)}</p>
      : null}
    <p className={`ay-sr__short is-${rep.status || rep.state}`}>{short}</p>
    {rep.state === 'none'
      ? <button type="button" className="ay-dp__primary ay-sr__cta" onClick={() => setOpen(true)}>Enter last night</button>
      : <details className="ay-sr__more" onToggle={(e) => { if (e.currentTarget.open) haptic('selection'); }}>
        <summary>Details<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
        <div className="ay-sr__body">
          {rep.state === 'ready' && <p>Your usual: {fmtMin(rep.usual)}</p>}
          {rep.sourceLine && <p className="ay-sr__muted">{rep.sourceLine}</p>}
          {(rep.bed && rep.wake) || (rep.minutes && rep.rating) ? <p className="ay-sr__muted">{[rep.bed && rep.wake ? `${fmtTime(rep.bed)} to ${fmtTime(rep.wake)}` : null, rep.minutes && rep.rating ? `Rated ${rep.rating.toLowerCase()}` : null].filter(Boolean).join(' · ')}</p> : null}
          {rep.tip && <p>Try:  {rep.tip.text} {' '}<a href={rep.tip.source.url} target="_blank" rel="noopener noreferrer">{rep.tip.source.label.split(':')[0]}</a></p>}
          {!hasGoal && <button type="button" className="ay-dp__ghost ay-sr__goal" onClick={() => { addGoal({ text: GOAL_TEXT, topic: 'sleep' }); haptic('success'); toast('Added to your goals'); }}>Make it a goal</button>}
        </div>
      </details>}
    {open && <EntrySheet today={today} onClose={() => setOpen(false)} />}
  </div>;
}

function EntrySheet({ today, onClose }) {
  const existing = readSleepEntries()[today];
  const [bed, setBed] = useState(existing?.bed || '23:00');
  const [wake, setWake] = useState(existing?.wake || '07:00');
  const [rate, setRate] = useState(() => { try { return readLog()[today]?.sleep ?? null; } catch { return null; } });
  const [error, setError] = useState('');
  const save = (e) => {
    e.preventDefault();
    const r = saveSleepEntry(today, { bed, wake });
    if (r.error) { setError(r.error); return; }
    if (rate) { try { saveLogEntry(today, { sleep: rate }); } catch { /* the times still saved */ } }
    haptic('success');
    toast(`Saved: ${fmtMin(r.minutes)} last night`, { label: 'Undo', onClick: () => removeSleepEntry(today) });
    onClose();
  };
  useEffect(() => {
    const k = (ev) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  const night = new Date(`${addDays(today, -1)}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
  return createPortal(<div className="ay-dp-sheet" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="ay-dp-sheet__panel" role="dialog" aria-modal="true" aria-label="Enter last night">
      <div className="ay-dp-sheet__head"><p className="ay-dp-sheet__title">{night} night</p><button type="button" className="ay-dp__ghost" onClick={onClose}>Close</button></div>
      <form className="ay-dp-form" onSubmit={save} noValidate>
        <div className="ay-dp-form__row">
          <label>Went to bed<input type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></label>
          <label>Woke up<input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></label>
        </div>
        <fieldset className="ay-dp-seg"><legend>How was it?</legend>
          {RATES.map(([v, l]) => <button key={v} type="button" aria-pressed={rate === v} onClick={() => setRate(rate === v ? null : v)}>{l}</button>)}
        </fieldset>
        {error && <span className="ay-dp-form__err" role="alert">{error}</span>}
        <button type="submit" className="ay-dp__primary">Save</button>
      </form>
    </div>
  </div>, document.querySelector('.ayna-mobile') || document.body);
}
