/**
 * analyticsConsent.js
 *
 * Product analytics are on by default, with a persistent visitor opt-out.
 * Global Privacy Control is enforced in main.jsx before PostHog can emit an
 * initial pageview. Account settings and this notice use the same PostHog SDK
 * opt state, so a visitor can change the choice at any time.
 *
 * This controls analytics only. It does not control the Supabase session or
 * necessary local storage used for authentication.
 */

export const CONSENT_STORAGE_KEY = 'ayna_analytics_consent';
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Return an explicit prior SDK-level decision ('granted'/'denied'), or
 * undefined if none has ever been made. get_explicit_consent_status() is used
 * because it distinguishes a real decision from PostHog's default state.
 */
function explicitSdkDecision(ph) {
  try {
    const status = ph?.get_explicit_consent_status?.();
    if (status === 'granted' || status === 'denied') return status;
  } catch { /* fall through */ }
  return undefined;
}

function readRaw() {
  let raw;
  try {
    raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  if (raw === 'granted' || raw === 'denied') {
    const migrated = { decision: raw, timestamp: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(migrated)); } catch { /* private mode */ }
    return migrated;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.decision === 'granted' || parsed.decision === 'denied') && parsed.timestamp) {
      return parsed;
    }
  } catch { /* not JSON — treat as no decision */ }
  return null;
}

function isExpired(record) {
  const ts = Date.parse(record.timestamp);
  return Number.isNaN(ts) || Date.now() - ts > CONSENT_TTL_MS;
}

/** This notice's stored preference, ignoring any other SDK opt state. */
export function getStoredConsent() {
  const record = readRaw();
  if (!record) return undefined;

  // An opt-out is a privacy preference, not a temporary consent grant. Never
  // silently turn analytics back on because a timestamp aged out.
  if (record.decision === 'denied') return 'denied';

  // A stale grant may expire back to the product's default-on state without
  // changing behavior or suppressing a fresh notice forever.
  if (isExpired(record)) return undefined;
  return record.decision;
}

/**
 * Whether the visitor has already made an explicit choice through this notice,
 * account controls, GPC, or another PostHog opt-state surface.
 */
export function hasRecordedChoice(ph) {
  const v = getStoredConsent();
  if (v === 'granted' || v === 'denied') return true;
  return explicitSdkDecision(ph) !== undefined;
}

function persist(decision) {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision, timestamp: new Date().toISOString() })
    );
  } catch { /* private mode — the SDK-level state still applies */ }
}

/**
 * Called once from main.jsx's PostHog loaded callback. Analytics is on by
 * default unless the visitor previously opted out. GPC is handled in main.jsx
 * before this runs and always takes priority.
 */
export function applyStoredConsent(ph) {
  const stored = getStoredConsent();
  if (stored === 'granted') return ph.opt_in_capturing();
  if (stored === 'denied') return ph.opt_out_capturing();

  if (explicitSdkDecision(ph) !== undefined) return;

  ph.opt_in_capturing();
}

/** Persist acknowledgement of the default-on analytics notice. */
export function acknowledgeAnalytics(ph) {
  persist('granted');
  ph.opt_in_capturing();
}

/** Explicit opt-in used by settings controls when re-enabling analytics. */
export function grantConsent(ph) {
  persist('granted');
  ph.opt_in_capturing();
  ph.capture('$pageview');
}

/** Explicit opt-out used by the notice and privacy/account controls. */
export function denyConsent(ph) {
  persist('denied');
  ph.opt_out_capturing();
}
