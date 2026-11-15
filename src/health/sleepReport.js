/**
 * Sleep without a wearable (Eliz / Flo; founder brief Nov 15). One daily sleep report from what
 * she actually has, in this order:
 *   1. sleep a watch or ring measured (via Apple Health, Oura...)            -> "measured"
 *   2. time in bed her iPhone recorded (Sleep Focus / bedtime), no watch      -> "in_bed", always called an estimate
 *   3. the bedtime and wake time she typed for that night                     -> "entered"
 * plus how she rated the night in her log (Rough / Okay / Good).
 *
 * Honest by design: it never invents minutes from a rating, says "not enough nights yet" until it
 * has 7 nights of the same kind, and says plainly when there is nothing for last night.
 * Manual entries stay on this phone (ayna_sleep_entries_v1). Never sent to analytics.
 */
import { addDays, daysBetweenDays } from './dailyLog.js';

export const SLEEP_KEY = 'ayna_sleep_entries_v1';
export const SLEEP_EVENT = 'ayna:sleep-changed';
// Same rule as the rundown's sleep card (rundownData.js DATA_RULES), so the two never disagree.
export const MIN_NIGHTS = 7;
export const WINDOW_DAYS = 21;
export const CHANGE_MIN = 45;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SLEEP_SOURCES = {
  habits: { label: 'NHLBI: Healthy sleep habits', url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits' },
  howMuch: { label: 'CDC: About sleep', url: 'https://www.cdc.gov/sleep/about/index.html' },
};

export function readSleepEntries(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(SLEEP_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
}

/** Minutes from bedtime to wake time (over midnight counts). null if the times are not real. */
export function minutesBetween(bed, wake) {
  if (!TIME.test(String(bed)) || !TIME.test(String(wake))) return null;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let m = (wh * 60 + wm) - (bh * 60 + bm);
  if (m <= 0) m += 1440;
  return m;
}

/** Save last night as she remembers it. `day` is the day she woke up. Returns { ok, minutes } or { error }. */
export function saveSleepEntry(day, { bed, wake }, { storage = globalThis.localStorage, now = new Date() } = {}) {
  const minutes = minutesBetween(bed, wake);
  if (minutes == null) return { error: 'Pick a bedtime and a wake-up time.' };
  if (minutes < 60 || minutes > 16 * 60) return { error: 'That is under 1 hour or over 16 hours. Check the times.' };
  const all = readSleepEntries(storage);
  all[day] = { bed, wake, minutes, at: now.toISOString() };
  // Keep about 3 months.
  const keep = Object.keys(all).sort().slice(-100);
  const next = Object.fromEntries(keep.map((k) => [k, all[k]]));
  try { storage?.setItem(SLEEP_KEY, JSON.stringify(next)); } catch { return { error: "Couldn't save on this device. Try again." } }
  try { globalThis.dispatchEvent?.(new CustomEvent(SLEEP_EVENT)); } catch { /* not a browser */ }
  return { ok: true, minutes };
}

export function removeSleepEntry(day, storage = globalThis.localStorage) {
  const all = readSleepEntries(storage);
  if (!all[day]) return false;
  delete all[day];
  try { storage?.setItem(SLEEP_KEY, JSON.stringify(all)); } catch { return false; }
  try { globalThis.dispatchEvent?.(new CustomEvent(SLEEP_EVENT)); } catch { /* not a browser */ }
  return true;
}

/** Her typed nights as health rows, only for nights nothing else recorded (so the rundown sees them too). */
export function enteredSleepRows(healthRows = [], entries = readSleepEntries()) {
  const have = new Set((healthRows || []).filter((r) => r?.metric === 'sleep_minutes').map((r) => r.day));
  return Object.entries(entries).filter(([day, e]) => !have.has(day) && e?.minutes > 0)
    .map(([day, e]) => ({ metric: 'sleep_minutes', day, value: e.minutes, origin: 'entered', method: 'user_entered' }));
}

/** Every night she has, by day: { minutes, kind, origin }. A measured night wins over time in bed. */
export function nightsFrom(healthRows = [], entries = {}) {
  const inBed = new Set((healthRows || []).filter((r) => r?.metric === 'sleep_in_bed_minutes').map((r) => `${r.day}|${r.origin || ''}`));
  const nights = new Map();
  for (const r of healthRows || []) {
    if (r?.metric !== 'sleep_minutes' || !(Number(r.value) > 0)) continue;
    const kind = r.method === 'user_entered' && r.origin === 'entered' ? 'entered' : inBed.has(`${r.day}|${r.origin || ''}`) ? 'in_bed' : 'measured';
    const prev = nights.get(r.day);
    const rank = { measured: 3, in_bed: 2, entered: 1 };
    if (!prev || rank[kind] > rank[prev.kind] || (rank[kind] === rank[prev.kind] && Number(r.value) > prev.minutes)) nights.set(r.day, { minutes: Number(r.value), kind, origin: r.origin || null });
  }
  for (const [day, e] of Object.entries(entries || {})) {
    if (!nights.has(day) && e?.minutes > 0) nights.set(day, { minutes: e.minutes, kind: 'entered', origin: 'entered', bed: e.bed, wake: e.wake });
  }
  return nights;
}

const RATING = { 1: 'Rough', 2: 'Okay', 3: 'Good' };
const KIND_LINE = {
  measured: 'Measured by your watch or ring',
  in_bed: 'Time in bed from your iPhone. An estimate: it counts time in bed, not sleep.',
  entered: 'From the times you entered',
};
export const fmtMin = (m) => { const h = Math.floor(m / 60); const r = Math.round(m % 60); return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`; };

/**
 * The report for the night that ended on `today` (or, if not there yet, the night before).
 * state: 'none' | 'rating_only' | 'learning' | 'ready'
 */
export function sleepReport({ healthRows = [], entries = readSleepEntries(), log = {}, today }) {
  const nights = nightsFrom(healthRows, entries);
  const day = nights.has(today) ? today : nights.has(addDays(today, -1)) ? addDays(today, -1) : null;
  const ratingDay = log?.[today]?.sleep != null ? today : log?.[addDays(today, -1)]?.sleep != null ? addDays(today, -1) : null;
  const rating = ratingDay ? RATING[log[ratingDay].sleep] || null : null;
  const goalTip = { text: 'Go to bed and get up at the same times every day, weekends too.', source: SLEEP_SOURCES.habits };
  if (!day) {
    return {
      state: rating ? 'rating_only' : 'none', rating,
      title: rating ? `You rated last night ${rating.toLowerCase()}.` : 'No sleep for last night yet.',
      body: rating ? 'Add your bedtime and wake-up time and ayna can show how long you slept and compare it with your usual.' : 'No watch needed. Enter when you went to bed and woke up, or turn on Sleep in Apple Health on your iPhone.',
      tip: goalTip,
    };
  }
  const n = nights.get(day);
  const prior = [...nights.entries()].filter(([d, v]) => d < day && daysBetweenDays(d, day) <= WINDOW_DAYS && (n.kind === 'measured' ? v.kind === 'measured' : v.kind !== 'measured'));
  const base = { day, minutes: n.minutes, kind: n.kind, sourceLine: KIND_LINE[n.kind], rating, bed: n.bed || entries?.[day]?.bed || null, wake: n.wake || entries?.[day]?.wake || null, nights: prior.length };
  const estimate = n.kind === 'measured' ? '' : 'about ';
  if (prior.length < MIN_NIGHTS) {
    return {
      ...base, state: 'learning',
      title: `You slept ${estimate}${fmtMin(n.minutes)}${n.kind === 'in_bed' ? ' (time in bed)' : ''}.`,
      body: `Not enough nights yet to know your usual: ayna needs ${MIN_NIGHTS - prior.length} more ${MIN_NIGHTS - prior.length === 1 ? 'night' : 'nights'}.`,
      tip: goalTip,
    };
  }
  const usual = Math.round(prior.reduce((t, [, v]) => t + v.minutes, 0) / prior.length);
  const diff = n.minutes - usual;
  const status = diff <= -CHANGE_MIN ? 'shorter' : diff >= CHANGE_MIN ? 'longer' : 'usual';
  const title = status === 'usual' ? `You slept ${estimate}${fmtMin(n.minutes)}, close to your usual.`
    : `You slept ${estimate}${fmtMin(n.minutes)}, about ${fmtMin(Math.abs(diff))} ${status === 'shorter' ? 'less' : 'more'} than usual.`;
  const tip = status === 'shorter'
    ? { text: 'Keep tomorrow’s wake-up time the same, and keep any nap to 20 minutes, early in the afternoon.', source: SLEEP_SOURCES.habits }
    : goalTip;
  return { ...base, state: 'ready', usual, diff, status, title, body: `Your usual: ${fmtMin(usual)} (average of your last ${prior.length} nights).`, tip };
}
