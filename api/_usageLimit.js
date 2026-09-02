/* global process */
import { createClient } from '@supabase/supabase-js';

function positiveIntEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const LIMITS = {
  chat: 5,
  insights: 5,
  // Defaults to 1, but beta/production can safely allow more builds
  // with ECOSYSTEM_BUILD_LIMIT without another code change.
  ecosystem: positiveIntEnv('ECOSYSTEM_BUILD_LIMIT', 1),
  // Inbound SMS previously had no quota and no rate limit at all: every text
  // was one unmetered Claude call plus one outbound SMS, entirely outside the
  // paywall this module exists to enforce.
  sms: 30,
};

/** Auth lookups must not be able to hang a serverless invocation open. */
const AUTH_TIMEOUT_MS = 8000;
const RPC_TIMEOUT_MS = 8000;

function getWeekPeriod() {
  // Monday-anchored UTC week. getUTCDay/getUTCDate/setUTCDate are used
  // consistently, so month and year rollover are handled by Date itself.
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

// Reused across warm invocations instead of rebuilt per request.
let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[usageLimit] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    return null;
  }
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function verifyUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null, error: 'auth_required', admin: null };
  const admin = getAdmin();
  if (!admin) return { user: null, error: 'server_misconfigured', admin: null };
  try {
    const { data, error } = await withTimeout(admin.auth.getUser(token), AUTH_TIMEOUT_MS, 'auth');
    if (error || !data?.user) return { user: null, error: 'invalid_session', admin };
    return { user: data.user, error: null, admin };
  } catch (e) {
    console.error('[usageLimit] verifyUser error:', e?.message);
    return { user: null, error: 'auth_error', admin: null };
  }
}

/**
 * Atomically consume one unit of `action` if the user is under the limit.
 *
 * Never do check-then-increment as two round trips: concurrent requests both
 * read the pre-increment value and both proceed, so a limit of N grants N+1.
 * consume_ai_usage() does the compare and the increment in one statement.
 *
 * Fail-open on infrastructure errors (missing RPC, Supabase down) is
 * deliberate: locking every user out of the product is worse than briefly
 * over-serving one. `degraded: true` marks those cases so they are visible in
 * logs and responses rather than silently swallowed.
 */
export async function consumeUsage(admin, userId, action) {
  const period = getPeriod(action);
  const limit = LIMITS[action];
  if (!admin) {
    console.error('[usageLimit] consumeUsage called without an admin client — allowing (degraded)');
    return { allowed: true, used: 0, limit, period, degraded: true };
  }
  try {
    const { data, error } = await withTimeout(
      admin.rpc('consume_ai_usage', {
        p_user_id: userId,
        p_period: period,
        p_action: action,
        p_limit: limit,
      }),
      RPC_TIMEOUT_MS,
      'rpc'
    );
    if (error) throw new Error(error.message || 'rpc_error');
    // returns table(allowed boolean, used integer) -> array of one row
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') {
      throw new Error('consume_ai_usage returned an unexpected shape');
    }
    return { allowed: row.allowed, used: row.used ?? 0, limit, period, degraded: false };
  } catch (e) {
    // Loud: this is the branch where the paywall silently stops working.
    console.error(
      `[usageLimit] consume_ai_usage FAILED for action=${action} — allowing request (degraded). ` +
      `Apply supabase/user_ai_usage.sql if the function is missing. Cause: ${e?.message}`
    );
    return { allowed: true, used: 0, limit, period, degraded: true };
  }
}

/** Give back a unit consumed for work that then failed. Best-effort. */
export async function refundUsage(admin, userId, action, period) {
  if (!admin) return;
  try {
    const { error } = await withTimeout(
      admin.rpc('refund_ai_usage', {
        p_user_id: userId,
        p_period: period || getPeriod(action),
        p_action: action,
      }),
      RPC_TIMEOUT_MS,
      'rpc'
    );
    if (error) throw new Error(error.message || 'rpc_error');
  } catch (e) {
    console.error(`[usageLimit] refund_ai_usage failed for action=${action}:`, e?.message);
  }
}

/**
 * Claim one ecosystem build against the lifetime limit.
 *
 * Keyed by a client-supplied buildId (derived from the intake fingerprint)
 * rather than by request, because one build spans several batch requests.
 * Re-presenting the same buildId is free, which is what makes both multi-batch
 * generation and retry-after-failure safe.
 */
export async function claimEcosystemBuild(admin, userId, buildId) {
  const limit = LIMITS.ecosystem;
  if (!admin) {
    console.error('[usageLimit] claimEcosystemBuild called without an admin client — allowing (degraded)');
    return { allowed: true, used: 0, limit, degraded: true };
  }
  try {
    const { data, error } = await withTimeout(
      admin.rpc('claim_ecosystem_build', {
        p_user_id: userId,
        p_build_id: buildId,
        p_limit: limit,
      }),
      RPC_TIMEOUT_MS,
      'rpc'
    );
    if (error) throw new Error(error.message || 'rpc_error');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') {
      throw new Error('claim_ecosystem_build returned an unexpected shape');
    }
    return { allowed: row.allowed, used: row.used ?? 0, limit, degraded: false };
  } catch (e) {
    console.error(
      '[usageLimit] claim_ecosystem_build FAILED — allowing request (degraded). ' +
      `Apply supabase/user_ecosystem_builds.sql if the function is missing. Cause: ${e?.message}`
    );
    return { allowed: true, used: 0, limit, degraded: true };
  }
}

/** Release a claimed build when it produced nothing usable. Best-effort. */
export async function releaseEcosystemBuild(admin, userId, buildId) {
  if (!admin || !buildId) return;
  try {
    const { error } = await withTimeout(
      admin.rpc('release_ecosystem_build', { p_user_id: userId, p_build_id: buildId }),
      RPC_TIMEOUT_MS,
      'rpc'
    );
    if (error) throw new Error(error.message || 'rpc_error');
    console.log(`[usageLimit] released ecosystem build ${buildId} for user ${userId}`);
  } catch (e) {
    console.error('[usageLimit] release_ecosystem_build failed:', e?.message);
  }
}
