/**
 * "Use my health data in my matches": her own switch for whether connected
 * health data (Apple Health, Health Connect, WHOOP, imports) can re-order her
 * matches. On by default, the same as "Personalize with my data", and shown
 * wherever matches show it (src/components/health/HealthShapedNote.jsx), so
 * it is never on without her being able to see it and turn it off.
 *
 * Saved with her account (notification_preferences.health_data_in_matches_enabled,
 * supabase/notification_preferences.sql), so the website and the app agree.
 * One shared store: every screen that reads it sees a change at once.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { fetchNotificationPreferences, patchNotificationPreferences } from '../mobile/utils/notificationPreferencesApi.js';

let state = { userId: null, on: true, status: 'idle', error: null };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => state;

let loading = null;
function load(userId) {
  if (!userId) { if (state.userId) set({ userId: null, on: true, status: 'idle', error: null }); return; }
  if (state.userId === userId && state.status !== 'idle') return;
  if (loading === userId) return;
  loading = userId;
  set({ userId, status: 'loading', error: null });
  fetchNotificationPreferences()
    .then((p) => { if (state.userId === userId) set({ on: p?.healthDataInMatchesEnabled !== false, status: 'ready' }); })
    // Not reachable (signed out, offline, local preview): keep the default and say nothing.
    .catch(() => { if (state.userId === userId) set({ status: 'ready' }); })
    .finally(() => { if (loading === userId) loading = null; });
}

/** Turn it on or off. Updates every screen right away, rolls back if the save fails. */
export async function setHealthInMatches(next) {
  const before = state.on;
  set({ on: Boolean(next), error: null });
  try {
    await patchNotificationPreferences({ health_data_in_matches_enabled: Boolean(next) });
    return true;
  } catch (e) {
    set({ on: before, error: e?.code || 'save_failed' });
    return false;
  }
}

/** Current value, outside React. */
export const getHealthMatchPref = () => state;

/** Test hook. */
export function resetHealthMatchPref() { state = { userId: null, on: true, status: 'idle', error: null }; loading = null; emit(); }

/** @param userId  the signed-in user (null when signed out); leave it out to only read the shared value. */
export function useHealthMatchPref(userId) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { if (userId !== undefined) load(userId || null); }, [userId]);
  return { on: s.on, status: s.status, error: s.error, set: setHealthInMatches };
}
