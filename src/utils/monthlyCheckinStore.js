import { getSupabaseClient, getSupabaseUser } from './supabaseClient.js';
import { localDayKey, legacyUtcDayKey } from './localDate.js';

const TABLE = 'monthly_checkins';

// Always the 1st of the month, matches monthly_checkins.sql's
// (user_id, check_in_month) unique index, so "this month" and "last month"
// are unambiguous regardless of what day it actually is.
// Local calendar (P0 date bug): east of UTC the old toISOString() gave the
// last day of the previous month ("2026-09-30" for October in Tokyo).
export function monthKey(date = new Date()) {
  return localDayKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function previousMonthKey(date = new Date()) {
  return localDayKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

/** The key older builds wrote for this month (UTC of local midnight on the 1st), so saved rows still count. */
export function legacyMonthKey(date = new Date()) {
  return legacyUtcDayKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

async function resolveUserId(supabase) {
  if (!supabase) return null;
  const user = await getSupabaseUser().catch(() => null);
  if (user?.id) return user.id;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Returns { thisMonthCheckin, lastCheckin }, thisMonthCheckin is non-null
 * only once the person has already submitted this month's check-in (used
 * to show the completed/summary state instead of the wizard again);
 * lastCheckin is whatever their most recent PRIOR check-in was, used to
 * pre-fill the wizard. Both null for someone signed out or with no history
 * yet, the wizard falls back to the health intake itself in that case.
 */
export async function loadMonthlyCheckinStatus() {
  const supabase = getSupabaseClient();
  const userId = await resolveUserId(supabase);
  if (!supabase || !userId) return { thisMonthCheckin: null, lastCheckin: null };

  const thisMonth = monthKey();
  const { data, error } = await supabase
    .from(TABLE)
    .select('check_in_month, answers, created_at')
    .eq('user_id', userId)
    .lte('check_in_month', thisMonth)
    .order('check_in_month', { ascending: false })
    .limit(3);

  if (error) {
    console.warn('[monthlyCheckinStore] load failed:', error.message || error);
    return { thisMonthCheckin: null, lastCheckin: null };
  }

  const rows = data || [];
  const thisKeys = new Set([thisMonth, legacyMonthKey()]);
  const thisMonthCheckin = rows.find((r) => thisKeys.has(r.check_in_month)) || null;
  const lastCheckin = rows.find((r) => !thisKeys.has(r.check_in_month)) || null;
  return { thisMonthCheckin, lastCheckin };
}

export async function saveMonthlyCheckin(answers) {
  const supabase = getSupabaseClient();
  const userId = await resolveUserId(supabase);
  if (!supabase) return { saved: false, reason: 'supabase_not_configured' };
  if (!userId) return { saved: false, reason: 'no_authenticated_user' };

  const payload = {
    user_id: userId,
    check_in_month: monthKey(),
    answers,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id,check_in_month' });
    if (error) {
      console.warn('[monthlyCheckinStore] save failed:', error.message || error);
      return { saved: false, reason: error.message || 'server_save_failed' };
    }
    return { saved: true, userId };
  } catch (error) {
    console.warn('[monthlyCheckinStore] save threw:', error);
    return { saved: false, reason: error?.message || 'server_save_failed' };
  }
}

/** How many monthly check-ins she has done (her rows only, RLS). null when unknown. */
export async function countMonthlyCheckins() {
  const supabase = getSupabaseClient();
  const userId = await resolveUserId(supabase);
  if (!supabase || !userId) return null;
  try {
    const { count, error } = await supabase.from(TABLE).select('check_in_month', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) return null;
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}
