/* global process */
/**
 * Single source of truth for paid entitlement.
 *
 * SECURITY: metadata-based premium access MUST read `app_metadata`, never
 * `user_metadata`. Paid Early Access is resolved from the server-managed Pro
 * purchase ledger instead of client-writable profile metadata.
 */
export function isPremiumUser(user) {
  return user?.app_metadata?.is_premium === true;
}

/**
 * Resolve all authoritative premium sources: existing staff/admin grants plus
 * confirmed ayna Pro / Early Access purchases and timed focus-group grants.
 */
export async function hasPremiumAccess(user, admin) {
  if (isPremiumUser(user)) return true;
  // The purchase ledger is the source of truth whenever it exists. /api/pro,
  // the quiz-retake function and the playlist trigger all read it directly,
  // so this check must too, or a paying member shows "Pro active" but gets
  // Free limits on Ask and health data (audit, Oct 28). PRO_BILLING_ENABLED
  // now only decides whether a missing ledger is an error (billing on) or
  // simply "not Pro" (billing not set up yet, migration not run).
  const { data, error } = await admin.rpc('pro_access_status', { p_user_id: user.id });
  if (error || typeof data?.active !== 'boolean') {
    if (process.env.PRO_BILLING_ENABLED !== '1') return false;
    throw new Error('Pro entitlement unavailable');
  }
  return data.active;
}

/**
 * True when a user still carries the legacy client-writable flag. Used only for
 * logging, so genuinely-paying users granted the old way can be migrated rather
 * than silently downgraded.
 */
export function hasLegacyClientPremiumFlag(user) {
  return user?.user_metadata?.is_premium === true && user?.app_metadata?.is_premium !== true;
}
