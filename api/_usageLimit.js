/* global process */
import { createClient } from '@supabase/supabase-js';

export const LIMITS = { chat: 5, insights: 5, ecosystem: 1 };

function getWeekPeriod() {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // days back to Monday
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diff);
  return 'week:' + mon.toISOString().split('T')[0];
}

export function getPeriod(action) {
  return action === 'ecosystem' ? 'lifetime' : getWeekPeriod();
}

function getAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function verifyUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null, error: 'auth_required', admin: null };
  const admin = getAdmin();
  try {
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return { user: null, error: 'invalid_session', admin };
    return { user, error: null, admin };
  } catch (e) {
    console.error('[usageLimit] verifyUser error:', e?.message);
    return { user: null, error: 'auth_error', admin: null };
  }
}

export async function checkUsage(admin, userId, action) {
  const period = getPeriod(action);
  const { data } = await admin
    .from('user_ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('period', period)
    .eq('action', action)
    .maybeSingle();
  const used = data?.count ?? 0;
  return { used, limit: LIMITS[action], period, over: used >= LIMITS[action] };
}

export async function incrementUsage(admin, userId, action, period) {
  try {
    await admin.rpc('increment_ai_usage', { p_user_id: userId, p_period: period, p_action: action });
  } catch (e) {
    console.error('[usageLimit] increment error:', e?.message);
  }
}
