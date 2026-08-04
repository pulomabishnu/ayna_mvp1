/* global process, Buffer */
import crypto from 'crypto';

/**
 * OTP hashing.
 *
 * The previous scheme was `sha256(`${userId}:${code}`)` with no server secret,
 * stored in a table whose RLS policy let the row's owner SELECT it. Since an
 * attacker starts verification for the VICTIM's number under their OWN user_id,
 * the row — and therefore the hash — was theirs to read, and the input space is
 * 10^6 with a known user_id. Measured recovery time: under 2 seconds on a
 * laptop. The attacker then confirmed the code and bound someone else's phone
 * number to their account.
 *
 * Two changes make that infeasible:
 *   1. HMAC with a server-side pepper, so the hash cannot be attacked offline
 *      without also stealing an environment secret.
 *   2. The SELECT policy is dropped (see supabase/pending_phone_verifications.sql)
 *      and the server reads the row with the service-role key instead.
 */

let warnedAboutFallback = false;

function pepper() {
  const explicit = (process.env.OTP_PEPPER || '').trim();
  if (explicit) return explicit;
  // Fall back to another server-only secret rather than failing verification
  // outright, so this does not lock users out on deploy. Still warn: the pepper
  // should be its own value so it can be rotated independently.
  const fallback = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (fallback) {
    if (!warnedAboutFallback) {
      console.warn('[otp] OTP_PEPPER is not set — deriving from SUPABASE_SERVICE_ROLE_KEY. Set OTP_PEPPER to a dedicated random value.');
      warnedAboutFallback = true;
    }
    return `otp-derived:${fallback}`;
  }
  throw new Error('OTP_PEPPER (or SUPABASE_SERVICE_ROLE_KEY) must be set to hash verification codes');
}

export function hashCode(code, userId) {
  return crypto.createHmac('sha256', pepper()).update(`${userId}:${code}`).digest('hex');
}

/** Constant-time compare so the check cannot be attacked by timing. */
export function codeMatches(code, userId, storedHash) {
  const expected = Buffer.from(hashCode(code, userId), 'utf8');
  const actual = Buffer.from(String(storedHash || ''), 'utf8');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/**
 * Normalize to E.164, restricted to an allowlist of country calling codes.
 *
 * The old version accepted any `+[1-9]\d{6,14}`, so an attacker could point the
 * send endpoint at premium-rate international ranges they control (IRSF) and
 * bill it to the Twilio account. Defaults to US/Canada only; widen with
 * SMS_ALLOWED_COUNTRY_CODES when the product actually ships elsewhere.
 */
export function normalizeE164(raw) {
  if (typeof raw !== 'string') return null;
  const allowed = (process.env.SMS_ALLOWED_COUNTRY_CODES || '1')
    .split(',').map((c) => c.trim()).filter(Boolean);

  const trimmed = raw.trim();
  let e164 = null;
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) {
    e164 = trimmed;
  } else {
    const digits = trimmed.replace(/[^\d]/g, '');
    if (digits.length === 10) e164 = `+1${digits}`;
    else if (digits.length === 11 && digits.startsWith('1')) e164 = `+${digits}`;
  }
  if (!e164) return null;
  if (!allowed.some((cc) => e164.startsWith(`+${cc}`))) return null;
  return e164;
}

export function maskedTail(phoneNumber) {
  return `***${String(phoneNumber || '').slice(-4)}`;
}
