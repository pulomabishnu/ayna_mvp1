import { getSupabaseClient } from './supabaseClient.js';
import { apiUrl } from './apiUrl.js';

export async function requestPro({ plan, requestId, action, userId, minutes, readId, signal } = {}) {
  const client = getSupabaseClient();
  const { data } = client ? await client.auth.getSession() : { data: null };
  if (!data?.session?.access_token) throw new Error('Sign in to your ayna account first.');
  const response = await fetch(apiUrl('/api/pro'), {
    method: plan || action ? 'POST' : 'GET', signal,
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(plan || action ? { 'Content-Type': 'application/json' } : {}) },
    ...(plan || action ? { body: JSON.stringify({ plan, requestId, action, userId, minutes, readId }) } : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    const messages = {
      sign_in_required: 'Sign in to your ayna account first.',
      early_access_closed: 'The early-access offer is currently closed.',
      already_pro: 'You already have ayna Pro. Refresh to see your access.',
      try_again_later: 'Please wait a few minutes before trying again.',
    };
    throw Object.assign(new Error(messages[result.error] || 'We couldn’t load Pro right now. Please try again.'), { code: result.error });
  }
  return result;
}

export async function loadProFeatureRules(signal) {
  const response = await fetch(apiUrl('/api/pro?action=features'), { signal });
  if (!response.ok) throw new Error('We couldn’t check Pro access. Please try again.');
  return response.json();
}
