/**
 * Uploads and downloads her daily log and tries (/api/daily-log) when she is
 * signed in. Local data always comes first: if she's offline, signed out, or
 * the server table isn't switched on yet (503 not_ready), nothing is lost
 * and it quietly tries again later.
 *
 * Authenticated with her own Supabase session; never sends a user id of its
 * own. Nothing here logs values or sends them to analytics.
 */
import { addDays, applyLogSync, dirtyLogEntries, logOwner, setLogOwner, todayKey } from './dailyLog.js';
import { applyTriesSync, dirtyTries, setTriesOwner } from './outcomes.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { apiUrl } from '../utils/apiUrl.js';
import { fetchWithTimeout } from '../utils/network.js';

const RETRY_KEY = 'ayna_user_data_retry_at';
const NOT_READY_WAIT_MS = 60 * 60 * 1000; // table missing: try again in an hour
const OFFLINE_WAIT_MS = 2 * 60 * 1000;
const PULL_DAYS = 400;

async function defaultToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const s = data?.session;
  return s?.access_token && !s.user?.is_anonymous ? s.access_token : null;
}

async function defaultFetch(path, init) {
  return fetchWithTimeout(apiUrl(path), init);
}

function readRetryAt(storage) {
  try { return Number(storage?.getItem(RETRY_KEY)) || 0; } catch { return 0; }
}
function writeRetryAt(storage, at) {
  try { storage?.setItem(RETRY_KEY, String(at)); } catch { /* storage blocked */ }
}

async function call(fetchImpl, token, path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetchImpl(path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch {
    return { ok: false, reason: 'offline' };
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (res.ok) return { ok: true, data };
  if (res.status === 503 && data?.error === 'not_ready') return { ok: false, reason: 'not_ready' };
  if (res.status === 401) return { ok: false, reason: 'signed_out' };
  return { ok: false, reason: 'error' };
}

/**
 * One sync pass for whoever is signed in.
 * @returns {Promise<{ status: 'synced'|'signed_out'|'offline'|'not_ready'|'error'|'waiting' }>}
 */
export async function syncUserData({
  userId, storage = globalThis.localStorage, getToken = defaultToken, fetchImpl = defaultFetch, now = Date.now(), force = false,
} = {}) {
  setLogOwner(userId || null, storage);
  setTriesOwner(userId || null, storage);
  if (!userId) return { status: 'signed_out' };
  if (!force && readRetryAt(storage) > now) return { status: 'waiting' };
  const token = await getToken().catch(() => null);
  if (!token) return { status: 'signed_out' };
  const owner = String(userId);

  const fail = (reason) => {
    writeRetryAt(storage, now + (reason === 'not_ready' ? NOT_READY_WAIT_MS : OFFLINE_WAIT_MS));
    return { status: reason };
  };

  const entries = dirtyLogEntries(storage);
  const tries = dirtyTries(storage);
  if (entries.length || tries.length) {
    const up = await call(fetchImpl, token, '/api/daily-log', { method: 'POST', body: { entries, tries } });
    if (!up.ok) return fail(up.reason);
    applyLogSync({ owner, uploaded: entries }, storage);
    applyTriesSync({ owner, uploaded: tries }, storage);
  }
  const today = todayKey();
  const down = await call(fetchImpl, token, `/api/daily-log?from=${addDays(today, -PULL_DAYS)}&to=${today}`);
  if (!down.ok) return fail(down.reason);
  if (logOwner(storage) !== owner) return { status: 'signed_out' }; // she signed out meanwhile
  applyLogSync({ owner, server: Array.isArray(down.data?.entries) ? down.data.entries : [] }, storage);
  applyTriesSync({ owner, server: Array.isArray(down.data?.tries) ? down.data.tries : [] }, storage);
  writeRetryAt(storage, 0);
  return { status: 'synced' };
}
