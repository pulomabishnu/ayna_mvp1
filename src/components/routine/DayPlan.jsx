import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  readMeds, saveMed, setMedActive, setMedReminder, recordDose, undoDose, historyFor, scheduleLabel, doseLabel,
  fmtTime, localDay, UNITS, FREQS, WEEKDAYS,
} from '../../health/medications.js';
import {
  readActivities, saveActivity, stopActivity, recordActivity, undoActivity, setFeel, planFor, FEELS, ACTIVITY_IDEAS,
} from '../../health/dayPlan.js';
import { syncPlanReminders, planRemindersAvailable, sendTestReminder } from '../../health/planReminders.js';
import { readGoals, toggleDone, GOALS_CHANGED_EVENT } from '../../health/myGoals.js';
import { toast } from '../../utils/toast.js';
import { haptic } from '../../utils/haptics.js';
import './day-plan.css';

/**
 * Today's plan (founder brief Nov 15, P1: medication schedules, an interactive daily timeline,
 * her own activities, a check-in after an activity, synced with the rundown). Everything on it is
 * something she added. Meds: Taken / Skip / Snooze, Undo; nothing is marked taken by itself.
 * ayna never gives dosing advice (the form says so). On this phone only.
 */
const STATE_WORD = { done: 'Done', skipped: 'Skipped', missed: 'Missed', due: 'Now', upcoming: 'Later', snoozed: 'Snoozed', any: 'Any time' };

function useStores() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener('ayna:meds-changed', on);
    window.addEventListener('storage', on);
    window.addEventListener(GOALS_CHANGED_EVENT, on);
    window.addEventListener('ayna:plan-synced', on);
    const id = window.setInterval(on, 60000); // states move with the clock (upcoming -> now -> missed)
    return () => { window.removeEventListener('ayna:meds-changed', on); window.removeEventListener('storage', on); window.removeEventListener(GOALS_CHANGED_EVENT, on); window.removeEventListener('ayna:plan-synced', on); window.clearInterval(id); };
  }, []);
  return useMemo(() => ({ meds: readMeds(), acts: readActivities(), goals: (() => { try { return readGoals(); } catch { return []; } })(), now: new Date() }), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
}

function ReminderNote({ status, onTest }) {
  // Nov 16: once a reminder is set, one tap shows a test reminder in 5 seconds (lock the phone to see it).
  if (status === 'scheduled' && onTest) return <p className="ay-dp__note" role="status">Reminder set. <button type="button" className="ay-dp__ghost" onClick={onTest}>Send a test reminder</button></p>;
  if (status === 'test_sent') return <p className="ay-dp__note" role="status">A test reminder arrives in 5 seconds. Lock your phone to see it.</p>;
  if (!status || status === 'scheduled' || status === 'none') return null;
  const text = status === 'denied' ? 'Notifications are off for ayna. Turn them on in your phone Settings to get reminders.'
    : status === 'unavailable' ? 'Reminders work in the ayna app on your phone.'
      : "Couldn't set the reminder. Try again.";
  return <p className="ay-dp__note" role="status">{text}</p>;
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return <div className="ay-dp-sheet" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="ay-dp-sheet__panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ay-dp-sheet__head"><p className="ay-dp-sheet__title">{title}</p><button type="button" className="ay-dp__ghost" onClick={onClose}>Close</button></div>
      {children}
    </div>
  </div>;
}

const blankMed = { name: '', dose: '', unit: 'mg', kind: 'scheduled', freq: 'daily', days: [], times: ['08:00'], start: '', end: '', remind: true, notes: '' };

export function MedForm({ initial = null, onDone }) {
  const [f, setF] = useState(() => (initial ? { ...blankMed, ...initial, start: initial.start || '', end: initial.end || '', times: initial.times?.length ? initial.times : ['08:00'] } : blankMed));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const r = saveMed(f, { id: initial?.id || null });
    if (!r.ok) { setErrors(r.errors || {}); setSaving(false); return; }
    const status = await syncPlanReminders({ ask: Boolean(r.med.remind), today: localDay() });
    setSaving(false);
    toast(r.duplicate ? `${r.med.name} is already on your plan` : r.edited ? 'Changes saved' : `${r.med.name} added to your plan`);
    onDone?.(r.med, status);
  };
  const err = (k) => errors[k] && <span className="ay-dp-form__err" id={`ay-dp-err-${k}`}>{errors[k]}</span>;
  return <form className="ay-dp-form" onSubmit={submit} noValidate>
    <p className="ay-dp-form__lead">As your prescriber wrote it. ayna never gives dosing advice.</p>
    <label>Medication name<input value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'ay-dp-err-name' : undefined} />{err('name')}</label>
    <div className="ay-dp-form__row">
      <label>Dose<input value={f.dose} onChange={(e) => set('dose', e.target.value)} inputMode="decimal" placeholder="e.g. 50" aria-invalid={Boolean(errors.dose)} />{err('dose')}</label>
      <label>Unit<select value={f.unit} onChange={(e) => set('unit', e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
    </div>
    <fieldset className="ay-dp-seg"><legend>How you take it</legend>
      {[['scheduled', 'On a schedule'], ['as_needed', 'As needed']].map(([id, label]) => <button key={id} type="button" aria-pressed={f.kind === id} onClick={() => set('kind', id)}>{label}</button>)}
    </fieldset>
    {f.kind === 'scheduled' && <>
      <label>How often<select value={f.freq} onChange={(e) => set('freq', e.target.value)}>{FREQS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
      {f.freq !== 'daily' && <fieldset className="ay-dp-days"><legend>{f.freq === 'weekly' ? 'Which day' : 'Which days'}</legend>
        {WEEKDAYS.map((d, i) => <button key={d} type="button" aria-pressed={f.days.includes(i)} onClick={() => set('days', f.freq === 'weekly' ? [i] : f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i])}>{d}</button>)}
        {err('days')}
      </fieldset>}
      <fieldset className="ay-dp-times"><legend>Times</legend>
        {f.times.map((t, i) => <div key={i} className="ay-dp-times__row">
          <input type="time" value={t} aria-label={`Time ${i + 1}`} onChange={(e) => set('times', f.times.map((x, j) => (j === i ? e.target.value : x)))} />
          {f.times.length > 1 && <button type="button" className="ay-dp__ghost" onClick={() => set('times', f.times.filter((_, j) => j !== i))} aria-label={`Remove time ${i + 1}`}>Remove</button>}
        </div>)}
        {f.times.length < 6 && <button type="button" className="ay-dp__ghost" onClick={() => set('times', [...f.times, '20:00'])}>Add a time</button>}
        {err('times')}
      </fieldset>
      <div className="ay-dp-form__row">
        <label>Start<input type="date" value={f.start} onChange={(e) => set('start', e.target.value)} /></label>
        <label>End (optional)<input type="date" value={f.end} onChange={(e) => set('end', e.target.value)} aria-invalid={Boolean(errors.end)} />{err('end')}</label>
      </div>
      <label className="ay-dp-check"><input type="checkbox" checked={f.remind} onChange={(e) => set('remind', e.target.checked)} />Remind me at these times<small>The lock screen never shows the name.</small></label>
    </>}
    <label>Notes (optional)<input value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. with food" /></label>
    {err('form')}
    <button type="submit" className="ay-dp__primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add to my plan'}</button>
  </form>;
}

export function ActivityForm({ initial = null, onDone }) {
  const [f, setF] = useState(() => ({ title: '', days: [], checkIn: true, remind: false, ...(initial || {}), time: initial?.time || '' }));
  const [errors, setErrors] = useState({});
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    const r = saveActivity(f, { id: initial?.id || null });
    if (!r.ok) { setErrors(r.errors || {}); return; }
    const status = await syncPlanReminders({ ask: Boolean(r.activity.remind), today: localDay() });
    toast(r.duplicate ? `${r.activity.title} is already on your plan` : r.edited ? 'Changes saved' : `${r.activity.title} added to your plan`);
    onDone?.(r.activity, status);
  };
  return <form className="ay-dp-form" onSubmit={submit} noValidate>
    {!initial && <div className="ay-dp-ideas" role="group" aria-label="Ideas">{ACTIVITY_IDEAS.map((t) => <button key={t} type="button" aria-pressed={f.title === t} onClick={() => set('title', t)}>{t}</button>)}</div>}
    <label>What is it?<input value={f.title} onChange={(e) => set('title', e.target.value)} autoComplete="off" aria-invalid={Boolean(errors.title)} />{errors.title && <span className="ay-dp-form__err">{errors.title}</span>}</label>
    <label>Time (optional)<input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></label>
    <fieldset className="ay-dp-days"><legend>Days (none picked = every day)</legend>
      {WEEKDAYS.map((d, i) => <button key={d} type="button" aria-pressed={f.days.includes(i)} onClick={() => set('days', f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i])}>{d}</button>)}
    </fieldset>
    <label className="ay-dp-check"><input type="checkbox" checked={f.checkIn} onChange={(e) => set('checkIn', e.target.checked)} />Ask how I feel after<small>Better, same or worse, in one tap.</small></label>
    {f.time && <label className="ay-dp-check"><input type="checkbox" checked={f.remind} onChange={(e) => set('remind', e.target.checked)} />Remind me</label>}
    <button type="submit" className="ay-dp__primary">{initial ? 'Save changes' : 'Add to my plan'}</button>
  </form>;
}

function History({ med, store }) {
  const rows = historyFor(med.id, store, 60);
  if (!rows.length) return <p className="ay-dp__muted">Nothing logged yet. Tap Taken or Skip on your plan and it shows here.</p>;
  return <ul className="ay-dp-hist">{rows.map((d) => <li key={d.id}>
    <span>{new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{d.time ? ` · ${fmtTime(d.time)}` : ''}</span>
    <b className={`is-${d.status}`}>{d.status === 'taken' ? `Taken ${new Date(d.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : d.status === 'skipped' ? 'Skipped' : 'Snoozed'}</b>
  </li>)}</ul>;
}

const TICK = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/* One row on the day rail (inspo, Nov 11 rules: plain rows on a rail, no stacked boxes, one round
   check per row). Tap the circle to tick it off; tap the row for Skip, Snooze, Undo. */
function PlanItem({ it, day, isToday, onChanged }) {
  const [open, setOpen] = useState(false);
  const med = it.type === 'med';
  const goal = it.type === 'goal';
  const act = (status) => {
    if (goal) {
      toggleDone(it.id, day);
      toast(`${it.title}: done`, { label: 'Undo', onClick: () => toggleDone(it.id, day) });
      return;
    }
    if (med) {
      const r = recordDose({ medId: it.id, day, time: it.time, status });
      if (!r.ok) { toast("Couldn't save. Try again."); return; }
      if (r.duplicate) return;
      toast(status === 'taken' ? `${it.title}: taken` : status === 'skipped' ? `${it.title}: skipped` : `${it.title}: snoozed 15 min`, { label: 'Undo', onClick: () => undoDose(r.dose.id) });
    } else {
      const r = recordActivity({ activityId: it.id, day, status });
      if (!r.ok) { toast("Couldn't save. Try again."); return; }
      if (!r.duplicate) toast(`${it.title}: ${status === 'done' ? 'done' : 'skipped'}`, { label: 'Undo', onClick: () => undoActivity(r.record.id) });
    }
    setOpen(false);
    onChanged?.();
  };
  const undo = () => { if (goal) toggleDone(it.id, day); else if (it.record?.id) (med ? undoDose : undoActivity)(it.record.id); toast('Undone'); setOpen(false); };
  const done = it.state === 'done';
  const needFeel = it.type === 'activity' && done && it.checkIn && !it.record?.feel;
  const word = done ? (med ? 'Taken' : 'Done') : it.state === 'due' ? null : it.state === 'any' ? null : STATE_WORD[it.state];
  const sub = [it.sub, goal ? 'Your goal' : null, !med && it.record?.feel ? `Felt ${it.record.feel} after` : null].filter(Boolean).join(' · ');
  const hasMore = !goal || done;
  const id = `ay-dp-more-${it.key.replace(/[^a-z0-9]/gi, '')}`;
  return <li className={`ay-dp-row is-${it.state}`}>
    <span className="ay-dp-row__time">{it.time ? fmtTime(it.time) : ''}</span>
    <span className="ay-dp-row__dot" aria-hidden="true" />
    <div className="ay-dp-row__body">
      <button type="button" className="ay-dp-row__main" aria-expanded={hasMore ? open : undefined} aria-controls={hasMore ? id : undefined} onClick={() => { if (!hasMore) return; haptic('selection'); setOpen((v) => !v); }} disabled={!hasMore}>
        <b>{it.title}{it.state === 'due' && <em className="ay-dp-now">Now</em>}</b>
        {(sub || word) && <span>{[sub, word].filter(Boolean).join(' · ')}</span>}
      </button>
      {open && <div id={id} className="ay-dp-row__more" role="group" aria-label={`More for ${it.title}`}>
        {done || it.state === 'skipped'
          ? <button type="button" className="ay-dp__ghost" onClick={undo}>Undo</button>
          : <>
            {!goal && <button type="button" className="ay-dp__ghost" onClick={() => act('skipped')}>Skip</button>}
            {med && isToday && ['due', 'missed', 'snoozed'].includes(it.state) && <button type="button" className="ay-dp__ghost" onClick={() => act('snoozed')}>Snooze 15 min</button>}
          </>}
      </div>}
      {needFeel && <div className="ay-dp-feel" role="group" aria-label={`How do you feel after ${it.title}?`}>
        <span>How do you feel now?</span>
        {FEELS.map((x) => <button key={x.id} type="button" onClick={() => { setFeel(it.record.id, x.id); toast('Saved to your check-ins'); }}>{x.label}</button>)}
      </div>}
    </div>
    <button type="button" className="ay-dp-check" aria-pressed={done}
      aria-label={done ? `${it.title}: ${med ? 'taken' : 'done'}. Undo` : `Mark ${it.title} ${med ? 'taken' : 'done'}`}
      onClick={() => { haptic(done ? 'light' : 'success'); if (done) undo(); else act(med ? 'taken' : 'done'); }}>{TICK}</button>
  </li>;
}

function Chevron() { return <svg className="ay-dp-start__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>; }

export default function DayPlan({ compact = false, heading = "Today's plan", headingLevel = 2, includeGoals = true, onAddProducts = null }) {
  const { meds, acts, goals, now } = useStores();
  const [offset, setOffset] = useState(0);
  const day = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() + offset); return localDay(d); }, [now, offset]);
  const items = useMemo(() => planFor(day, { now, meds, acts, goals: includeGoals ? goals : [] }), [day, now, meds, acts, goals, includeGoals]);
  const [sheet, setSheet] = useState(null); // {type:'med'|'act'|'history', item}
  const [remStatus, setRemStatus] = useState(null);
  const close = useCallback(() => setSheet(null), []);
  const done = items.filter((i) => i.state === 'done').length;
  const activeMeds = meds.meds.filter((m) => m.active);
  const stoppedMeds = meds.meds.filter((m) => !m.active);
  const asNeeded = activeMeds.filter((m) => m.kind === 'as_needed');
  const myActs = acts.items.filter((a) => a.active);
  const H = `h${headingLevel}`;
  const dayWord = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : offset === 1 ? 'Tomorrow' : new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Keep phone reminders in line with her plan when this opens (an end date may have passed).
  useEffect(() => { syncPlanReminders({ today: localDay() }).catch(() => {}); }, []);

  return <section className="ay-dp" aria-labelledby="ay-dp-h" data-tour="day-plan">
    <div className="ay-dp__top">
      <H id="ay-dp-h" className="ay-dp__h">{heading}</H>
      <button type="button" className="ay-dp-add" onClick={() => setSheet({ type: 'add', tab: 'med' })} aria-label="Add to your plan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
    </div>
    {items.length > 0 && <div className="ay-dp-progress" aria-live="polite">
      <span>{done} of {items.length} done</span>
      <i aria-hidden="true"><b style={{ width: `${Math.round((done / items.length) * 100)}%` }} /></i>
    </div>}
    {/* Nov 15 (founder): with nothing planned at all, no day switcher; it only matters once there is a plan. */}
    {!compact && (activeMeds.length > 0 || myActs.length > 0 || offset !== 0) && <div className="ay-dp-days-nav" role="group" aria-label="Day">
      <button type="button" className="ay-dp__ghost ay-dp-arrow" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">‹</button>
      <span>{dayWord}</span>
      <button type="button" className="ay-dp__ghost ay-dp-arrow" onClick={() => setOffset((o) => o + 1)} aria-label="Next day" disabled={offset >= 7}>›</button>
      {offset !== 0 && <button type="button" className="ay-dp__ghost" onClick={() => setOffset(0)}>Back to today</button>}
    </div>}
    {/* Nov 15 (founder: "this looks horrible"): one grouped list, like Apple Health, instead of three different button styles. */}
    {items.length === 0
      ? (offset === 0
        ? <div className="ay-dp-empty">
          <p>Add what you take and do each day. ayna lays it out by time so you can tick it off.</p>
          <ul className="ay-dp-start">
            <li><button type="button" onClick={() => setSheet({ type: 'add', tab: 'med' })}><i aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)" /><path d="M9.2 9.2l5.6 5.6" /></svg></i><span><b>Add a medication</b><small>With reminders if you want them</small></span><Chevron /></button></li>
            <li><button type="button" onClick={() => setSheet({ type: 'add', tab: 'act' })}><i aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="1.8" /><path d="M9 21l2.5-6 3 2.5V21M7 11l3-3.5 4 1 2.5 3.5M11.5 15l1-6" /></svg></i><span><b>Add an activity</b><small>A walk, stretching, a bath</small></span><Chevron /></button></li>
            {onAddProducts && <li><button type="button" onClick={onAddProducts}><i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg></i><span><b>Add products</b><small>Choose when you use each one</small></span><Chevron /></button></li>}
          </ul>
        </div>
        : <p className="ay-dp__muted">Nothing planned this day.</p>)
      : <ol className="ay-dp__rail">{items.map((it) => <PlanItem key={it.key} it={it} day={day} isToday={offset === 0} />)}</ol>}
    {offset === 0 && asNeeded.length > 0 && <div className="ay-dp-asneeded"><span>As needed</span>{asNeeded.map((m) => <button key={m.id} type="button" className="ay-dp__ghost" onClick={() => {
      const t = new Date(); const r = recordDose({ medId: m.id, day, time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`, status: 'taken' });
      if (r.ok) toast(`${m.name}: logged`, { label: 'Undo', onClick: () => undoDose(r.dose.id) });
    }}>Log {m.name}</button>)}</div>}
    <ReminderNote status={remStatus} onTest={planRemindersAvailable() ? async () => setRemStatus(await sendTestReminder()) : null} />

    {!compact && (activeMeds.length > 0 || stoppedMeds.length > 0 || myActs.length > 0) && <details className="ay-dp-manage">
      <summary>Manage medications and activities</summary>
      {activeMeds.length > 0 && <ul className="ay-dp-mlist">{activeMeds.map((m) => <li key={m.id}>
        <div><b>{m.name}</b><span>{[doseLabel(m), scheduleLabel(m)].filter(Boolean).join(' · ')}</span></div>
        <div className="ay-dp-mlist__acts">
          {m.kind === 'scheduled' && <label className="ay-dp-switch"><input type="checkbox" checked={m.remind} onChange={async (e) => { setMedReminder(m.id, e.target.checked); setRemStatus(await syncPlanReminders({ ask: e.target.checked, today: localDay() })); }} />Reminder</label>}
          <button type="button" className="ay-dp__ghost" onClick={() => setSheet({ type: 'med', item: m })}>Edit</button>
          <button type="button" className="ay-dp__ghost" onClick={() => setSheet({ type: 'history', item: m })}>History</button>
          <button type="button" className="ay-dp__ghost" onClick={async () => { setMedActive(m.id, false); await syncPlanReminders({ today: localDay() }); toast(`${m.name} stopped. History kept.`, { label: 'Undo', onClick: () => { setMedActive(m.id, true); syncPlanReminders({ today: localDay() }); } }); }}>Stop</button>
        </div>
      </li>)}</ul>}
      {myActs.length > 0 && <ul className="ay-dp-mlist">{myActs.map((a) => <li key={a.id}>
        <div><b>{a.title}</b><span>{[a.time ? fmtTime(a.time) : 'Any time', a.days?.length ? a.days.map((d) => WEEKDAYS[d]).join(', ') : 'Every day'].join(' · ')}</span></div>
        <div className="ay-dp-mlist__acts">
          <button type="button" className="ay-dp__ghost" onClick={() => setSheet({ type: 'act', item: a })}>Edit</button>
          <button type="button" className="ay-dp__ghost" onClick={async () => { stopActivity(a.id); await syncPlanReminders({ today: localDay() }); toast(`${a.title} removed from your plan`); }}>Remove</button>
        </div>
      </li>)}</ul>}
      {stoppedMeds.length > 0 && <><p className="ay-dp__muted">Stopped (history kept)</p><ul className="ay-dp-mlist is-stopped">{stoppedMeds.map((m) => <li key={m.id}>
        <div><b>{m.name}</b><span>Stopped {m.stoppedAt ? new Date(m.stoppedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span></div>
        <div className="ay-dp-mlist__acts">
          <button type="button" className="ay-dp__ghost" onClick={() => setSheet({ type: 'history', item: m })}>History</button>
          <button type="button" className="ay-dp__ghost" onClick={async () => { setMedActive(m.id, true); await syncPlanReminders({ today: localDay() }); toast(`${m.name} restarted`); }}>Restart</button>
        </div>
      </li>)}</ul></>}
      {!planRemindersAvailable() && <p className="ay-dp__muted">Reminders work in the ayna app on your phone.</p>}
    </details>}

    {sheet?.type === 'add' && <Sheet title="Add to your plan" onClose={close}>
      <div className="ay-dp-seg ay-dp-seg--top" role="group" aria-label="What to add">
        {[['med', 'Medication'], ['act', 'Activity']].map(([k, label]) => <button key={k} type="button" aria-pressed={sheet.tab === k} onClick={() => setSheet({ type: 'add', tab: k })}>{label}</button>)}
      </div>
      {sheet.tab === 'med'
        ? <MedForm key="med" onDone={(_, st) => { setRemStatus(st); close(); }} />
        : <ActivityForm key="act" onDone={(_, st) => { setRemStatus(st); close(); }} />}
    </Sheet>}
    {sheet?.type === 'med' && <Sheet title={sheet.item ? `Edit ${sheet.item.name}` : 'Add a medication'} onClose={close}><MedForm initial={sheet.item || null} onDone={(_, st) => { setRemStatus(st); close(); }} /></Sheet>}
    {sheet?.type === 'act' && <Sheet title={sheet.item ? `Edit ${sheet.item.title}` : 'Add an activity'} onClose={close}><ActivityForm initial={sheet.item || null} onDone={(_, st) => { setRemStatus(st); close(); }} /></Sheet>}
    {sheet?.type === 'history' && <Sheet title={`${sheet.item.name}: history`} onClose={close}><History med={sheet.item} store={meds} /></Sheet>}
  </section>;
}
