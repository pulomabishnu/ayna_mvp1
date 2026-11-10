/**
 * analyticsConsent.js
 *
 * Optional product analytics are OFF by default. The first pageview is
 * captured only after explicit opt-in; GPC is honored synchronously. Consent
 * decisions persist and can be changed from account/privacy controls.
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
  } catch { /* not JSON, treat as no decision */ }
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

  // A stale grant expires to default-off, asking the user again.
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
  } catch { /* private mode, the SDK-level state still applies */ }
}

/**
 * Called after PostHog initialises with capture disabled unless a valid grant
 * already exists. An undecided visitor must remain pending, not get an
 * implicit SDK opt-out that could hide the consent choice.
 */
export function applyStoredConsent(ph) {
  const stored = getStoredConsent();
  if (stored === 'granted') return ph.opt_in_capturing();
  if (stored === 'denied') return ph.opt_out_capturing();

  if (explicitSdkDecision(ph) !== undefined) return;

  // No explicit action: capture remains off and the consent bar stays visible.
}

/** Explicit opt-in from the consent banner; record the first consented view. */
export function acknowledgeAnalytics(ph) {
  grantConsent(ph);
}

/** Explicit opt-in used by settings controls when re-enabling analytics. */
export function grantConsent(ph) {
  persist('granted');
  ph.opt_in_capturing();
  ph.capture('$pageview');
}

/**
 * The footer's "Privacy choices" link: reopens the consent banner (it
 * listens for this event), even after a choice was made, so anyone, signed
 * in or not, can change their mind.
 */
export const PRIVACY_CHOICES_EVENT = 'ayna:privacy-choices';
export function openPrivacyChoices() {
  try { window.dispatchEvent(new Event(PRIVACY_CHOICES_EVENT)); } catch { /* no window */ }
}

/** Explicit opt-out used by the notice and privacy/account controls. */
export function denyConsent(ph) {
  persist('denied');
  ph.opt_out_capturing();
}

/**
 * GLOBAL PRIVACY CONTROL (GPC), REGION-SCOPED: honored only where a state's
 * privacy law actually mandates it (see isMandatoryGpcVisitor() below and
 * api/_gpcRegions.js for the state list and its legal caveats), not for
 * every GPC-sending browser everywhere. GPC's legal scope is narrow, an
 * opt-out of "sale"/"sharing" of personal information, and this app's
 * analytics is neither. main.jsx starts every GPC sender opted out
 * synchronously (safe default, since we can't know their region yet at
 * init time), then asynchronously confirms via isMandatoryGpcVisitor(): if
 * their state doesn't actually require honoring GPC, they're switched to
 * the same default-on state as everyone else.
 */

/** Sync, reads the browser's own signal, no network call. */
export function isGpcActive() {
  try {
    return typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
  } catch {
    return false;
  }
}

let mandatoryRegionPromise = null;

/**
 * Asks /api/gpc-region whether this visitor is in a state that legally
 * mandates honoring GPC. Cached at module scope. FAILS CLOSED (resolves
 * true) on any error, non-OK response, or timeout, see the fail-closed
 * rationale in api/gpc-region.js.
 */
function checkMandatoryGpcRegion() {
  if (mandatoryRegionPromise) return mandatoryRegionPromise;
  mandatoryRegionPromise = (async () => {
    const hasAbort = typeof AbortController !== 'undefined';
    const controller = hasAbort ? new AbortController() : undefined;
    const timeoutId = hasAbort ? setTimeout(() => controller.abort(), 2500) : undefined;
    try {
      const res = await fetch('/api/gpc-region', { signal: controller?.signal });
      if (!res.ok) return true;
      const data = await res.json();
      return data?.mandatory !== false; // fail closed unless explicitly told otherwise
    } catch {
      return true; // network error, timeout, blocked by an extension, etc.
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  })();
  return mandatoryRegionPromise;
}

/**
 * Is this visitor someone GPC must be honored for? False immediately (no
 * network call) if GPC isn't active at all, the region check only ever
 * runs for the minority of visitors whose browser actually sends the
 * signal.
 * @returns {Promise<boolean>}
 */
export async function isMandatoryGpcVisitor() {
  if (!isGpcActive()) return false;
  return checkMandatoryGpcRegion();
}

/** Test-only: clears the module-scope region cache between test cases. */
export function _resetMandatoryGpcCacheForTests() {
  mandatoryRegionPromise = null;
}
