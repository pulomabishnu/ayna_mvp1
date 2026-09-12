/**
 * analyticsConsent.js
 *
 * Backs the ConsentBanner UI with a stored granted/denied decision (12-month
 * expiry) and applies it to the PostHog instance via opt_in_capturing() /
 * opt_out_capturing() — the same SDK calls src/components/AccountDataControls.jsx
 * uses for its "Usage analytics" settings toggle, and the same ones main.jsx
 * uses for Global Privacy Control (GPC).
 *
 * Deliberate choice: whether the BANNER shows is governed ONLY by this
 * module's own storage key, never by the SDK's underlying opt state. GPC (or
 * a stale/implicit opt-out from before this banner existed) can still set
 * PostHog's own consent state to "denied" — main.jsx's GPC branch does
 * exactly that — but that must not be read as "the banner already asked".
 * Every visitor gets the explicit banner once, including GPC senders; if
 * they click "Accept" that's a genuine, informed per-site choice that's
 * allowed to override GPC's default. (An earlier version of this module did
 * treat any prior explicit SDK-level decision as "already asked", which
 * silently suppressed the banner for anyone whose browser sends GPC — not
 * what we want: everyone should be asked.)
 *
 * NOTE ON WORDING: what this gates is analytics. It is NOT the Supabase
 * session, which lives in localStorage (not a cookie) and is genuinely
 * necessary for login to work. Anything user-facing should say "necessary
 * storage", never "necessary cookies" — this app sets no cookies.
 */

export const CONSENT_STORAGE_KEY = 'ayna_analytics_consent';
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function readRaw() {
  let raw;
  try {
    raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  if (raw === 'granted' || raw === 'denied') {
    // Pre-expiry format migration, if this ever shipped without a
    // timestamp — treat as decided now so it isn't instantly stale.
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

/** This banner's own stored decision. */
export function getStoredConsent() {
  const record = readRaw();
  if (!record || isExpired(record)) return undefined;
  return record.decision;
}

/**
 * Whether THIS banner has been answered. Intentionally checks nothing but
 * our own key — see the module comment above for why GPC/other SDK-level
 * state must not short-circuit this.
 */
export function hasRecordedChoice() {
  const v = getStoredConsent();
  return v === 'granted' || v === 'denied';
}

function persist(decision) {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision, timestamp: new Date().toISOString() })
    );
  } catch { /* private mode — the SDK-level opt-out below still applies */ }
}

/**
 * Called once from main.jsx's posthog.init `loaded` callback, for visitors
 * whose browser isn't sending GPC (main.jsx handles that case itself).
 * Always defaults to opted OUT — nothing is sent until the banner is
 * actually answered.
 */
export function applyStoredConsent(ph) {
  const stored = getStoredConsent();
  if (stored === 'granted') return ph.opt_in_capturing();
  return ph.opt_out_capturing(); // denied, or no decision yet — stay out until answered
}

export function grantConsent(ph) {
  persist('granted');
  ph.opt_in_capturing();
  ph.capture('$pageview');
}

export function denyConsent(ph) {
  persist('denied');
  ph.opt_out_capturing();
}
