/**
 * "Remind me later" on something she saved (team direction 19, 20): in 3
 * days, a week or a month. The reminder is kept on this device with the
 * product it points to, and shows in Saved when it is due. Signed in, a
 * push is also scheduled through /api/today-reminders (kind 'saved'); the
 * push only ever says "Something you saved is waiting", and the server is
 * never told which product (it stays on her device).
 */
import { scheduleTodayReminder } from '../health/todayReminders.js';
import { bucketOf, loadState, putBucket, saveState, switchOwner } from '../health/ownedStore.js';

export const SAVED_REMINDERS_KEY = 'ayna_saved_reminders_v1';
export const REMIND_OPTIONS = [
  { id: '3d', label: 'In 3 days', days: 3 },
  { id: '1w', label: 'In a week', days: 7 },
  { id: '1m', label: 'In a month', days: 30 },
];
const HOUR = 10; // 10am her time
const MAX = 50;

/** Local `HOUR`:00, `days` from now, as an ISO instant. */
export function remindAt(days, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, HOUR, 0, 0, 0);
  return d.toISOString();
}

export function readSavedReminders(storage = globalThis.localStorage) {
  return Object.values(bucketOf(loadState(SAVED_REMINDERS_KEY, storage)).items || {})
    .filter((r) => r?.id && typeof r.at === 'string')
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function reminderFor(productId, storage = globalThis.localStorage) {
  return readSavedReminders(storage).find((r) => r.id === productId) || null;
}

/** Reminders whose time has come (oldest first). */
export function dueSavedReminders(now = new Date(), storage = globalThis.localStorage) {
  const t = new Date(now).toISOString();
  return readSavedReminders(storage).filter((r) => r.at <= t);
}

function write(items, storage) {
  const state = loadState(SAVED_REMINDERS_KEY, storage);
  const ids = Object.keys(items).sort((a, b) => String(items[a].at).localeCompare(String(items[b].at))).slice(-MAX);
  saveState(SAVED_REMINDERS_KEY, putBucket(state, { items: Object.fromEntries(ids.map((id) => [id, items[id]])), dirty: [] }), storage);
}

/**
 * Set (or move) the reminder for one saved product.
 * @returns {Promise<{ at: string, push: 'scheduled'|'signed_out'|'offline'|'error' }>}
 */
export async function setSavedReminder(product, days, { storage = globalThis.localStorage, now = new Date(), schedule = scheduleTodayReminder } = {}) {
  if (!product?.id) return { at: null, push: 'error' };
  const at = remindAt(days, now);
  const items = { ...bucketOf(loadState(SAVED_REMINDERS_KEY, storage)).items, [product.id]: { id: product.id, name: String(product.name || '').slice(0, 120), at, setAt: new Date(now).toISOString() } };
  write(items, storage);
  let push = 'signed_out';
  try { push = await schedule({ kind: 'saved', sendAt: at }); } catch { push = 'error'; }
  return { at, push };
}

export function clearSavedReminder(productId, storage = globalThis.localStorage) {
  const items = { ...bucketOf(loadState(SAVED_REMINDERS_KEY, storage)).items };
  if (!items[productId]) return;
  delete items[productId];
  write(items, storage);
}

export function setSavedRemindersOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(SAVED_REMINDERS_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => ({ ...mine, ...device }));
  if (next !== state) saveState(SAVED_REMINDERS_KEY, next, storage);
}

export const fmtRemindDay = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
