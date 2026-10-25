/**
 * The rundown's memory on this device, per owner (same pattern as the daily
 * log, src/health/ownedStore.js): which cards she saw (rotation), and what
 * she marked "Not useful" and why. Local only; nothing is uploaded or sent
 * to analytics. Safety and care cards ignore all of it.
 *
 * Not useful reasons (UX spec 9) and what they do. These periods are ranking
 * heuristics, not clinical rules:
 *   already_knew   hide this card 14 days
 *   not_relevant   hide this card 30 days
 *   dont_show_type hide this kind of card 90 days
 *   info_changed   hide this card 7 days (and the caller opens her answers)
 */
import { addDays } from '../../health/dailyLog.js';
import { bucketOf, loadState, putBucket, saveState, switchOwner } from '../../health/ownedStore.js';

export const RUNDOWN_KEY = 'ayna_rundown_v1';
export const NOT_USEFUL_REASONS = [
  { id: 'already_knew', label: 'I already knew this', days: 14, scope: 'key' },
  { id: 'not_relevant', label: 'Not relevant to me', days: 30, scope: 'key' },
  { id: 'dont_show_type', label: "Don't show this type", days: 90, scope: 'category' },
  { id: 'info_changed', label: 'My information changed', days: 7, scope: 'key' },
];
const KEEP_DAYS = 21;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function readRundownMemory(storage = globalThis.localStorage) {
  const m = bucketOf(loadState(RUNDOWN_KEY, storage)).items.memory;
  const v = isObj(m) ? m : {};
  return { shown: isObj(v.shown) ? v.shown : {}, shownCategories: isObj(v.shownCategories) ? v.shownCategories : {}, signatures: isObj(v.signatures) ? v.signatures : {}, notUseful: isObj(v.notUseful) ? v.notUseful : {}, weeklySeen: v.weeklySeen || null, viewedDay: v.viewedDay || null, autoDay: v.autoDay || null, periodAnswers: isObj(v.periodAnswers) ? v.periodAnswers : {} };
}

function write(memory, storage) {
  const state = loadState(RUNDOWN_KEY, storage);
  saveState(RUNDOWN_KEY, putBucket(state, { items: { memory }, dirty: [] }), storage);
  return memory;
}

export function setRundownOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(RUNDOWN_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => ({ memory: { ...(device.memory || {}), ...(mine.memory || {}) } }));
  if (next !== state) saveState(RUNDOWN_KEY, next, storage);
}

/** Remember a card she saw today (rotation and repeat limits). */
export function markCardSeen(card, today, storage = globalThis.localStorage) {
  if (!card?.key || card.category === 'frame') return readRundownMemory(storage);
  const m = readRundownMemory(storage);
  const cutoff = addDays(today, -KEEP_DAYS);
  const days = [...new Set([...(m.shown[card.key] || []), today])].filter((d) => d >= cutoff).slice(-10);
  const shown = Object.fromEntries(Object.entries({ ...m.shown, [card.key]: days }).filter(([, d]) => d.length));
  const cats = [...new Set([...(m.shownCategories[today] || []), card.category])];
  const shownCategories = Object.fromEntries(Object.entries({ ...m.shownCategories, [today]: cats }).filter(([d]) => d >= cutoff));
  const signatures = card.signature ? { ...m.signatures, [card.key]: card.signature } : m.signatures;
  return write({ ...m, shown, shownCategories, signatures }, storage);
}

export function markNotUseful(card, reasonId, today, storage = globalThis.localStorage) {
  const reason = NOT_USEFUL_REASONS.find((r) => r.id === reasonId) || NOT_USEFUL_REASONS[1];
  const m = readRundownMemory(storage);
  const k = reason.scope === 'category' ? `category:${card.category}` : `key:${card.key}`;
  return write({ ...m, notUseful: { ...m.notUseful, [k]: { reason: reason.id, day: today, until: addDays(today, reason.days) } } }, storage);
}

export function markWeeklySeen(today, storage = globalThis.localStorage) {
  return write({ ...readRundownMemory(storage), weeklySeen: today }, storage);
}

/** She opened (or skipped) today's rundown: it never opens on its own again today. */
export function markRundownViewed(today, { auto = false } = {}, storage = globalThis.localStorage) {
  const m = readRundownMemory(storage);
  return write({ ...m, viewedDay: today, ...(auto ? { autoDay: today } : {}) }, storage);
}

export const PERIOD_ANSWERS = ['yes', 'ended', 'unsure'];
/**
 * Her answer to "Are you still on your period?" for one day (device only).
 * The flow itself goes into the daily log (No -> flow "none", Yes -> the
 * level she picks); this keeps "Yes" before a level and "Not sure", which
 * the log has no field for, so the rundown does not ask again today.
 */
export function markPeriodAnswer(today, answer, storage = globalThis.localStorage) {
  const m = readRundownMemory(storage);
  if (!PERIOD_ANSWERS.includes(answer)) return m;
  const cutoff = addDays(today, -KEEP_DAYS);
  const periodAnswers = Object.fromEntries(Object.entries({ ...m.periodAnswers, [today]: answer }).filter(([d]) => d >= cutoff));
  return write({ ...m, periodAnswers }, storage);
}

/**
 * Closing the story: only finishing it (every card seen) goes on to the chat
 * with its follow-ups; X mid-story stays on Home (QA, Oct 25).
 */
export const finishedRundown = (s) => Boolean(s && s.count > 0 && s.seen >= s.count);
