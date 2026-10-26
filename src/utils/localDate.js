/**
 * Local calendar days (P0 UTC date bug, dashboard build brief). A "day" in
 * ayna (daily log, cycle day, the Rundown, reminders, today's keys) is the
 * day on HER clock, never UTC. `new Date().toISOString().slice(0, 10)` is
 * the UTC date and flips at 8pm in New York or 9am in Tokyo, which showed as
 * cycle day 23 vs 24 on app Home.
 *
 * Keys stay YYYY-MM-DD, the same shape as before, so saved data still reads.
 */

const pad = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD for `date` (Date, ms or parseable string) on the local clock. Empty string for an invalid date. */
export function localDayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local day key. */
export function localToday(now = new Date()) {
  return localDayKey(now);
}

/** Local midnight of a YYYY-MM-DD key (not UTC midnight, which `new Date('2026-10-26')` gives). */
export function parseLocalDay(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(key || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The local day key `n` days after `key` (negative for before). DST-safe (works on calendar dates, not 24h steps). */
export function addLocalDays(key, n) {
  const d = parseLocalDay(key);
  if (!d) return '';
  d.setDate(d.getDate() + n);
  return localDayKey(d);
}

/** Whole calendar days from `a` to `b` (keys or dates), on the local calendar. */
export function localDaysBetween(a, b) {
  const da = parseLocalDay(typeof a === 'string' ? a : localDayKey(a));
  const db = parseLocalDay(typeof b === 'string' ? b : localDayKey(b));
  if (!da || !db) return NaN;
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
}

/**
 * The UTC day key the OLD code wrote for the same moment. Data saved before
 * this fix is keyed by it; readers look up the local key first, then this.
 */
export function legacyUtcDayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Read a day-keyed record (an object keyed by YYYY-MM-DD) for `date`: the
 * local key, else the UTC key older builds used for that same moment. Never
 * loses an entry saved before the fix.
 */
export function readDayRecord(map, date = new Date()) {
  if (!map || typeof map !== 'object') return undefined;
  const local = localDayKey(date);
  if (map[local] !== undefined) return map[local];
  const legacy = legacyUtcDayKey(date);
  return legacy !== local ? map[legacy] : undefined;
}
