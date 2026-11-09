import { getSupabaseClient } from './supabaseClient.js';
import { apiUrl } from './apiUrl.js';

// Nov 9 (a Pro member saw "We couldn't confirm your Pro access" in the app): on iPhone the first
// request after the app wakes often fails, and one slow server reply locked a paying member out.
// Status checks now retry, and a member the server confirmed as Pro in the last 3 days stays
// unlocked through a failed check (never someone who was not Pro: their locks stay locked).
const PRO_SEEN_KEY = (uid) => `ayna_pro_seen:${uid}`;
const PRO_SEEN_MS = 3 * 24 * 60 * 60 * 1000;
const wait = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener?.('abort', () => { clearTimeout(t); reject(Object.assign(new Error('aborted'), { name: 'AbortError' })); }, { once: true });
});
function rememberPro(uid, status) {
  try {
    if (!uid) return;
    if (status?.active) localStorage.setItem(PRO_SEEN_KEY(uid), JSON.stringify({ at: Date.now(), until: status.accessExpiresAt || null }));
    else localStorage.removeItem(PRO_SEEN_KEY(uid));
  } catch { /* storage off */ }
}
function recentPro(uid) {
  try {
    const seen = JSON.parse(localStorage.getItem(PRO_SEEN_KEY(uid)) || 'null');
    if (!seen || Date.now() - seen.at > PRO_SEEN_MS) return null;
    if (seen.until && Number(seen.until) < Date.now()) return null;
    return seen;
  } catch { return null; }
}
// Retry a network failure or a 5xx; anything else (signed out, a 4xx) is final.
async function fetchWithRetry(url, init, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    if (i) await wait(i === 1 ? 700 : 2000, init?.signal);
    try {
      const res = await fetch(url, init);
      if (res.status < 500) return res;
      last = res;
    } catch (e) {
      if (e?.name === 'AbortError' || init?.signal?.aborted) throw e;
      last = e;
    }
  }
  if (last instanceof Response) return last;
  throw last;
}

export async function requestPro({ plan, requestId, action, userId, minutes, readId, buildId, signal } = {}) {
  const client = getSupabaseClient();
  const { data } = client ? await client.auth.getSession() : { data: null };
  if (!data?.session?.access_token) throw Object.assign(new Error('Sign in to your ayna account first.'), { code: 'sign_in_required' });

  const isStatus = !(plan || action);
  const uid = data.session.user?.id || '';
  const init = {
    method: plan || action ? 'POST' : 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(plan || action ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(plan || action ? { body: JSON.stringify({ plan, requestId, action, userId, minutes, readId, buildId }) } : {}),
  };

  let response;
  try {
    response = isStatus ? await fetchWithRetry(apiUrl('/api/pro'), init) : await fetch(apiUrl('/api/pro'), init);
  } catch (e) {
    if (isStatus && !signal?.aborted && recentPro(uid)) return { active: true, gates: true, weeklyRead: null, quizRetakeOpen: true, accessExpiresAt: recentPro(uid).until, fromCache: true };
    throw e;
  }

  const result = await response.json().catch(() => ({}));
  if (isStatus && response.ok && typeof result.active === 'boolean') rememberPro(uid, result);
  if (isStatus && response.status >= 500 && recentPro(uid)) return { active: true, gates: true, weeklyRead: null, quizRetakeOpen: true, accessExpiresAt: recentPro(uid).until, fromCache: true };
  if (!response.ok) {
    const messages = {
      sign_in_required: 'Sign in to your ayna account first.',
      early_access_closed: 'The Early Access offer is currently closed.',
      already_pro: 'You already have ayna Pro.',
      try_again_later: 'Please wait a few minutes before trying again.',
      pro_temporarily_unavailable: 'ayna Pro is temporarily unavailable. Please try again.',
    };
    throw Object.assign(new Error(messages[result.error] || 'We couldn’t load ayna Pro right now. Please try again.'), { code: result.error });
  }
  return result;
}

export async function loadProFeatureRules(signal) {
  const response = await fetchWithRetry(apiUrl('/api/pro?action=features'), { signal });
  if (!response.ok) throw new Error('We couldn’t check Pro access. Please try again.');
  return response.json();
}

/**
 * The app's quiz retake allowance (Free: once a month, Pro: anytime). Resolves
 * { allowed }. Fails open on a network or server error, the same as the
 * website's build claim, so nobody loses their answers to an outage.
 */
export async function claimQuizRetake(buildId) {
  try {
    const out = await requestPro({ action: 'quiz_retake', buildId });
    return { allowed: out?.allowed !== false };
  } catch (e) {
    if (e?.code === 'sign_in_required') return { allowed: true };
    return { allowed: true, degraded: true };
  }
}
