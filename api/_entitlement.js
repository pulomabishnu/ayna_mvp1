/* global process */
/**
 * Single source of truth for paid entitlement.
 *
 * SECURITY: this MUST read `app_metadata`, never `user_metadata`.
 *
 * In Supabase, `user_metadata` (raw_user_meta_data) is writable by the end user
 * with their own session`supabase.auth.updateUser({ data: {...} })`. This app
 * already ships supabase-js to the browser and already calls updateUser (see
 * src/components/AuthCallback.jsx), so granting yourself premium was one line in
 * the devtools console:
 *
 *     await supabase.auth.updateUser({ data: { is_premium: true } })
 *
 * That bypassed every quota check in llm-recommendations, product-insights and
 * product-chat, and skipped the usage counter entirely, so the abuse was also
 * invisible in user_ai_usage.
 *
 * `app_metadata` is writable only with the service-role key (or the Admin API),
 * so it is safe to trust server-side.
 *
 * TO GRANT PREMIUM (server-side / SQL editor, never from the browser):
 *   await admin.auth.admin.updateUserById(userId, { app_metadata: { is_premium: true } })
 */
export function isPremiumUser(user) {
  return user?.app_metadata?.is_premium === true;
}

/**
 * True when a user still carries the legacy client-writable flag. Used only for
 * logging, so genuinely-paying users granted the old way can be migrated rather
 * than silently downgraded.
 */
export function hasLegacyClientPremiumFlag(user) {
  return user?.user_metadata?.is_premium === true && user?.app_metadata?.is_premium !== true;
}

/** Live purchase ledger, in addition to existing staff/admin grants. */
export async function hasPremiumAccess(user, admin) {
  if (isPremiumUser(user)) return true;
  // Older deployments without billing configured retain their existing quotas.
  if (process.env.PRO_BILLING_ENABLED !== '1') return false;
  const { data, error } = await admin.rpc('pro_access_status', { p_user_id: user.id });
  if (error || typeof data?.active !== 'boolean') throw new Error('Pro entitlement unavailable');
  return data.active;
}
