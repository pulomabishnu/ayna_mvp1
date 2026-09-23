// Thin client for /api/device-tokens — same authed-fetch pattern as
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
  let parsed = true;
  try {
    data = await res.json();
  } catch {
    data = {};
    parsed = false;
  }
  // A missing route on the web host answers 200 with the HTML app shell;
  // that is NOT a successful save.
  if (res.ok && (!parsed || !data || typeof data !== 'object')) {
    const err = new Error('service_unavailable');
    err.code = 'service_unavailable';
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = data?.error || `http_${res.status}`;
    throw err;
  }
  return data;
}

// Sign-out: unlink this phone from the account so it stops getting its alerts.
export async function unregisterDeviceToken(deviceToken) {
  const token = await getAccessToken();
  if (!token || !deviceToken) return;
  await fetch(apiUrl('/api/device-tokens'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ deviceToken }),
  }).catch(() => {});
}

// Channels → "Send a test notification". Resolves to { ok, error }.
export async function sendTestPush() {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'not_signed_in' };
  try {
    const res = await fetch(apiUrl('/api/push-test'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return { ok: false, error: 'service_unavailable' };
    return res.ok ? { ok: true, ...data } : { ok: false, error: data.error || `http_${res.status}` };
  } catch {
    return { ok: false, error: 'network' };
  }
}
