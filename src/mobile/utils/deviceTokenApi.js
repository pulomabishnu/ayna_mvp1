// Thin client for /api/device-tokens, same authed-fetch pattern as
// notificationPreferencesApi.js (real Supabase JWT via Authorization: Bearer,
// never a client-supplied user id).
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { apiUrl } from '../../utils/apiUrl.js';

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// The token this install last registered, so sign-out can unlink it.
let registered = null;

export async function registerDeviceToken(deviceToken, platform) {
  const token = await getAccessToken();
  if (!token) throw new Error('not_signed_in');

  const res = await fetch(apiUrl('/api/device-tokens'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deviceToken, platform }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = data?.error || `http_${res.status}`;
    throw err;
  }
  registered = { deviceToken, platform };
  return data;
}

/**
 * Sign-out: remove this phone's token from the account (DELETE
 * /api/device-tokens) so it stops getting that account's recall alerts.
 * Must run BEFORE supabase.auth.signOut(), while the JWT is still valid.
 * Best effort and bounded: a dead network never holds up signing out.
 */
export async function unregisterDeviceToken({ timeoutMs = 5000 } = {}) {
  if (!registered) return false;
  const { deviceToken, platform } = registered;
  const token = await getAccessToken();
  if (!token) return false;
  // Abort AND race: CapacitorHttp (native fetch) may ignore the signal.
  const controller = new AbortController();
  let timer;
  const timedOut = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
  });
  try {
    const res = await Promise.race([timedOut, fetch(apiUrl('/api/device-tokens'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deviceToken, platform }),
      signal: controller.signal,
    })]);
    if (res.ok) registered = null;
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
