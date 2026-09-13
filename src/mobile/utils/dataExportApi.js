import posthog from 'posthog-js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { NotSignedInError } from './notificationPreferencesApi.js';

export { NotSignedInError };

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function fetchDataExport() {
  const token = await getAccessToken();
  if (!token) throw new NotSignedInError();
  const res = await fetch('/api/export-data', {
    headers: { Authorization: `Bearer ${token}` },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = data?.error || `http_${res.status}`;
    throw err;
  }
  return data;
}

export async function requestAccountDeletion() {
  const token = await getAccessToken();
  if (!token) throw new NotSignedInError();

  const res = await fetch('/api/account-delete', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirm: 'DELETE' }),
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = data?.error || `http_${res.status}`;
    throw err;
  }

  // The server has removed the auth user. Clear local auth and analytics state
  // so a deleted person's old device session cannot continue looking signed in
  // or reuse the previous PostHog identity on a later signup.
  try { await getSupabaseClient()?.auth.signOut({ scope: 'local' }); } catch { /* deleted session */ }
  try { posthog.reset(); } catch { /* analytics unavailable or opted out */ }

  return data;
}
