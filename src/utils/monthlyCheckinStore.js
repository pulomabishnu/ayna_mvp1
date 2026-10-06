import { getSupabaseClient } from './supabaseClient';

/**
 * Monthly check-ins in Supabase (supabase/monthly_checkins.sql), ported from
 * the mobile branch's store. One row per signed-in user per month, keyed on
 * the 1st of the month.
 *
 * Guests (no session, or a Supabase anonymous "community guest" session) are
 * never written: RLS refuses them anyway, and they keep the website's older
 * browser-only behavior (App.jsx stores `ayna_checkin_completed_at`).
 */

const TABLE = 'monthly_checkins';
const AUTH_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 6000;
export const GUEST_COMPLETED_AT_KEY = 'ayna_checkin_completed_at';

function withTimeout(promise, ms, reason) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(reason)), ms)),
  ]);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 'YYYY-MM-01' for the LOCAL calendar month. Built from local parts on
 * purpose: the mobile version used toISOString(), which shifts to UTC, so
 * just after midnight on the 1st anywhere east of UTC it returned the last
 * day of the previous month and broke the unique (user, month) key.
 */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

export function previousMonthKey(date = new Date()) {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

/** "October 2026" for a 'YYYY-MM-01' key. */
export function monthLabel(key) {
  const [y, m] = String(key || '').split('-').map(Number);
  if (!y || !m) return '';
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * The signed-in, non-guest user id, or null. Prefers the cached session (no
 * network round trip), same order as healthIntakeStore.js.
 */
export async function resolveCheckinUserId(supabase) {
  if (!supabase?.auth) return null;
  let user = null;
  try {
    const { data } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, 'auth_session_timeout');
    user = data?.session?.user || null;
  } catch {
    user = null;
  }
  if (!user) {
    try {
      const { data } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS, 'auth_user_timeout');
      user = data?.user || null;
    } catch {
      user = null;
    }
  }
  if (!user?.id || user.is_anonymous) return null;
  return user.id;
}

/**
 * { signedIn, thisMonthCheckin, lastCheckin }.
 * thisMonthCheckin is set once this month is already done (show the summary,
 * not the wizard); lastCheckin is the most recent EARLIER month, for prefill.
 * signedIn false means: guest, signed out, or Supabase not configured.
 */
export async function loadMonthlyCheckinStatus({ supabase = getSupabaseClient(), now = new Date() } = {}) {
  const empty = { signedIn: false, thisMonthCheckin: null, lastCheckin: null };
  const userId = await resolveCheckinUserId(supabase);
  if (!userId) return empty;

  const thisMonth = monthKey(now);
  try {
    const { data, error } = await withTimeout(
      supabase
        .from(TABLE)
        .select('check_in_month, answers, created_at, updated_at')
        .eq('user_id', userId)
        .lte('check_in_month', thisMonth)
        .order('check_in_month', { ascending: false })
        .limit(2),
      REQUEST_TIMEOUT_MS,
      'checkin_load_timeout',
    );
    if (error) {
      console.warn('[monthlyCheckinStore] load failed:', error.message || error);
      return { ...empty, signedIn: true };
    }
    const rows = Array.isArray(data) ? data : [];
    return {
      signedIn: true,
      thisMonthCheckin: rows.find((r) => r.check_in_month === thisMonth) || null,
      lastCheckin: rows.find((r) => r.check_in_month !== thisMonth) || null,
    };
  } catch (e) {
    console.warn('[monthlyCheckinStore] load threw:', e?.message || e);
    return { ...empty, signedIn: true };
  }
}

/** Upserts this month's row. Never throws; returns { saved, reason? }. */
export async function saveMonthlyCheckin(answers, { supabase = getSupabaseClient(), now = new Date() } = {}) {
  if (!supabase) return { saved: false, reason: 'supabase_not_configured' };
  const userId = await resolveCheckinUserId(supabase);
  if (!userId) return { saved: false, reason: 'no_authenticated_user' };
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return { saved: false, reason: 'invalid_answers' };

  const payload = {
    user_id: userId,
    check_in_month: monthKey(now),
    answers,
    updated_at: now.toISOString(),
  };
  try {
    const { error } = await withTimeout(
      supabase.from(TABLE).upsert(payload, { onConflict: 'user_id,check_in_month' }),
      REQUEST_TIMEOUT_MS,
      'checkin_save_timeout',
    );
    if (error) {
      console.warn('[monthlyCheckinStore] save failed:', error.message || error);
      return { saved: false, reason: error.message || 'server_save_failed' };
    }
    return { saved: true, userId };
  } catch (e) {
    console.warn('[monthlyCheckinStore] save threw:', e?.message || e);
    return { saved: false, reason: e?.message || 'server_save_failed' };
  }
}

/**
 * Guest fallback: App.jsx records `ayna_checkin_completed_at` for every
 * completed check-in. True when that timestamp is in the current local month.
 */
export function guestCheckinDoneThisMonth(now = new Date()) {
  try {
    const raw = globalThis.localStorage?.getItem(GUEST_COMPLETED_AT_KEY);
    if (!raw) return false;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return false;
    return monthKey(d) === monthKey(now);
  } catch {
    return false;
  }
}
