/**
 * "Use my health data in my matches": her own switch for whether connected
 * health data can re-order her matches. On by default and shared across web/app.
 * Analytics records only the boolean preference and save success/failure,
 * never the underlying health data.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { fetchNotificationPreferences, patchNotificationPreferences } from '../mobile/utils/notificationPreferencesApi.js';
import { EVENTS, eventSurface, trackEvent } from '../utils/analyticsEvents.js';

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
  const enabled = Boolean(next);
  set({ on: enabled, error: null });
  try {
    await patchNotificationPreferences({ health_data_in_matches_enabled: enabled });
    trackEvent(EVENTS.HEALTH_MATCH_SETTING_CHANGED, { surface: eventSurface(), enabled, success: true });
    return true;
  } catch (e) {
    const failure = e?.code || 'save_failed';
    set({ on: before, error: failure });
    trackEvent(EVENTS.HEALTH_MATCH_SETTING_SAVE_FAILED, {
      surface: eventSurface(),
      enabled,
      success: false,
      failure_code: String(failure).replace(/[^a-z0-9_.:-]+/gi, '-').slice(0, 64),
    });
    return false;
  }
}

/** Current value, outside React. */
export const getHealthMatchPref = () => state;

/** Test hook. */
export function resetHealthMatchPref() { state = { userId: null, on: true, status: 'idle', error: null }; loading = null; emit(); }

/** @param userId the signed-in user (null when signed out); omit to only read shared value. */
export function useHealthMatchPref(userId) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { if (userId !== undefined) load(userId || null); }, [userId]);
  return { on: s.on, status: s.status, error: s.error, set: setHealthInMatches };
}
