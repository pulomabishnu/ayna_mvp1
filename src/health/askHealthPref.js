/**
 * "Let Ask ayna use my cycle and sleep data": her opt-in for sending her
 * dashboard health context (cycle day, next period estimate, sleep, heart,
 * activity, "This week, explained") to Ask ayna, which runs on a language
 * model. OFF by default. When off, the question still goes, without the data
 * (src/mobile/utils/dashboardAsk.js dashboardContext). Oura and WHOOP data is
 * never sent either way (their API terms; src/health/policy.js).
 *
 * Works signed out and offline (this device, localStorage) and syncs with
 * her account when signed in (notification_preferences.ask_health_data_enabled,
 * supabase/notification_preferences_ask_health_2026-10-24.sql). One shared
 * store: every screen sees a change at once.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { fetchNotificationPreferences, patchNotificationPreferences } from '../mobile/utils/notificationPreferencesApi.js';

export const ASK_HEALTH_LABEL = 'Let Ask ayna use my cycle and sleep data';
const KEY = 'ayna_ask_health_data_v1';

function readLocal() {
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}
function writeLocal(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
}

let state = { userId: null, on: readLocal(), status: 'idle', error: null };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => state;

let loading = null;
function load(userId) {
  if (!userId) { if (state.userId) set({ userId: null, status: 'idle', error: null }); return; }
  if (state.userId === userId && state.status !== 'idle') return;
  if (loading === userId) return;
  loading = userId;
  set({ userId, status: 'loading', error: null });
  fetchNotificationPreferences()
    .then((p) => {
      if (state.userId !== userId) return;
      // Only an explicit true from her account turns it on; anything else is off.
      const on = p?.askHealthDataEnabled === true;
      writeLocal(on);
      set({ on, status: 'ready' });
    })
    // Not reachable (offline, local preview): keep this device's choice.
    .catch(() => { if (state.userId === userId) set({ status: 'ready' }); })
    .finally(() => { if (loading === userId) loading = null; });
}

/** Turn it on or off: this device right away, her account when signed in. */
export async function setAskHealth(next) {
  const on = Boolean(next);
  writeLocal(on);
  set({ on, error: null });
  if (!state.userId) return true;
  try {
    await patchNotificationPreferences({ ask_health_data_enabled: on });
    return true;
  } catch (e) {
    // Turning it OFF always sticks on this device, even if the account save fails.
    if (on) { writeLocal(false); set({ on: false, error: e?.code || 'save_failed' }); }
    else set({ error: e?.code || 'save_failed' });
    return false;
  }
}

/** Current value, outside React. */
export const getAskHealthPref = () => state;

/** Test hook. */
export function resetAskHealthPref() { state = { userId: null, on: readLocal(), status: 'idle', error: null }; loading = null; emit(); }

/** @param userId the signed-in user (null signed out); leave it out to only read. */
export function useAskHealthPref(userId) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { if (userId !== undefined) load(userId || null); }, [userId]);
  return { on: s.on, status: s.status, error: s.error, set: setAskHealth };
}
