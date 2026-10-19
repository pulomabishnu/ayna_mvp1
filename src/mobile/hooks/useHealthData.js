/**
 * One shared, in-memory store for the person's connected health data, read by
 * the Health data screens, Health Insights and Health Match.
 *
 * Kept in memory only: health values are never written to localStorage or
 * any other browser storage, never sent to analytics, never logged.
 * One exception: Apple Health Records she reviewed and chose to keep
 * (src/health/records.js) are saved on her phone only, never on the server.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { fetchHealthData, fetchLiveRows, syncDeviceRows, syncOAuthSource } from '../../health/healthApi.js';
import { LIVE_ONLY_SOURCES } from '../../health/metrics.js';
import { buildInsights } from '../../health/insights.js';
import { healthMatchContext } from '../../health/matchContext.js';
import { usableForInsights, usableForMatching } from '../../health/policy.js';
import { healthStoreAvailability, nativeSourceForPlatform, readDailyHealth } from '../../health/native.js';
import { deleteSavedRecords, hasRecords, loadSavedRecords, saveRecords } from '../../health/records.js';
import { DEV_DEMO_CONNECTIONS, devDemoRows } from '../../health/devDemo.js';

// DEVELOPMENT ONLY (?healthdemo=1 in the local preview): made-up rows so the screens can be checked. Off in production builds.
export const DEV_HEALTH_DEMO = Boolean(import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('healthdemo') === '1');

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
const NAMES = { oura: 'Oura', whoop: 'WHOOP' };

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
// `live` holds rows from live-only sources (WHOOP), fetched fresh and kept in
// memory only: provider terms forbid storing them, so they are never saved.
let state = { status: 'idle', connections: [], rows: [], live: {}, records: null, error: null, userId: null, loadedAt: 0 };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };
const lastAutoSync = {};

export function resetHealthStore() {
  state = { status: 'idle', connections: [], rows: [], live: {}, records: null, error: null, userId: null, loadedAt: 0 };
  inflight = null;
  loadSeq += 1;
  emit();
}

let inflight = null;
let loadSeq = 0;

/** Her own calendar day (native rows are written in local days, not UTC). */
export const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Days to read from the phone: the gap since the last sync, at least 14, at most 90. */
const phoneDays = (lastSyncedAt) => {
  if (!lastSyncedAt) return 90;
  const gap = Math.ceil((Date.now() - Date.parse(lastSyncedAt)) / 86400000) + 2;
  return Math.min(90, Math.max(14, Number.isFinite(gap) ? gap : 90));
};

export function loadHealthData(userId, { force = false } = {}) {
  if (!userId) { resetHealthStore(); return Promise.resolve(); }
  // Several screens mount the hook at once; share one request. A forced
  // refresh (right after connecting) waits for it, then loads fresh.
  if (inflight && inflight.userId === userId) return force ? inflight.promise.then(() => loadHealthData(userId)) : inflight.promise;
  const seq = ++loadSeq;
  set({ status: state.userId === userId && state.loadedAt ? 'refreshing' : 'loading', userId, error: null, records: state.userId === userId ? state.records : loadSavedRecords(userId) });
  const promise = (async () => {
    if (DEV_HEALTH_DEMO) {
      set({ status: 'ready', connections: DEV_DEMO_CONNECTIONS, rows: devDemoRows(), live: {}, loadedAt: Date.now() });
      inflight = null;
      return;
    }
    try {
      const out = await fetchHealthData();
      // Signed out or switched accounts while this was loading: drop it.
      if (seq !== loadSeq || state.userId !== userId) return;
      const connections = out.connections || [];
      const keepLive = Object.fromEntries(Object.entries(state.live || {}).filter(([src]) => connections.some((c) => c.source === src && active(c))));
      set({ status: 'ready', connections, rows: out.rows || [], live: keepLive, loadedAt: Date.now() });
    } catch (e) {
      if (seq === loadSeq && state.userId === userId) set({ status: 'error', error: e?.code || 'load_failed' });
    } finally {
      if (inflight?.seq === seq) inflight = null;
    }
  })();
  inflight = { userId, promise, seq };
  return promise;
}

/** Apple Health Records she checked on the review screen. Saved on this phone only. */
export function keepHealthRecords(userId, picked) {
  const saved = saveRecords(userId, picked);
  if (state.userId === userId) set({ records: hasRecords(saved) ? saved : null });
  return saved;
}
export function forgetHealthRecords(userId) {
  deleteSavedRecords(userId);
  if (state.userId === userId) set({ records: null });
}

const LIVE_TTL_MS = 30 * 60000;
const liveFetchedAt = {};
/** Live-only sources (WHOOP): fetch recent rows into memory. Never stored anywhere. */
export async function refreshLiveSource(provider, { force = false } = {}) {
  const connection = state.connections.find((c) => c.source === provider);
  if (!active(connection)) { if (state.live?.[provider]) set({ live: { ...state.live, [provider]: undefined } }); return { skipped: 'not_connected' }; }
  if (!force && liveFetchedAt[provider] && Date.now() - liveFetchedAt[provider] < LIVE_TTL_MS) return { skipped: 'recent' };
  liveFetchedAt[provider] = Date.now();
  const out = await fetchLiveRows(provider);
  set({ live: { ...state.live, [provider]: (out.rows || []).map((r) => ({ ...r, source: provider })) } });
  return { live: (out.rows || []).length, empty: !(out.rows || []).length };
}

const active = (c) => c && c.status !== 'disconnected' && c.sync_enabled;

/** Pull fresh daily rows from the phone (Apple Health / Health Connect) and send them up. */
export async function syncPhoneSource({ force = false } = {}) {
  const source = nativeSourceForPlatform();
  const connection = state.connections.find((c) => c.source === source);
  if (!source || !active(connection)) return { skipped: 'not_connected' };
  const key = `${state.userId}:${source}`;
  if (!force && lastAutoSync[key] && Date.now() - lastAutoSync[key] < AUTO_SYNC_MS) return { skipped: 'recent' };
  const availability = await healthStoreAvailability();
  if (!availability.available) return { skipped: availability.reason || 'unavailable' };
  lastAutoSync[key] = Date.now();
  try {
    const rows = await readDailyHealth(connection.categories, { days: phoneDays(connection.last_synced_at) });
    const result = rows.length ? await syncDeviceRows(source, rows) : { saved: 0 };
    await loadHealthData(state.userId, { force: true });
    return { saved: result.saved || 0, empty: rows.length === 0 };
  } catch (e) {
    delete lastAutoSync[key]; // a failed sync can be retried right away
    throw e;
  }
}

export async function syncCloudSource(provider, { force = false } = {}) {
  if (LIVE_ONLY_SOURCES.includes(provider)) return refreshLiveSource(provider, { force });
  const connection = state.connections.find((c) => c.source === provider);
  if (!active(connection)) return { skipped: 'not_connected' };
  const key = `${state.userId}:${provider}`;
  if (!force && lastAutoSync[key] && Date.now() - lastAutoSync[key] < AUTO_SYNC_MS) return { skipped: 'recent' };
  lastAutoSync[key] = Date.now();
  try {
    const result = await syncOAuthSource(provider);
    await loadHealthData(state.userId, { force: true });
    return result;
  } catch (e) {
    delete lastAutoSync[key];
    throw e;
  }
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
    if (s.status !== 'ready' || !userId || DEV_HEALTH_DEMO) return;
    syncPhoneSource().catch(() => {});
    syncCloudSource('oura').catch(() => {});
    for (const p of LIVE_ONLY_SOURCES) refreshLiveSource(p).catch(() => {});
  }, [s.status, s.loadedAt, userId]);

  const allRows = useMemo(() => [...s.rows, ...Object.values(s.live || {}).filter(Boolean).flat()], [s.rows, s.live]);
  const insightRows = useMemo(() => allRows.filter(usableForInsights), [allRows]);
  const insights = useMemo(() => buildInsights(insightRows, { today: localToday() }), [insightRows]);
  // Health Match only reads sources whose terms allow it (src/health/policy.js).
  const matchSignals = useMemo(() => buildInsights(allRows.filter(usableForMatching), { today: localToday() }).signals, [allRows]);
  const needKey = selectedNeedIds.join('|');
  const matchContext = useMemo(
    () => (matchSignals.length ? healthMatchContext(matchSignals, selectedNeedIds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchSignals, needKey],
  );
  const connected = s.connections.filter((c) => c.status !== 'disconnected');
  const records = hasRecords(s.records) ? s.records : null;
  // insightRows/matchSignals: for the dashboard charts and for quiz-end matching with a new set of goals.
  return { ...s, records, connected, insights, insightRows, matchSignals, matchContext, refresh: () => loadHealthData(userId, { force: true }) };
}
