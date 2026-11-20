import posthog from 'posthog-js';

/**
 * Signup / login funnel (Nov 19, analytics gap report P0).
 * Answers: how many people try to sign up or log in, how many fail and why
 * (a short reason bucket, never the raw error text), and how often people
 * reset passwords, resend codes or log out.
 *
 * Privacy: no email, no password, no raw error message. Only the method
 * (email / google / apple / phone), the surface and a reason bucket.
 * `signed_up` and `email_verified` already live in analyticsIdentity.js.
 */
export const AUTH_EVENTS = Object.freeze({
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_FAILED: 'signup_failed',
  LOGIN_STARTED: 'login_started',
  LOGIN_SUCCEEDED: 'login_succeeded',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  VERIFICATION_EMAIL_RESENT: 'verification_email_resent',
  VERIFICATION_CODE_FAILED: 'verification_code_failed',
  LOGOUT_COMPLETED: 'logout_completed',
});

const METHODS = new Set(['email', 'google', 'apple', 'phone']);
const SURFACES = new Set(['web', 'app']);

/** Turn any auth error into a short, privacy-safe reason bucket (exported for tests). */
export function authErrorCode(err) {
  if (!err) return 'unknown';
  if (typeof err === 'string') return err.slice(0, 40);
  const code = String(err.code || '').toLowerCase();
  const msg = String(err.message || '').toLowerCase();
  const status = Number(err.status) || 0;
  if (code === 'email_already_exists' || code === 'user_already_exists' || /already (registered|exists)/.test(msg)) return 'already_exists';
  if (code === 'email_not_confirmed' || /email not confirmed/.test(msg)) return 'email_not_confirmed';
  if (code === 'invalid_credentials' || /invalid login credentials/.test(msg)) return 'invalid_credentials';
  if (code === 'otp_expired' || /expired/.test(msg)) return 'code_expired';
  if (/invalid (otp|token|code)|token has expired or is invalid/.test(msg)) return 'code_invalid';
  if (status === 429 || code.includes('rate_limit') || /rate limit|too many/.test(msg)) return 'rate_limited';
  if (code === 'weak_password' || /password should be|weak password/.test(msg)) return 'weak_password';
  if (/network|failed to fetch|load failed|timeout/.test(msg)) return 'network';
  if (/not configured|unavailable/.test(msg)) return 'not_configured';
  if (status >= 500) return 'server_error';
  return 'unknown';
}

/** Keep only allowed, safe properties (exported for tests). */
export function authEventProps({ method, surface, reason, mode } = {}) {
  const out = {};
  if (METHODS.has(method)) out.method = method;
  if (SURFACES.has(surface)) out.surface = surface;
  if (mode === 'signup' || mode === 'signin') out.mode = mode;
  if (typeof reason === 'string' && /^[a-z_]{1,40}$/.test(reason)) out.reason = reason;
  return out;
}

let client = posthog;
/** Tests swap the client. */
export function setAuthAnalyticsClient(c) { client = c || posthog; }

export function trackAuth(event, props = {}) {
  if (!Object.values(AUTH_EVENTS).includes(event)) return;
  try { client.capture(event, authEventProps(props)); } catch { /* analytics never blocks sign-in */ }
}

/** Convenience: a failure event with the reason bucket worked out from the error. */
export function trackAuthFailure(event, err, props = {}) {
  trackAuth(event, { ...props, reason: authErrorCode(err) });
}
