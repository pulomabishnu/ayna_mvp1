// Shared consent metadata for email/password, Google OAuth and Apple sign-in.
// A consent timestamp must represent a real affirmative user action. Callers
// must never stash or write this metadata merely because an OAuth button was
// clicked.
export const CONSENT_VERSION = 'v2';
const STORAGE_KEY = 'ayna_pending_consent';

function currentConsentRecord() {
  return { consent_given_at: new Date().toISOString(), consent_version: CONSENT_VERSION };
}

export function hasCurrentConsent(user) {
  const meta = user?.user_metadata || {};
  return meta.consent_version === CONSENT_VERSION && Boolean(meta.consent_given_at);
}

/**
 * Stash consent only after the visible consent controls were affirmatively
 * accepted immediately before an OAuth redirect. The stash is short-lived
 * session storage and contains no health data.
 */
export function stashPendingConsent() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentConsentRecord()));
  } catch {
    // Storage unavailable: the post-login consent gate will still require the
    // current consent version before AI-powered features can be used.
  }
}

export function clearPendingConsent() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export async function grantCurrentUserConsent(supabase) {
  if (!supabase) throw new Error('Sign-in is not configured right now.');
  const record = currentConsentRecord();
  const { data, error } = await supabase.auth.updateUser({ data: record });
  if (error) throw error;
  clearPendingConsent();
  return data?.user || null;
}

// Awaited, retried once, and cleared ONLY after the write succeeds. This is
// used only when consent was affirmatively collected before an OAuth redirect.
export async function flushPendingConsent(supabase) {
  let raw = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let consent;
  try {
    consent = JSON.parse(raw);
  } catch {
    clearPendingConsent();
    return;
  }

  if (consent?.consent_version !== CONSENT_VERSION || !consent?.consent_given_at) {
    clearPendingConsent();
    return;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await supabase.auth.updateUser({ data: consent });
      if (!error) {
        clearPendingConsent();
        return;
      }
      console.error('[Ayna] consent metadata write failed:', error.message);
    } catch (e) {
      console.error('[Ayna] consent metadata write failed:', e?.message || 'unknown error');
    }
  }
  // Retain the affirmative record in this browser session so a later load can retry.
  console.error('[Ayna] consent metadata could not be persisted after retries');
}
