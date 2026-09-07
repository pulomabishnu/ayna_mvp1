// Thin client for /api/notification-preferences and the existing
// /api/phone-verify-send /-confirm routes, all of which authenticate via a
// real Supabase JWT (see api/_usageLimit.js's verifyUser) — never a
// client-supplied user id. Uses the same shared Supabase client singleton
// as the rest of the app (src/utils/supabaseClient.js) so this picks up
// whatever real session already exists, the moment mobile has one; it does
// not create a session of its own.
import { getSupabaseClient } from '../../utils/supabaseClient.js';

export class NotSignedInError extends Error {
  constructor() {
    super('not_signed_in');
    this.code = 'not_signed_in';
  }
}

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function authedFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new NotSignedInError();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
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
    err.retryAfterSeconds = data?.retryAfterSeconds;
    throw err;
  }
  return data;
}

export function fetchNotificationPreferences() {
  return authedFetch('/api/notification-preferences', { method: 'GET' });
}

export function patchNotificationPreferences(patch) {
  return authedFetch('/api/notification-preferences', { method: 'PATCH', body: JSON.stringify(patch) });
}

export function sendPhoneVerificationCode(phoneNumber) {
  return authedFetch('/api/phone-verify-send', { method: 'POST', body: JSON.stringify({ phoneNumber }) });
}

export function confirmPhoneVerificationCode(phoneNumber, code) {
  return authedFetch('/api/phone-verify-confirm', { method: 'POST', body: JSON.stringify({ phoneNumber, code }) });
}
