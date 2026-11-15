/**
 * What a failed sign-in says (Nov 14 check of "manual sign-in not reliable", UCLA 10/1): a timeout or
 * server error came back from Supabase as the text "{}". Anything empty, JSON-looking or a bare status
 * becomes the plain fallback.
 */
export function authErrorText(err, fallback) {
  const m = String(err?.message ?? '').trim();
  if (!m || /^[[{]/.test(m) || /^(fetch failed|failed to fetch|load failed|network ?error|\d{3})$/i.test(m) || Number(err?.status) >= 500) return fallback;
  if (/invalid login credentials/i.test(m)) return 'That email and password don’t match. Try again, or reset your password.';
  return m;
}
