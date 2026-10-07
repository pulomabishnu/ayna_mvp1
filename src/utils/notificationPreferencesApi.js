/**
 * Thin client for /api/notification-preferences (GET / PATCH), ported from
 * the mobile app's utils/notificationPreferencesApi.js. Auth is the caller's
 * Supabase JWT as `Authorization: Bearer <token>`; the server never trusts a
 * user id from the body.
 *
 * GET  -> { notificationsEnabled, updatesEnabled, nightModeEnabled,
 *           newsletterEnabled, deliveryChannel, personalizeWithDataEnabled,
 *           quietHoursEnabled, quietHoursStart, quietHoursEnd, textSizeIndex,
 *           phoneVerified }
 * PATCH takes snake_case column names (notifications_enabled,
 *   updates_enabled, delivery_channel, personalize_with_data_enabled,
 *   quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
 *   text_size_index) and returns the same shape as GET.
 */
import { getSupabaseClient } from './supabaseClient.js';

export class NotSignedInError extends Error {
  constructor() {
    super('not_signed_in');
    this.code = 'not_signed_in';
  }
}

async function getAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
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
  if (res.status === 401) throw new NotSignedInError();
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.code = data?.error || `http_${res.status}`;
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

const PREFERENCES_ERROR_MESSAGES = {
  not_signed_in: 'Log in again to change this.',
  load_failed: "Couldn't load your settings. Try again shortly.",
  save_failed: "That didn't save. Try again.",
  phone_not_verified: 'Verify your phone number first to get texts.',
  invalid_time: 'Pick a valid start and end time.',
  invalid_text_size: "That text size didn't save.",
  invalid_delivery_channel: "That channel isn't available.",
};

export function friendlyPreferencesError(code) {
  return PREFERENCES_ERROR_MESSAGES[code] || "That didn't save. Try again.";
}
