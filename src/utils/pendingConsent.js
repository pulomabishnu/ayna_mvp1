// Shared by src/components/AuthGate.jsx (desktop) and
// src/mobile/hooks/useSupabaseAuth.js (mobile, native iOS Google sign-in) —
// one real consent-capture mechanism for every Google OAuth entry point,
// not a separate one per platform that can silently drift out of sync.
//
// WHY THIS EXISTS: Supabase's Google provider auto-provisions a real account
// for any unseen Google address the instant the OAuth redirect completes —
// before this app's own code runs again. The three consent checkboxes
// (health data is self-reported, AI processing, not medical advice) can only
// be shown and captured BEFORE that redirect leaves the page/app. So consent
// is stashed here right before redirecting, then flushed into the new
// account's user_metadata the moment a session exists on return — in BOTH
// the sign-in and sign-up UI modes, since a first-time visitor clicking
// "Sign in" still gets a real new account provisioned with no record of
// having agreed to anything if this were skipped.
export const CONSENT_VERSION = 'v1';
const STORAGE_KEY = 'ayna_pending_consent';

export function stashPendingConsent() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ consent_given_at: new Date().toISOString(), consent_version: CONSENT_VERSION })
    );
  } catch {
    // Private mode / storage unavailable — the account still gets created;
    // there is simply no earlier record to flush after the redirect.
  }
}

// Awaited, retried once, and the stash is cleared ONLY after the write
// succeeds — clearing first (an earlier version of this logic did) would
// erase the consent record from both places on a transient failure.
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
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await supabase.auth.updateUser({ data: consent });
      if (!error) {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        return;
      }
      console.error('[Ayna] consent write failed:', error.message);
    } catch (e) {
      console.error('[Ayna] consent write threw:', e);
    }
  }
  // Left in sessionStorage deliberately so a later load can retry.
  console.error('[Ayna] consent not persisted after retries. Record retained for retry');
}
