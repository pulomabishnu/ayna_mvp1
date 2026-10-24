/**
 * Today's per-owner memory on this device: what was shown (seen), what she
 * marked "Not relevant" (dismissed), today's symptom answers (triage), quick
 * safety answers given on Today (answers), and reminders she asked for.
 *
 * Same per-owner pattern as the daily log (ownedStore.js): signed out it
 * lives in the device bucket; signing in folds it into her bucket; another
 * person signing in on the same phone never sees it. Local only: nothing
 * here is uploaded or sent to analytics.
 *
 * Shapes: seen and dismissed are decisionEngine's SeenMap / DismissedMap.
 *   triage:  { day, severity, flags: [], worsening, ... } (decisionEngine TRIAGE_FIELDS)
 *   answers: { pregnancy?: 'no'|'yes'|'not_sure', medications?: 'none', conditions?: 'none', allergies?: 'no', breastfeeding?: 'no'|'yes', at: ISO }
 *   reminders: { [day]: { tonight?: true } }
 */
import { bucketOf, loadState, putBucket, saveState, switchOwner } from './ownedStore.js';

export const TODAY_KEY = 'ayna_today_v1';
const PARTS = ['seen', 'dismissed', 'triage', 'answers', 'reminders'];
const KEEP_SEEN = 60;

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function readToday(storage = globalThis.localStorage) {
  const items = bucketOf(loadState(TODAY_KEY, storage)).items;
  return Object.fromEntries(PARTS.map((p) => [p, isObj(items[p]) ? items[p] : (p === 'triage' ? null : {})]));
}

function trimSeen(seen) {
  const ids = Object.keys(seen);
  if (ids.length <= KEEP_SEEN) return seen;
  const keep = ids.sort((a, b) => String(seen[a]?.lastShown || '').localeCompare(String(seen[b]?.lastShown || ''))).slice(-KEEP_SEEN);
  return Object.fromEntries(keep.map((id) => [id, seen[id]]));
}

/** Replace one part ('seen' | 'dismissed' | 'triage' | 'answers' | 'reminders'). */
export function writeToday(part, value, storage = globalThis.localStorage) {
  if (!PARTS.includes(part)) return readToday(storage);
  const state = loadState(TODAY_KEY, storage);
  const b = bucketOf(state);
  const v = part === 'seen' && isObj(value) ? trimSeen(value) : value;
  saveState(TODAY_KEY, putBucket(state, { items: { ...b.items, [part]: v }, dirty: [] }), storage);
  return readToday(storage);
}

/** Whoever is signed in (null = signed out). */
export function setTodayOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(TODAY_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => {
    const out = { ...mine };
    for (const p of PARTS) {
      if (p === 'triage') { out.triage = mine.triage || device.triage || null; continue; }
      out[p] = { ...(isObj(device[p]) ? device[p] : {}), ...(isObj(mine[p]) ? mine[p] : {}) };
    }
    return out;
  });
  if (next !== state) saveState(TODAY_KEY, { ...next, buckets: Object.fromEntries(Object.entries(next.buckets).map(([k, b]) => [k, { ...b, dirty: [] }])) }, storage);
  return next.owner;
}
