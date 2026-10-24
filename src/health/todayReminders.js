/**
 * Client for /api/today-reminders: "Remind me tonight" and the follow-up
 * nudge on the day a try is due. Sends only the kind and the time; the push
 * always reads "Your ayna check-in is ready" (no health words on the lock
 * screen). Signed out there is nowhere to send it, so the caller says so.
 */
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { apiUrl } from '../utils/apiUrl.js';
import { fetchWithTimeout } from '../utils/network.js';

export const TONIGHT_HOUR = 20; // 8pm her time
export const FOLLOW_UP_HOUR = 9; // 9am on the due day
export const RUNDOWN_HOUR = 8; // 8am: "Your daily rundown is ready."

/** Local time `hour`:00 on `day` ('YYYY-MM-DD'), as an ISO instant. */
export function localAt(day, hour, minute = 0) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0).toISOString();
}

/** Tonight at 8pm, or in 15 minutes if it is already later than that. */
export function tonightAt(today, now = new Date()) {
  const at = Date.parse(localAt(today, TONIGHT_HOUR));
  return new Date(Math.max(at, now.getTime() + 15 * 60000)).toISOString();
}

export function herTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; }
}

async function defaultToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const s = data?.session;
  return s?.access_token && !s.user?.is_anonymous ? s.access_token : null;
}

/**
 * @returns {Promise<'scheduled'|'signed_out'|'offline'|'error'>}
 */
export async function scheduleTodayReminder({ kind, sendAt }, { getToken = defaultToken, fetchImpl = (p, i) => fetchWithTimeout(apiUrl(p), i) } = {}) {
  const token = await getToken();
  if (!token) return 'signed_out';
  try {
    const res = await fetchImpl('/api/today-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind, sendAt, tz: herTimeZone() }),
    });
    return res.ok ? 'scheduled' : 'error';
  } catch {
    return 'offline';
  }
}
