/**
 * Tips memory on this device, per owner (src/health/ownedStore.js pattern):
 *   enabled     null = never asked, true = "Show me tips", false = off
 *   seen        { [screenId]: ISO time } screens whose tips already ran
 *   welcomeDay  'YYYY-MM-DD' the welcome card was last offered (once a day max)
 *   offNoteShown true once a tip has said where to turn tips off
 * Local only: no health details, never uploaded, never sent to analytics.
 * Signing in folds the device's answers into hers; another person on the
 * same phone starts fresh. Sign-out keeps it (an on-device pref, like the
 * Rundown memory), so the key belongs on the sign-out KEEP list.
 */
import { bucketOf, loadState, putBucket, saveState, switchOwner } from '../../health/ownedStore.js';

export const TOUR_KEY = 'ayna_tour_v1';
export const TOUR_EVENT = 'ayna:tour';
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function clean(p) {
  const v = isObj(p) ? p : {};
  return {
    enabled: v.enabled === true || v.enabled === false ? v.enabled : null,
    seen: isObj(v.seen) ? v.seen : {},
    welcomeDay: typeof v.welcomeDay === 'string' ? v.welcomeDay : null,
    offNoteShown: v.offNoteShown === true,
  };
}

export function readTour(storage = globalThis.localStorage) {
  return clean(bucketOf(loadState(TOUR_KEY, storage)).items.prefs);
}

function write(patch, storage) {
  const state = loadState(TOUR_KEY, storage);
  const prefs = clean({ ...readTour(storage), ...patch });
  saveState(TOUR_KEY, putBucket(state, { items: { prefs }, dirty: [] }), storage);
  try { globalThis.dispatchEvent?.(new CustomEvent(TOUR_EVENT, { detail: prefs })); } catch { /* no window */ }
  return prefs;
}

/** Fold device answers into hers: her own choice wins, seen screens are joined. */
export function mergeTourPrefs(mine, device) {
  const a = clean(mine);
  const b = clean(device);
  return {
    enabled: a.enabled ?? b.enabled,
    seen: { ...b.seen, ...a.seen },
    welcomeDay: [a.welcomeDay, b.welcomeDay].filter(Boolean).sort().pop() || null,
    offNoteShown: a.offNoteShown || b.offNoteShown,
  };
}

export function setTourOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(TOUR_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => ({ prefs: mergeTourPrefs(mine.prefs, device.prefs) }));
  if (next !== state) saveState(TOUR_KEY, next, storage);
  return readTour(storage);
}

export const setTipsEnabled = (on, storage = globalThis.localStorage) => write({ enabled: Boolean(on) }, storage);
export const markWelcomeOffered = (day, storage = globalThis.localStorage) => write({ welcomeDay: day }, storage);
export const markOffNoteShown = (storage = globalThis.localStorage) => write({ offNoteShown: true }, storage);

export function markScreenSeen(id, now = new Date(), storage = globalThis.localStorage) {
  const p = readTour(storage);
  return write({ seen: { ...p.seen, [id]: now.toISOString() } }, storage);
}

/** Settings > Replay the tour: tips on again, every screen shows its tips once more. */
export const replayTour = (storage = globalThis.localStorage) => write({ enabled: true, seen: {}, offNoteShown: false }, storage);
