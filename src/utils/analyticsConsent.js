/**
 * analyticsConsent.js
 *
 * Backs the ConsentBanner UI with a stored granted/denied decision (12-month
 * expiry) and applies it to the PostHog instance via opt_in_capturing() /
 * opt_out_capturing() — the same SDK calls src/components/AccountDataControls.jsx
 * already uses for its "Usage analytics" settings toggle, and the same ones
 * main.jsx already uses for Global Privacy Control (GPC). All three paths
 * (banner, account settings, GPC) converge on that one SDK-level opt state,
 * so whichever one a visitor used last is the one that sticks.
 *
 * Because of that shared state, this module treats "the SDK already has an
 * explicit opt-in/opt-out on record" as equivalent to "the banner has already
 * been answered" — see hasRecordedChoice()/applyStoredConsent() below. That
 * matters for anyone who used the account-settings toggle (or whose browser
 * sends GPC) before ever seeing this banner: they should not be asked again.
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

/** This banner's own stored decision, ignoring any other opt state. */
export function getStoredConsent() {
  const record = readRaw();
  if (!record || isExpired(record)) return undefined;
  return record.decision;
}

/**
 * Whether there's any reason NOT to show the banner: our own stored
 * decision, or an explicit PostHog SDK-level opt-in/opt-out already on
 * record (set via the account-settings toggle or GPC, possibly before this
 * banner ever existed). `ph` is optional — omit it to check only our own key.
 */
export function hasRecordedChoice(ph) {
  const v = getStoredConsent();
  if (v === 'granted' || v === 'denied') return true;
  try {
    return !!(ph?.has_opted_in_capturing?.() || ph?.has_opted_out_capturing?.());
  } catch {
    return false;
  }
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
 * Called once from main.jsx's posthog.init `loaded` callback (after the GPC
 * check there, which takes priority). Defaults to opted OUT — nothing is
 * sent until the visitor actively consents — unless a decision already
 * exists, from this banner or from elsewhere (see hasRecordedChoice above).
 */
export function applyStoredConsent(ph) {
  const stored = getStoredConsent();
  if (stored === 'granted') return ph.opt_in_capturing();
  if (stored === 'denied') return ph.opt_out_capturing();

  try {
    if (ph.has_opted_in_capturing?.() || ph.has_opted_out_capturing?.()) return; // already decided elsewhere — leave it
  } catch { /* fall through to the safe default below */ }

  ph.opt_out_capturing(); // truly undecided — stay out until the banner is answered
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
