/**
 * Day plan across her devices (medications, doses, activities, check-ins). Used by the app and by
 * /api/day-plan, so both merge the same way:
 *   - a medication or activity: the copy changed most recently wins (by updatedAt);
 *   - doses and activity records: kept from both sides, by id;
 *   - an undone dose/record leaves its id in `removed`, so it never comes back from another device.
 * Stored as one private row per account (supabase/day_plan_2026-11-15.sql). Never sent to analytics.
 */
export const PLAN_LIMITS = { meds: 100, activities: 100, doses: 5000, records: 3000, removed: 2000 };
const MAX_STR = 240;
const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
// A device clock far in the future must not win every merge forever.
const stamp = (v) => (ISO(v) ? (Date.parse(v) > Date.now() + 5 * 60000 ? new Date().toISOString() : v) : new Date(0).toISOString());
const str = (v, n = MAX_STR) => (typeof v === 'string' ? v.slice(0, n) : '');

export function emptyPlan() { return { meds: [], doses: [], activities: [], records: [], removed: [] }; }

function cleanMed(m) {
  if (!m || !ID.test(String(m.id || '')) || !str(m.name, 80).trim()) return null;
  return {
    id: m.id, name: str(m.name, 80), dose: str(m.dose, 20), unit: str(m.unit, 12),
    kind: m.kind === 'as_needed' ? 'as_needed' : 'scheduled', freq: ['daily', 'weekly', 'days'].includes(m.freq) ? m.freq : 'daily',
    days: Array.isArray(m.days) ? m.days.map(Number).filter((d) => d >= 0 && d <= 6).slice(0, 7) : [],
    times: Array.isArray(m.times) ? m.times.filter((t) => TIME.test(String(t))).slice(0, 6) : [],
    start: DAY.test(String(m.start || '')) ? m.start : null, end: DAY.test(String(m.end || '')) ? m.end : null,
    remind: Boolean(m.remind), active: m.active !== false, notes: str(m.notes),
    createdAt: ISO(m.createdAt) ? m.createdAt : null, updatedAt: stamp(m.updatedAt),
    stoppedAt: ISO(m.stoppedAt) ? m.stoppedAt : null,
  };
}
function cleanDose(d) {
  if (!d || !ID.test(String(d.id || '')) || !ID.test(String(d.medId || '')) || !DAY.test(String(d.day || ''))) return null;
  if (!['taken', 'skipped', 'snoozed'].includes(d.status) || !ISO(d.at)) return null;
  return { id: d.id, medId: d.medId, day: d.day, time: TIME.test(String(d.time || '')) ? d.time : null, status: d.status, at: d.at, snoozeUntil: ISO(d.snoozeUntil) ? d.snoozeUntil : null };
}
function cleanActivity(a) {
  if (!a || !ID.test(String(a.id || '')) || !str(a.title, 60).trim()) return null;
  return {
    id: a.id, title: str(a.title, 60), time: TIME.test(String(a.time || '')) ? a.time : null,
    days: Array.isArray(a.days) ? a.days.map(Number).filter((d) => d >= 0 && d <= 6).slice(0, 7) : [],
    checkIn: Boolean(a.checkIn), remind: Boolean(a.remind), active: a.active !== false,
    createdAt: ISO(a.createdAt) ? a.createdAt : null, updatedAt: stamp(a.updatedAt),
  };
}
function cleanRecord(r) {
  if (!r || !ID.test(String(r.id || '')) || !ID.test(String(r.activityId || '')) || !DAY.test(String(r.day || ''))) return null;
  if (!['done', 'skipped'].includes(r.status) || !ISO(r.at)) return null;
  return { id: r.id, activityId: r.activityId, day: r.day, status: r.status, feel: ['better', 'same', 'worse'].includes(r.feel) ? r.feel : null, at: r.at };
}

/** Validate and trim whatever a device sent. Unknown fields are dropped. */
export function cleanPlan(p = {}) {
  const pick = (list, fn, max) => (Array.isArray(list) ? list.slice(-max * 2).map(fn).filter(Boolean).slice(-max) : []);
  return {
    meds: pick(p.meds, cleanMed, PLAN_LIMITS.meds),
    doses: pick(p.doses, cleanDose, PLAN_LIMITS.doses),
    activities: pick(p.activities, cleanActivity, PLAN_LIMITS.activities),
    records: pick(p.records, cleanRecord, PLAN_LIMITS.records),
    removed: Array.isArray(p.removed) ? [...new Set(p.removed.filter((id) => ID.test(String(id))))].slice(-PLAN_LIMITS.removed) : [],
  };
}

const newest = (a, b) => ((Date.parse(b.updatedAt) || 0) > (Date.parse(a.updatedAt) || 0) ? b : a);
function byIdNewest(x = [], y = []) {
  const m = new Map();
  for (const it of [...x, ...y]) m.set(it.id, m.has(it.id) ? newest(m.get(it.id), it) : it);
  return [...m.values()];
}
function union(x = [], y = [], removed, prefer = (a) => a) {
  const m = new Map();
  for (const it of [...x, ...y]) if (!removed.has(it.id)) m.set(it.id, m.has(it.id) ? prefer(m.get(it.id), it) : it);
  return [...m.values()].sort((a, b) => a.at.localeCompare(b.at));
}

/** Merge two plans (both already clean). Pure and symmetric, so any device order gives the same result. */
export function mergePlans(a = emptyPlan(), b = emptyPlan()) {
  const removedList = [...new Set([...(a.removed || []), ...(b.removed || [])])].slice(-PLAN_LIMITS.removed);
  const removed = new Set(removedList);
  return {
    meds: byIdNewest(a.meds, b.meds).slice(-PLAN_LIMITS.meds),
    doses: union(a.doses, b.doses, removed).slice(-PLAN_LIMITS.doses),
    activities: byIdNewest(a.activities, b.activities).slice(-PLAN_LIMITS.activities),
    records: union(a.records, b.records, removed, (p, q) => (q.feel && !p.feel ? q : p)).slice(-PLAN_LIMITS.records),
    removed: removedList,
  };
}

/** The local stores (medications.js + dayPlan.js) as one plan, and back. */
export function planFromStores(meds, acts) {
  return cleanPlan({ meds: meds.meds, doses: meds.doses, activities: acts.items, records: acts.records, removed: [...(meds.removed || []), ...(acts.removed || [])] });
}
export function storesFromPlan(plan) {
  return {
    meds: { meds: plan.meds, doses: plan.doses, removed: plan.removed },
    acts: { items: plan.activities, records: plan.records, removed: plan.removed },
  };
}
