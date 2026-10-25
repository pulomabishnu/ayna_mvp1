/**
 * Google / Apple sign-in auto-creates an account for any address Supabase has
 * not seen, even from the "Sign in" form. Accounts are meant to be made only
 * in the save step after the quiz, so this is the client-side mitigation:
 *
 *  - right before the OAuth redirect, remember where it started:
 *      'save'   = the post-quiz save flow (expected to create an account)
 *      'free-product' = the free product page (a new account is expected:
 *                       she goes straight back to the campaign, not the quiz)
 *      'signin' = any other sign-in form
 *  - after the return trip, once her saved data has loaded, a 'signin' that
 *    produced a brand-new, empty account gets a friendly
 *    "Let's build your ecosystem first" step that starts the quiz.
 */
const KEY = 'ayna_oauth_source_v1';
const MAX_AGE_MS = 30 * 60 * 1000;
const NEW_ACCOUNT_MS = 15 * 60 * 1000;

export function markOAuthSource(source) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ source: source === 'save' || source === 'free-product' ? source : 'signin', at: Date.now() }));
  } catch { /* storage unavailable: the step just won't show */ }
}

/** Read once and clear. null when nothing (fresh) was stashed. */
export function takeOAuthSource(now = Date.now()) {
  let raw = null;
  try {
    raw = window.localStorage.getItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch { return null; }
  try {
    const parsed = JSON.parse(raw || 'null');
    if (!parsed?.source || !(now - parsed.at < MAX_AGE_MS)) return null;
    return parsed.source;
  } catch { return null; }
}

export function isBrandNewAccount(user, now = Date.now()) {
  const created = Date.parse(user?.created_at || '');
  return Number.isFinite(created) && now - created >= -60 * 1000 && now - created < NEW_ACCOUNT_MS;
}

export function shouldOfferEcosystemStart({ user, source, hasIntake = false, productCount = 0, now = Date.now() } = {}) {
  if (source !== 'signin' || !user?.id) return false;
  if (hasIntake || productCount > 0) return false;
  return isBrandNewAccount(user, now);
}
