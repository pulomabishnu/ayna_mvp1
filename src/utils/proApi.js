import { getSupabaseClient } from './supabaseClient.js';
import { apiUrl } from './apiUrl.js';

export async function requestPro({ plan, requestId, action, userId, minutes, readId, buildId, signal } = {}) {
  const client = getSupabaseClient();
  const { data } = client ? await client.auth.getSession() : { data: null };
  if (!data?.session?.access_token) throw Object.assign(new Error('Sign in to your ayna account first.'), { code: 'sign_in_required' });

  const response = await fetch(apiUrl('/api/pro'), {
    method: plan || action ? 'POST' : 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(plan || action ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(plan || action ? { body: JSON.stringify({ plan, requestId, action, userId, minutes, readId, buildId }) } : {}),
  });

  const result = await response.json().catch(() => ({}));
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
  const response = await fetch(apiUrl('/api/pro?action=features'), { signal });
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
