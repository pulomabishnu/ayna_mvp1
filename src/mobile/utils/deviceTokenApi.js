// Thin client for /api/device-tokens — same authed-fetch pattern as
// notificationPreferencesApi.js (real Supabase JWT via Authorization: Bearer,
// never a client-supplied user id).
import { getSupabaseClient } from '../../utils/supabaseClient.js';

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function registerDeviceToken(deviceToken, platform) {
  const token = await getAccessToken();
  if (!token) throw new Error('not_signed_in');

  const res = await fetch('/api/device-tokens', {
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
  return data;
}
