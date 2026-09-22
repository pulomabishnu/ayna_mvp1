import posthog from 'posthog-js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { apiUrl } from '../../utils/apiUrl.js';
import { NotSignedInError } from './notificationPreferencesApi.js';

export { NotSignedInError };

const PRIVATE_LOCAL_KEYS = [
  'ayna_ecosystem_session_v1',
  'ayna_routine_v1',
  'ayna_saved_for_later_v1',
  'ayna_zip',
];

function purgeLocalPrivateState() {
  try {
    for (const key of PRIVATE_LOCAL_KEYS) localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
  try {
    const remove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('ayna-ai-search') || key === 'ayna_pending_consent')) remove.push(key);
    }
    for (const key of remove) sessionStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function fetchDataExport() {
  const token = await getAccessToken();
  if (!token) throw new NotSignedInError();
  const res = await fetch(apiUrl('/api/export-data'), {
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

  const res = await fetch(apiUrl('/api/account-delete'), {
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

  // The server has removed the auth user. Clear local auth, analytics identity,
  // and any legacy device caches that could reveal health interests.
  try { await getSupabaseClient()?.auth.signOut({ scope: 'local' }); } catch { /* deleted session */ }
  try { posthog.reset(); } catch { /* analytics unavailable or opted out */ }
  purgeLocalPrivateState();

  return data;
}
