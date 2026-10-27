/**
 * Daily log: a few taps a day (pain, flow, PMS, sleep; mood and skin under
 * "More"). Replaces the sleep/mood/skin check-in in dailyCheckin.js.
 *
 * Contract (other modules code against this, keep it stable):
 *   entry per day: { day: 'YYYY-MM-DD', pain: 0|1|2|3|null, flow: 'none'|'spotting'|'light'|'medium'|'heavy'|null,
 *                    pms: 0|1|2|3|null, sleep: 1|2|3|null, mood: 1|2|3|null, skin: 1|2|3|null, updatedAt: ISO }
 *   Entries may also carry `fieldAt: { [field]: ISO }` (when each field was
 *   last set) so two devices merge per field. Consumers can ignore it.
 *
 *   A field that is null means "not logged", never "none". Pain 0 is
 *   "None": a real answer. (NULL is not NO.)
 *
 * Provenance: every entry is source 'self_report', method 'manual'.
 *
 * Local first: saved to localStorage (per signed-in owner, see ownedStore.js)
 * so it works signed out and offline; useDailyLog.js uploads it when signed in.
 * Nothing here goes to analytics.
 */
import { bucketOf, DEVICE_OWNER, loadState, putBucket, saveState, switchOwner, trimItems } from './ownedStore.js';
import { localDayKey } from '../utils/localDate.js';

export const LOG_KEY = 'ayna_daily_log_v1';
/** The older device-only check-in (dailyCheckin.js). Read once, never changed or removed. */
export const LEGACY_CHECKIN_KEY = 'ayna_daily_checkin_v1';
export const LOG_SOURCE = 'self_report';
export const LOG_METHOD = 'manual';
const KEEP_DAYS = 400;

const SEVERITY = ['None', 'Mild', 'Moderate', 'Severe'];
/**
 * Field descriptors, in display order. `primary` fields show on the card;
 * the rest sit behind "More". `better` says which way is easier for her:
 * 'lower' (pain, PMS), 'higher' (sleep, mood, skin) or null (flow is not
 * better or worse).
 */
export const LOG_FIELDS = [
  { id: 'pain', label: 'Pain', values: [0, 1, 2, 3], options: SEVERITY, primary: true, better: 'lower' },
  { id: 'flow', label: 'Flow', values: ['none', 'spotting', 'light', 'medium', 'heavy'], options: ['None', 'Spotting', 'Light', 'Medium', 'Heavy'], primary: true, better: null },
  { id: 'pms', label: 'PMS', values: [0, 1, 2, 3], options: SEVERITY, primary: true, better: 'lower' },
  { id: 'sleep', label: 'Sleep', values: [1, 2, 3], options: ['Rough', 'Okay', 'Good'], primary: true, better: 'higher' },
  { id: 'mood', label: 'Mood', values: [1, 2, 3], options: ['Low', 'Okay', 'Good'], primary: false, better: 'higher' },
  { id: 'skin', label: 'Skin', values: [1, 2, 3], options: ['Flared', 'Okay', 'Clear'], primary: false, better: 'higher' },
];
export const LOG_FIELD_IDS = LOG_FIELDS.map((f) => f.id);
const FIELD_BY_ID = Object.fromEntries(LOG_FIELDS.map((f) => [f.id, f]));
/** Flow as a number for comparisons (0 none .. 4 heavy). Matches metrics.js FLOW_LEVELS spacing. */
export const FLOW_RANK = { none: 0, spotting: 1, light: 2, medium: 3, heavy: 4 };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (d) => typeof d === 'string' && DAY_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

/** Local calendar day (her day, not UTC). The one helper: utils/localDate.js. */
export function todayKey(date = new Date()) {
  return localDayKey(date);
}

/** Add n days to a 'YYYY-MM-DD' day (calendar math in UTC so DST never shifts it). */
export function addDays(day, n) {
  const t = Date.parse(`${day}T00:00:00Z`) + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetweenDays(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** A valid value for a field, or null when missing or not allowed. */
export function cleanValue(fieldId, value) {
  const f = FIELD_BY_ID[fieldId];
  if (!f || value == null) return null;
  return f.values.includes(value) ? value : null;
}

/** Validates any entry-like object. Returns a full entry or null. */
export function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object' || !isDay(raw.day)) return null;
  const entry = { day: raw.day };
  for (const id of LOG_FIELD_IDS) entry[id] = cleanValue(id, raw[id]);
  entry.updatedAt = isIso(raw.updatedAt) ? new Date(raw.updatedAt).toISOString() : `${raw.day}T12:00:00.000Z`;
  const fieldAt = {};
  if (raw.fieldAt && typeof raw.fieldAt === 'object') {
    for (const id of LOG_FIELD_IDS) if (isIso(raw.fieldAt[id])) fieldAt[id] = new Date(raw.fieldAt[id]).toISOString();
  }
  if (Object.keys(fieldAt).length) entry.fieldAt = fieldAt;
  return entry;
}

const stampOf = (entry, id) => entry?.fieldAt?.[id] || entry?.updatedAt || '';

function toMap(input) {
  if (!input) return {};
  const list = Array.isArray(input) ? input : Object.values(input);
  const out = {};
  for (const raw of list) {
    const e = normalizeEntry(raw);
    if (e) out[e.day] = out[e.day] ? mergeEntry(out[e.day], e) : e;
  }
  return out;
}

function mergeEntry(a, b) {
  if (!a) return b;
  if (!b) return a;
  const out = { day: a.day };
  const fieldAt = {};
  for (const id of LOG_FIELD_IDS) {
    // Newest stamp wins per field; a tie keeps the first (local) value.
    const useB = stampOf(b, id) > stampOf(a, id);
    out[id] = useB ? b[id] : a[id];
    const at = useB ? b.fieldAt?.[id] : a.fieldAt?.[id];
    if (at) fieldAt[id] = at;
  }
  out.updatedAt = a.updatedAt >= b.updatedAt ? a.updatedAt : b.updatedAt;
  if (Object.keys(fieldAt).length) out.fieldAt = fieldAt;
  return out;
}

/**
 * Merge two logs (maps keyed by day, or arrays of entries). Per day and per
 * field, the newer stamp wins (fieldAt[field], else updatedAt). Returns a
 * map { day: entry }. Pure; never drops a day either side has.
 */
export function mergeLogs(local, server) {
  const a = toMap(local);
  const b = toMap(server);
  const out = { ...a };
  for (const [day, e] of Object.entries(b)) out[day] = mergeEntry(a[day], e);
  return out;
}

/* ------------------------------- storage ------------------------------- */

function legacyEntries(storage) {
  let raw = null;
  try { raw = JSON.parse(storage?.getItem(LEGACY_CHECKIN_KEY) || 'null'); } catch { raw = null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [day, v] of Object.entries(raw)) {
    if (!isDay(day) || !v || typeof v !== 'object') continue;
    const e = normalizeEntry({ day, sleep: v.sleep, mood: v.mood, skin: v.skin, updatedAt: `${day}T12:00:00.000Z` });
    if (e && (e.sleep != null || e.mood != null || e.skin != null)) out[day] = e;
  }
  return out;
}

/**
 * Loads the store, bringing in the older check-in once (sleep, mood, skin)
 * into the device bucket. The old key is left exactly as it was.
 */
function load(storage) {
  let state = loadState(LOG_KEY, storage);
  if (!state.meta.legacyMigrated) {
    const legacy = legacyEntries(storage);
    const days = Object.keys(legacy);
    if (days.length) {
      const owner = state.owner;
      const b = bucketOf(state, owner);
      state = putBucket(state, { items: mergeLogs(b.items, legacy), dirty: [...b.dirty, ...days.filter((d) => !b.items[d])] }, owner);
    }
    state = { ...state, meta: { ...state.meta, legacyMigrated: true } };
    saveState(LOG_KEY, state, storage);
  }
  return state;
}

/** Her log on this device for whoever is signed in: { [day]: entry }. */
export function readLog(storage = globalThis.localStorage) {
  const items = bucketOf(load(storage)).items;
  return toMap(items);
}

/**
 * Save part of a day: `patch` is { field: value | null }. Unknown fields and
 * values are ignored; null clears a field (counts as an edit, so it merges).
 * Returns the saved entry, or null if the day is invalid.
 */
export function saveLogEntry(day, patch = {}, { storage = globalThis.localStorage, now = new Date() } = {}) {
  if (!isDay(day) || !patch || typeof patch !== 'object') return null;
  const state = load(storage);
  const b = bucketOf(state);
  const prev = normalizeEntry(b.items[day]) || normalizeEntry({ day });
  const at = new Date(now).toISOString();
  const next = { ...prev, fieldAt: { ...(prev.fieldAt || {}) } };
  let changed = false;
  for (const id of LOG_FIELD_IDS) {
    if (!Object.hasOwn(patch, id)) continue;
    const v = patch[id] == null ? null : cleanValue(id, patch[id]);
    if (patch[id] != null && v == null) continue; // not an allowed value
    next[id] = v;
    next.fieldAt[id] = at;
    changed = true;
  }
  if (!changed) return prev;
  next.updatedAt = at;
  const items = trimItems({ ...b.items, [day]: next }, KEEP_DAYS);
  saveState(LOG_KEY, putBucket(state, { items, dirty: [...b.dirty, day] }), storage);
  return normalizeEntry(next);
}

/** Entries from fromDay to toDay inclusive, oldest first. Days with nothing logged are absent (not "none"). */
export function logRange(fromDay, toDay, log = readLog()) {
  if (!isDay(fromDay) || !isDay(toDay)) return [];
  return Object.values(toMap(log)).filter((e) => e.day >= fromDay && e.day <= toDay).sort((a, b) => a.day.localeCompare(b.day));
}

/** Whoever is signed in (null = signed out). Signing in brings signed-out entries into her account. */
export function setLogOwner(userId, storage = globalThis.localStorage) {
  const state = load(storage);
  const next = switchOwner(state, userId, (mine, device) => mergeLogs(mine, device));
  if (next !== state) saveState(LOG_KEY, next, storage);
  return next.owner;
}

export function logOwner(storage = globalThis.localStorage) {
  return load(storage).owner;
}

/** Entries changed since the last upload (for the active owner). */
export function dirtyLogEntries(storage = globalThis.localStorage) {
  const state = load(storage);
  if (state.owner === DEVICE_OWNER) return [];
  const b = bucketOf(state);
  return [...new Set(b.dirty)].map((d) => normalizeEntry(b.items[d])).filter(Boolean);
}

/**
 * After an upload and/or download: clears uploaded days that haven't changed
 * since, and merges server entries in. Only applies if `owner` is still the
 * active owner (she may have signed out meanwhile).
 */
export function applyLogSync({ owner, uploaded = [], server = [] } = {}, storage = globalThis.localStorage) {
  const state = load(storage);
  if (!owner || state.owner !== owner) return false;
  const b = bucketOf(state);
  const sent = new Map(uploaded.map((e) => [e.day, e.updatedAt]));
  const dirty = b.dirty.filter((d) => !sent.has(d) || normalizeEntry(b.items[d])?.updatedAt !== sent.get(d));
  const items = trimItems(mergeLogs(b.items, server), KEEP_DAYS);
  saveState(LOG_KEY, putBucket(state, { items, dirty }), storage);
  return true;
}

/* ------------------------------- takeaway ------------------------------- */

/** The last 7 days (oldest first) for one field: [{ day, value|null }]. */
export function lastWeek(log, fieldId, today = todayKey()) {
  const map = toMap(log);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, value: map[day] ? map[day][fieldId] ?? null : null };
  });
}

/**
 * One plain-language line for the week. Needs at least 3 logged days for a
 * field; otherwise a neutral line. Never alarming, never a diagnosis, never
 * a cause.
 */
export function weekTakeaway(log, today = todayKey()) {
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  for (const field of LOG_FIELDS) {
    if (!field.better) continue;
    const values = lastWeek(log, field.id, today).map((d) => d.value).filter((v) => v != null);
    if (values.length < 3) continue;
    const half = Math.floor(values.length / 2);
    const diff = avg(values.slice(values.length - half)) - avg(values.slice(0, half));
    const spread = Math.max(...values) - Math.min(...values);
    const easier = field.better === 'higher' ? diff >= 0.5 : diff <= -0.5;
    const harder = field.better === 'higher' ? diff <= -0.5 : diff >= 0.5;
    if (easier) return field.better === 'higher' ? `${field.label} has been better lately.` : `${field.label} has been lower lately.`;
    if (harder) return field.better === 'higher' ? `${field.label} has been rougher lately.` : `${field.label} has been higher lately.`;
    if (spread === 0) return `${field.label} has been steady this week.`;
  }
  const logged = Object.values(toMap(log)).some((e) => LOG_FIELD_IDS.some((id) => e[id] != null));
  return logged ? 'A few more days and your week will show a pattern.' : 'A few taps a day. Your week shows up here.';
}
