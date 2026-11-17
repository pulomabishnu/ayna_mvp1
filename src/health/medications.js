/**
 * Prescription medication schedules and dose log (Mahek, P1; founder brief Nov 15).
 *
 * Rules (never relaxed):
 * - Everything here is what SHE entered from her prescriber. ayna never suggests a dose, never changes a
 *   schedule, and never tells her to double up after a missed dose.
 * - A dose is only "taken" when she taps Taken. A delivered notification is not adherence.
 * - Editing or stopping a medication never deletes its history.
 * - Local first (works offline, survives closing the app); signed-in accounts sync through
 *   /api/medications when that table exists (medSync.js). Never sent to analytics.
 *
 * Shape (localStorage KEY):
 *   { meds: Med[], doses: Dose[], updatedAt }
 *   Med  = { id, name, dose, unit, kind: 'scheduled'|'as_needed', freq: 'daily'|'weekly'|'days',
 *            days: number[] (0=Sun..6=Sat, for weekly/days), times: 'HH:MM'[], start: 'YYYY-MM-DD'|null,
 *            end: 'YYYY-MM-DD'|null, remind: boolean, active: boolean, notes: string,
 *            createdAt, updatedAt, stoppedAt|null }
 *   Dose = { id, medId, day: 'YYYY-MM-DD', time: 'HH:MM'|null, status: 'taken'|'skipped'|'snoozed',
 *            at: ISO, snoozeUntil: ISO|null }
 */
export const MEDS_KEY = 'ayna_meds_v1';
export const UNITS = ['mg', 'mcg', 'g', 'mL', 'tablet', 'capsule', 'drop', 'puff', 'patch', 'unit', 'IU', 'other'];
export const FREQS = [
  { id: 'daily', label: 'Every day' },
  { id: 'days', label: 'On certain days' },
  { id: 'weekly', label: 'Once a week' },
];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const nowIso = () => new Date().toISOString();
const rid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function emptyStore() { return { meds: [], doses: [], updatedAt: null }; }

export function readMeds(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(MEDS_KEY) || 'null');
    if (!v || !Array.isArray(v.meds) || !Array.isArray(v.doses)) return emptyStore();
    return v;
  } catch { return emptyStore(); }
}

export function writeMeds(store, storage = globalThis.localStorage) {
  const next = { ...store, updatedAt: nowIso() };
  try { storage?.setItem(MEDS_KEY, JSON.stringify(next)); } catch { return { ok: false, store }; }
  try { globalThis.dispatchEvent?.(new CustomEvent('ayna:meds-changed')); } catch { /* not a browser */ }
  return { ok: true, store: next };
}

/** Clean and check what she typed. Returns { med } or { errors: { field: message } }. Nothing is invented. */
export function validateMed(input = {}) {
  const errors = {};
  const name = String(input.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (name.length < 2) errors.name = 'Enter the medication name from your prescription.';
  const kind = input.kind === 'as_needed' ? 'as_needed' : 'scheduled';
  const dose = String(input.dose ?? '').trim().slice(0, 20);
  if (dose && !/^\d+(\.\d+)?(\s*[-/]\s*\d+(\.\d+)?)?$/.test(dose)) errors.dose = 'Use a number, like 10 or 0.5.';
  const unit = UNITS.includes(input.unit) ? input.unit : (dose ? 'mg' : '');
  const freq = ['daily', 'weekly', 'days'].includes(input.freq) ? input.freq : 'daily';
  let days = Array.isArray(input.days) ? [...new Set(input.days.map(Number).filter((d) => d >= 0 && d <= 6))].sort() : [];
  if (kind === 'scheduled' && (freq === 'weekly' || freq === 'days') && !days.length) errors.days = freq === 'weekly' ? 'Pick the day you take it.' : 'Pick at least one day.';
  if (freq === 'weekly') days = days.slice(0, 1);
  const times = [...new Set((Array.isArray(input.times) ? input.times : []).map((t) => String(t).trim()).filter((t) => TIME.test(t)))].sort();
  if (kind === 'scheduled' && !times.length) errors.times = 'Add at least one time.';
  const start = DAY.test(String(input.start || '')) ? input.start : null;
  const end = DAY.test(String(input.end || '')) ? input.end : null;
  if (start && end && end < start) errors.end = 'The end date is before the start date.';
  if (Object.keys(errors).length) return { errors };
  return {
    med: {
      name, dose, unit, kind, freq: kind === 'as_needed' ? 'daily' : freq, days: kind === 'as_needed' ? [] : days,
      times: kind === 'as_needed' ? [] : times, start, end,
      remind: kind === 'scheduled' && input.remind !== false,
      notes: String(input.notes || '').trim().slice(0, 240),
    },
  };
}

/** Add or edit. Editing keeps the id, so past doses stay attached. */
export function saveMed(input, { id = null, storage = globalThis.localStorage } = {}) {
  const v = validateMed(input);
  if (v.errors) return { ok: false, errors: v.errors };
  const store = readMeds(storage);
  const at = nowIso();
  let med;
  if (id) {
    const old = store.meds.find((m) => m.id === id);
    if (!old) return { ok: false, errors: { form: 'That medication was not found.' } };
    med = { ...old, ...v.med, updatedAt: at };
    store.meds = store.meds.map((m) => (m.id === id ? med : m));
  } else {
    // A second identical entry (double tap, same name + times) is the same medication, not a new one.
    const dup = store.meds.find((m) => m.active && m.name.toLowerCase() === v.med.name.toLowerCase() && m.times.join() === v.med.times.join() && m.kind === v.med.kind);
    if (dup) return { ok: true, med: dup, duplicate: true, store };
    med = { id: rid(), ...v.med, active: true, createdAt: at, updatedAt: at, stoppedAt: null };
    store.meds = [...store.meds, med];
  }
  const w = writeMeds(store, storage);
  return w.ok ? { ok: true, med, store: w.store, edited: Boolean(id) } : { ok: false, errors: { form: "Couldn't save on this device. Try again." } };
}

/** Stop (keeps history) or restart. */
export function setMedActive(id, active, storage = globalThis.localStorage) {
  const store = readMeds(storage);
  const med = store.meds.find((m) => m.id === id);
  if (!med) return { ok: false };
  const next = { ...med, active, remind: active ? med.remind : false, stoppedAt: active ? null : nowIso(), updatedAt: nowIso() };
  store.meds = store.meds.map((m) => (m.id === id ? next : m));
  const w = writeMeds(store, storage);
  return { ok: w.ok, med: next };
}

/** Nov 16 (founder: "make sure you can delete the reminders you make"): delete a medication, its reminder and its
 * dose history. Returns what was removed so the screen can offer Undo. */
export function deleteMed(id, storage = globalThis.localStorage) {
  const store = readMeds(storage);
  const med = store.meds.find((m) => m.id === id);
  if (!med) return { ok: false };
  const doses = store.doses.filter((d) => d.medId === id);
  store.meds = store.meds.filter((m) => m.id !== id);
  store.doses = store.doses.filter((d) => d.medId !== id);
  const w = writeMeds(store, storage);
  return { ok: w.ok, removed: { med, doses } };
}

/** Undo for deleteMed. */
export function restoreMed(removed, storage = globalThis.localStorage) {
  if (!removed?.med) return { ok: false };
  const store = readMeds(storage);
  if (!store.meds.some((m) => m.id === removed.med.id)) store.meds.push(removed.med);
  store.doses = [...store.doses, ...(removed.doses || []).filter((d) => !store.doses.some((x) => x.id === d.id))];
  return writeMeds(store, storage);
}

export function setMedReminder(id, remind, storage = globalThis.localStorage) {
  const store = readMeds(storage);
  const med = store.meds.find((m) => m.id === id);
  if (!med) return { ok: false };
  const next = { ...med, remind: Boolean(remind) && med.kind === 'scheduled' && med.active, updatedAt: nowIso() };
  store.meds = store.meds.map((m) => (m.id === id ? next : m));
  const w = writeMeds(store, storage);
  return { ok: w.ok, med: next };
}

const weekday = (day) => new Date(`${day}T12:00:00`).getDay();

/** Is this medication scheduled on `day`? */
export function scheduledOn(med, day) {
  if (!med?.active || med.kind !== 'scheduled') return false;
  if (med.start && day < med.start) return false;
  if (med.end && day > med.end) return false;
  if (med.freq === 'daily') return true;
  return (med.days || []).includes(weekday(day));
}

/** The doses due on `day`, with what she recorded. Snoozes don't count as taken. */
export function dosesFor(day, store = readMeds()) {
  const out = [];
  for (const med of store.meds) {
    if (!scheduledOn(med, day)) continue;
    for (const time of med.times) {
      const rec = latestDose(store, med.id, day, time);
      out.push({ med, time, record: rec, status: rec?.status || 'due' });
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

export function latestDose(store, medId, day, time) {
  return store.doses.filter((d) => d.medId === medId && d.day === day && (d.time || null) === (time || null)).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
}

/** Record Taken / Skipped / Snoozed for one dose. Only her tap records a dose. */
export function recordDose({ medId, day, time = null, status, snoozeMinutes = 15, now = new Date() }, storage = globalThis.localStorage) {
  if (!['taken', 'skipped', 'snoozed'].includes(status)) return { ok: false };
  if (!DAY.test(String(day || ''))) return { ok: false };
  const store = readMeds(storage);
  if (!store.meds.some((m) => m.id === medId)) return { ok: false };
  const prev = latestDose(store, medId, day, time);
  // The same tap twice in a row is one record, not two.
  if (prev && prev.status === status && status !== 'snoozed') return { ok: true, dose: prev, duplicate: true };
  const dose = { id: rid(), medId, day, time, status, at: now.toISOString(), snoozeUntil: status === 'snoozed' ? new Date(now.getTime() + snoozeMinutes * 60000).toISOString() : null };
  store.doses = [...store.doses, dose].slice(-5000);
  const w = writeMeds(store, storage);
  return { ok: w.ok, dose };
}

/** Undo the last record for a dose (a mistaken tap). */
export function undoDose(doseId, storage = globalThis.localStorage) {
  const store = readMeds(storage);
  const before = store.doses.length;
  store.doses = store.doses.filter((d) => d.id !== doseId);
  if (store.doses.length === before) return { ok: false };
  // Remembered so another device's copy of this dose doesn't bring it back (planSync.js).
  store.removed = [...(store.removed || []), doseId].slice(-2000);
  return { ok: writeMeds(store, storage).ok };
}

/** History for one medication, newest first, with the times she said she took/skipped it. */
export function historyFor(medId, store = readMeds(), limit = 60) {
  const seen = new Set();
  return store.doses.filter((d) => d.medId === medId).sort((a, b) => b.at.localeCompare(a.at)).filter((d) => {
    const k = `${d.day}|${d.time}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, limit);
}

/** Missed = a past dose time today or earlier with nothing recorded. Never auto-marked. */
export function doseState(entry, now = new Date(), today = localDay(now)) {
  if (entry.status === 'taken' || entry.status === 'skipped') return entry.status;
  if (entry.status === 'snoozed' && entry.record?.snoozeUntil && new Date(entry.record.snoozeUntil) > now) return 'snoozed';
  const [h, m] = entry.time.split(':').map(Number);
  const due = new Date(`${today}T00:00:00`);
  due.setHours(h, m, 0, 0);
  return now.getTime() - due.getTime() > 60 * 60000 ? 'missed' : now >= due ? 'due' : 'upcoming';
}

export function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function doseLabel(med) {
  return [med.dose, med.dose ? med.unit : ''].filter(Boolean).join(' ');
}

export function scheduleLabel(med) {
  if (med.kind === 'as_needed') return 'As needed';
  const times = med.times.map(fmtTime).join(', ');
  const when = med.freq === 'daily' ? 'Every day' : med.freq === 'weekly' ? `Every ${WEEKDAYS[med.days[0]]}` : med.days.map((d) => WEEKDAYS[d]).join(', ');
  return `${when} · ${times}`;
}

export function fmtTime(t) {
  const [h, m] = String(t).split(':').map(Number);
  if (!Number.isFinite(h)) return t;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}
