/* global process */
/**
 * One server-side admin check for every admin route (/api/reviews-admin,
 * /api/campaign-admin, /api/research-product). The /admin pages hide their UI
 * from other people, but the UI is not the gate: these routes are.
 *
 * Admin = a signed-in, non-guest account whose CONFIRMED email is in
 * ADMIN_EMAILS (plus CAMPAIGN_TEAM_EMAIL for the campaign routes). Both env
 * vars empty means nobody is an admin (fail closed).
 *
 * Why email_confirmed_at: if Supabase "Confirm email" is ever off, or a listed
 * address has never signed up, anyone could create an account with that
 * address and pass a plain string match. Requiring the confirmation timestamp
 * (set by Supabase only after the inbox owner clicks the link, or by Apple /
 * Google sign-in) closes that.
 */

function list(...names) {
  return names
    .map((n) => String(process.env[n] || ''))
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Pure allowlist match (no confirmation check). Prefer isAdminUser. */
export function isAdminEmail(email, { includeCampaignTeam = false } = {}) {
  if (!email) return false;
  const allow = includeCampaignTeam ? list('ADMIN_EMAILS', 'CAMPAIGN_TEAM_EMAIL') : list('ADMIN_EMAILS');
  return allow.includes(String(email).trim().toLowerCase());
}

/** True only for a confirmed, non-anonymous account on the allowlist. */
export function isAdminUser(user, opts = {}) {
  if (!user || user.is_anonymous) return false;
  // Not `confirmed_at`: Supabase sets that when the PHONE is confirmed too.
  if (!user.email_confirmed_at) return false;
  return isAdminEmail(user.email, opts);
}
