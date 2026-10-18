/**
 * One shared, in-memory store for the person's connected health data, read by
 * the Health data screens, Health Insights and Health Match.
 *
 * Kept in memory only: health values are never written to localStorage or
 * any other browser storage, never sent to analytics, never logged.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { fetchHealthData, syncDeviceRows, syncOAuthSource } from '../../health/healthApi.js';
import { buildInsights } from '../../health/insights.js';
import { healthMatchContext } from '../../health/matchContext.js';
import { usableForInsights, usableForMatching } from '../../health/policy.js';
import { healthStoreAvailability, nativeSourceForPlatform, readDailyHealth } from '../../health/native.js';

const AUTO_SYNC_MS = 6 * 3600000;

/* One-line results shown on the Health data screen ("Oura connected"). */
let flash = null;
export const setHealthFlash = (msg) => { flash = msg; };
export const takeHealthFlash = () => { const m = flash; flash = null; return m; };

const RETURN_TEXT = {
  connected: (n) => `${n} connected. Your data is syncing.`,
  declined: (n) => `${n} wasn't connected. Nothing was shared.`,
  expired: () => 'That took too long. Try connecting again.',
  invalid_state: () => "That connection link wasn't valid. Try again from Health data.",
  failed: (n) => `${n} couldn't be connected. Try again.`,
};
const NAMES = { oura: 'Oura' };

/** Coming back from a provider's sign-in page: web query params or the app's URL scheme. */
export function handleHealthReturn(urlString) {
  let url;
  try { url = new URL(urlString); } catch { return false; }
  const isApp = url.protocol === 'co.aynahealth.app:' && /health-connected/.test(url.href);
  const source = isApp ? url.searchParams.get('source') : url.searchParams.get('health_source');
  const status = isApp ? url.searchParams.get('status') : url.searchParams.get('health_status');
  if (!source || !status) return false;
  const text = RETURN_TEXT[status] || RETURN_TEXT.failed;
  setHealthFlash(text(NAMES[source] || 'Your app'));
  return true;
}

let returnHandlersReady = false;
async function initReturnHandlers() {
  if (returnHandlersReady || typeof window === 'undefined') return;
  returnHandlersReady = true;
  if (handleHealthReturn(window.location.href)) {
    const clean = new URL(window.location.href);
    ['health_source', 'health_status'].forEach((k) => clean.searchParams.delete(k));
    window.history.replaceState(window.history.state, '', `${clean.pathname}${clean.search}${clean.hash}`);
  }
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { App } = await import('@capacitor/app');
    App.addListener('appUrlOpen', async ({ url }) => {
      if (!handleHealthReturn(url)) return;
      try { const { Browser } = await import('@capacitor/browser'); await Browser.close(); } catch { /* already closed */ }
      if (state.userId) loadHealthData(state.userId);
    });
  } catch { /* not native */ }
}
let state = { status: 'idle', connections: [], rows: [], error: null, userId: null, loadedAt: 0 };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };
const lastAutoSync = {};

export function resetHealthStore() {
  state = { status: 'idle', connections: [], rows: [], error: null, userId: null, loadedAt: 0 };
  emit();
}

export async function loadHealthData(userId) {
  if (!userId) { resetHealthStore(); return; }
  set({ status: state.userId === userId && state.loadedAt ? 'refreshing' : 'loading', userId, error: null });
  try {
    const out = await fetchHealthData();
    set({ status: 'ready', connections: out.connections || [], rows: out.rows || [], loadedAt: Date.now() });
  } catch (e) {
    set({ status: 'error', error: e?.code || 'load_failed' });
  }
}

const active = (c) => c && c.status !== 'disconnected' && c.sync_enabled;

/** Pull fresh daily rows from the phone (Apple Health / Health Connect) and send them up. */
export async function syncPhoneSource({ force = false } = {}) {
  const source = nativeSourceForPlatform();
  const connection = state.connections.find((c) => c.source === source);
  if (!source || !active(connection)) return { skipped: 'not_connected' };
  if (!force && lastAutoSync[source] && Date.now() - lastAutoSync[source] < AUTO_SYNC_MS) return { skipped: 'recent' };
  const availability = await healthStoreAvailability();
  if (!availability.available) return { skipped: availability.reason || 'unavailable' };
  lastAutoSync[source] = Date.now();
  const rows = await readDailyHealth(connection.categories, { days: connection.last_synced_at ? 14 : 90 });
  const result = rows.length ? await syncDeviceRows(source, rows) : { saved: 0 };
  await loadHealthData(state.userId);
  return { saved: result.saved || 0, empty: rows.length === 0 };
}

export async function syncCloudSource(provider, { force = false } = {}) {
  const connection = state.connections.find((c) => c.source === provider);
  if (!active(connection)) return { skipped: 'not_connected' };
  if (!force && lastAutoSync[provider] && Date.now() - lastAutoSync[provider] < AUTO_SYNC_MS) return { skipped: 'recent' };
  lastAutoSync[provider] = Date.now();
  const result = await syncOAuthSource(provider);
  await loadHealthData(state.userId);
  return result;
}

function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
const snapshot = () => state;

/**
 * @param {string|null} userId  signed-in user, or null
 * @param {Array<string>} selectedNeedIds needs she chose (for Health Match)
 */
export function useHealthData(userId, selectedNeedIds = []) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => { initReturnHandlers(); }, []);

  useEffect(() => {
    if (!userId) { if (state.userId) resetHealthStore(); return; }
    if (state.userId !== userId || !state.loadedAt) loadHealthData(userId);
  }, [userId]);

  // Quiet background refresh at most every 6 hours per source, after load.
  useEffect(() => {
    if (s.status !== 'ready' || !userId) return;
    syncPhoneSource().catch(() => {});
    syncCloudSource('oura').catch(() => {});
  }, [s.status, s.loadedAt, userId]);

  const insights = useMemo(() => buildInsights(s.rows.filter(usableForInsights)), [s.rows]);
  // Health Match only reads sources whose terms allow it (src/health/policy.js).
  const matchSignals = useMemo(() => buildInsights(s.rows.filter(usableForMatching)).signals, [s.rows]);
  const needKey = selectedNeedIds.join('|');
  const matchContext = useMemo(
    () => (matchSignals.length ? healthMatchContext(matchSignals, selectedNeedIds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchSignals, needKey],
  );
  const connected = s.connections.filter((c) => c.status !== 'disconnected');
  return { ...s, connected, insights, matchContext, refresh: () => loadHealthData(userId) };
}
