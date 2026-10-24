/**
 * One way to get a signed-in request token, on the app and the website (team
 * direction 55: Save, Invite, Feedback, Ecosystem and Campaigns must keep
 * working after sign-in).
 *
 * Why: right after signing in, or after a tab sat in the background,
 * getSession() can briefly return no session while Supabase finishes writing
 * or rotating it. Callers that read it once failed with "Sign in required"
 * even though she was signed in (the feedback survey and invite failures
 * reported in the focus group). The campaign client already handled this;
 * the same steps now live here for every caller:
 *   1. the current session's token,
 *   2. otherwise one explicit refresh,
 *   3. and a request that comes back 401 refreshes and retries exactly once.
 */
import { getSupabaseClient } from './supabaseClient';

export async function getAccessToken({ forceRefresh = false } = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  if (!forceRefresh) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.access_token) return data.session.access_token;
    } catch {
      // A refresh below may still recover a stored session that is mid-rotation.
    }
  }
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Run `send(token)` with a fresh token; on a 401 response, refresh once and
 * send again. `send` returns a fetch Response (or anything with .status).
 * Returns null when there is no session at all (caller shows "sign in").
 * Only use for requests the server rejects BEFORE acting on a 401.
 */
export async function withAuthRetry(send) {
  const first = await getAccessToken();
  if (!first) return null;
  const res = await send(first);
  if (res?.status !== 401) return res;
  const next = await getAccessToken({ forceRefresh: true });
  if (!next || next === first) return res;
  return send(next);
}
