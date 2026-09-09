// Thin client for /api/export-data — same auth pattern as
// notificationPreferencesApi.js (a real Supabase JWT via Authorization:
// Bearer, never a client-supplied user id), kept as its own small file
// rather than a shared cross-concern helper since that's the pattern this
// app already uses (one thin client per backend concern). Reuses that
// file's NotSignedInError rather than declaring a second, identical class.
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
