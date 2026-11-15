/**
 * Her day plan (founder brief Nov 15, P1): her own activities plus her medication doses, as one
 * timeline with honest states. Everything here is what she added; ayna never invents a step.
 *
 * Activities (localStorage KEY): { items: Activity[], records: Record[], updatedAt }
 *   Activity = { id, title, time: 'HH:MM'|null, days: number[] (empty = every day), checkIn: bool,
 *                remind: bool, active: bool, createdAt, updatedAt }
 *   Record   = { id, activityId, day, status: 'done'|'skipped', feel: 'better'|'same'|'worse'|null, at }
 *
 * States: done / skipped / missed (time passed by over an hour, nothing recorded) / due / upcoming /
 * snoozed (meds). Nothing is ever auto-marked done. On this phone only; never sent to analytics.
 */
import { readMeds, dosesFor, doseState, doseLabel, fmtTime, localDay } from './medications.js';
import { readGoals } from './myGoals.js';

export const ACT_KEY = 'ayna_activities_v1';
export const FEELS = [
  { id: 'better', label: 'Better' },
  { id: 'same', label: 'Same' },
  { id: 'worse', label: 'Worse' },
];
/** One-tap ideas when she adds an activity. Plain habits, no claims. */
export const ACTIVITY_IDEAS = ['Walk', 'Stretch', 'Heat pad', 'Water', 'Wind down', 'Journal', 'Log symptoms'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const nowIso = () => new Date().toISOString();
const rid = () => `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function readActivities(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(ACT_KEY) || 'null');
    if (!v || !Array.isArray(v.items) || !Array.isArray(v.records)) return { items: [], records: [], updatedAt: null };
    return v;
  } catch { return { items: [], records: [], updatedAt: null }; }
}

function write(store, storage) {
  const next = { ...store, updatedAt: nowIso() };
  try { storage?.setItem(ACT_KEY, JSON.stringify(next)); } catch { return { ok: false, store }; }
  try { globalThis.dispatchEvent?.(new CustomEvent('ayna:meds-changed')); } catch { /* not a browser */ }
  return { ok: true, store: next };
}

export function validateActivity(input = {}) {
  const errors = {};
  const title = String(input.title || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (title.length < 2) errors.title = 'Give it a short name.';
  const time = input.time && TIME.test(String(input.time)) ? String(input.time) : null;
  if (input.time && !time) errors.time = 'Pick a time, or leave it for any time.';
  const days = Array.isArray(input.days) ? [...new Set(input.days.map(Number).filter((d) => d >= 0 && d <= 6))].sort() : [];
  if (Object.keys(errors).length) return { errors };
  return { activity: { title, time, days: days.length === 7 ? [] : days, checkIn: Boolean(input.checkIn), remind: Boolean(input.remind && time) } };
}

export function saveActivity(input, { id = null, storage = globalThis.localStorage } = {}) {
  const v = validateActivity(input);
  if (v.errors) return { ok: false, errors: v.errors };
  const store = readActivities(storage);
  const at = nowIso();
  let activity;
  if (id) {
    const old = store.items.find((a) => a.id === id);
    if (!old) return { ok: false, errors: { form: 'That activity was not found.' } };
    activity = { ...old, ...v.activity, updatedAt: at };
    store.items = store.items.map((a) => (a.id === id ? activity : a));
  } else {
    const dup = store.items.find((a) => a.active && a.title.toLowerCase() === v.activity.title.toLowerCase() && a.time === v.activity.time);
    if (dup) return { ok: true, activity: dup, duplicate: true };
    activity = { id: rid(), ...v.activity, active: true, createdAt: at, updatedAt: at };
    store.items = [...store.items, activity];
  }
  const w = write(store, storage);
  return w.ok ? { ok: true, activity, edited: Boolean(id) } : { ok: false, errors: { form: "Couldn't save on this device. Try again." } };
}

/** Remove from her plan; past records stay. */
export function stopActivity(id, storage = globalThis.localStorage) {
  const store = readActivities(storage);
  if (!store.items.some((a) => a.id === id)) return { ok: false };
  store.items = store.items.map((a) => (a.id === id ? { ...a, active: false, remind: false, updatedAt: nowIso() } : a));
  return { ok: write(store, storage).ok };
}

const weekday = (day) => new Date(`${day}T12:00:00`).getDay();
export function activityOn(a, day) {
  return Boolean(a?.active) && (!a.days?.length || a.days.includes(weekday(day)));
}

function latestRecord(store, activityId, day) {
  return store.records.filter((r) => r.activityId === activityId && r.day === day).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
}

export function recordActivity({ activityId, day, status, feel = null, now = new Date() }, storage = globalThis.localStorage) {
  if (!['done', 'skipped'].includes(status) || !DAY.test(String(day || ''))) return { ok: false };
  const store = readActivities(storage);
  if (!store.items.some((a) => a.id === activityId)) return { ok: false };
  const prev = latestRecord(store, activityId, day);
  if (prev && prev.status === status && !feel) return { ok: true, record: prev, duplicate: true };
  const record = { id: rid(), activityId, day, status, feel: status === 'done' && FEELS.some((f) => f.id === feel) ? feel : null, at: now.toISOString() };
  store.records = [...store.records, record].slice(-3000);
  const w = write(store, storage);
  return { ok: w.ok, record };
}

/** Add how she felt after an activity she already marked done. */
export function setFeel(recordId, feel, storage = globalThis.localStorage) {
  if (!FEELS.some((f) => f.id === feel)) return { ok: false };
  const store = readActivities(storage);
  if (!store.records.some((r) => r.id === recordId)) return { ok: false };
  store.records = store.records.map((r) => (r.id === recordId ? { ...r, feel } : r));
  return { ok: write(store, storage).ok };
}

export function undoActivity(recordId, storage = globalThis.localStorage) {
  const store = readActivities(storage);
  const n = store.records.length;
  store.records = store.records.filter((r) => r.id !== recordId);
  if (store.records.length === n) return { ok: false };
  store.removed = [...(store.removed || []), recordId].slice(-2000);
  return { ok: write(store, storage).ok };
}

function safeGoals() { try { return readGoals(); } catch { return []; } }

function timeState(time, now, day) {
  if (!time) return 'any';
  const [h, m] = time.split(':').map(Number);
  const due = new Date(`${day}T00:00:00`);
  due.setHours(h, m, 0, 0);
  return now.getTime() - due.getTime() > 60 * 60000 ? 'missed' : now >= due ? 'due' : 'upcoming';
}

/**
 * One timeline for `day`: her doses and her activities, sorted by time (any-time items last).
 * A past day's unrecorded timed step is missed; a future day's is upcoming.
 */
export function planFor(day = localDay(), { now = new Date(), meds = readMeds(), acts = readActivities(), goals = safeGoals() } = {}) {
  const today = localDay(now);
  const out = [];
  for (const d of dosesFor(day, meds)) {
    let state = doseState(d, now, day);
    if (day < today && !['taken', 'skipped'].includes(state)) state = 'missed';
    if (day > today && !['taken', 'skipped'].includes(state)) state = 'upcoming';
    out.push({
      key: `med:${d.med.id}:${d.time}`, type: 'med', id: d.med.id, time: d.time, title: d.med.name,
      sub: [doseLabel(d.med), d.med.notes].filter(Boolean).join(' · '), state: state === 'taken' ? 'done' : state, record: d.record,
    });
  }
  // As-needed doses she logged that day (only what she logged).
  const asNeeded = new Map(meds.meds.filter((m) => m.kind === 'as_needed').map((m) => [m.id, m]));
  for (const d of meds.doses) {
    const m = asNeeded.get(d.medId);
    if (!m || d.day !== day || d.status !== 'taken') continue;
    out.push({ key: `prn:${d.id}`, type: 'med', id: m.id, time: d.time, title: m.name, sub: ['As needed', doseLabel(m)].filter(Boolean).join(' · '), state: 'done', record: d });
  }
  for (const a of acts.items) {
    if (!activityOn(a, day)) continue;
    const rec = latestRecord(acts, a.id, day);
    let state = rec ? rec.status : timeState(a.time, now, day);
    if (!rec && day < today) state = a.time ? 'missed' : 'any';
    if (!rec && day > today) state = 'upcoming';
    out.push({ key: `act:${a.id}`, type: 'activity', id: a.id, time: a.time, title: a.title, sub: '', state, record: rec, checkIn: a.checkIn });
  }
  // Her goals from Home > For today (one list of things to do, not two). Any time of day; never "missed".
  for (const g of goals || []) {
    if (!g?.id || !g.text) continue;
    const doneDay = (g.done || []).includes(day);
    out.push({ key: `goal:${g.id}`, type: 'goal', id: g.id, time: null, title: g.text, sub: '', state: doneDay ? 'done' : day > today ? 'upcoming' : 'any', record: null });
  }
  return out.sort((x, y) => (x.time || '99:99').localeCompare(y.time || '99:99') || x.title.localeCompare(y.title));
}

/** For the rundown and Home: counts and the next thing, in plain words. */
export function planSummary(day = localDay(), opts = {}) {
  const items = planFor(day, opts);
  const done = items.filter((i) => i.state === 'done').length;
  const skipped = items.filter((i) => i.state === 'skipped').length;
  const missed = items.filter((i) => i.state === 'missed').length;
  const next = items.find((i) => ['due', 'upcoming', 'snoozed'].includes(i.state)) || null;
  const feels = items.filter((i) => i.type === 'activity' && i.record?.feel).map((i) => ({ title: i.title, feel: i.record.feel }));
  return {
    total: items.length, done, skipped, missed, medCount: items.filter((i) => i.type === 'med').length,
    next: next ? { title: next.title, time: next.time ? fmtTime(next.time) : null, type: next.type } : null, feels,
  };
}

export const STATE_LABEL = { done: 'Done', skipped: 'Skipped', missed: 'Missed', due: 'Now', upcoming: 'Later', snoozed: 'Snoozed', any: 'Any time' };
