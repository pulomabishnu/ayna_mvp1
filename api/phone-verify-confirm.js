/**
 * /api/phone-verify-confirm — Confirm the self-issued OTP (see
 * api/phone-verify-send.js) and persist the verified phone number.
 *
 * The pending row is read/written with the SERVICE-ROLE key so `code_hash` is
 * never exposed to the client (its SELECT policy has been dropped). Ownership
 * comes from the verified JWT, and every query is scoped to that user id.
 */
/* global process */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { rateLimit, getClientIp } from './_rateLimit.js';
import { codeMatches, normalizeE164, maskedTail } from './_otp.js';

const MAX_ATTEMPTS = 5;

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error } = await verifyUser(req);
  if (!user) return res.status(401).json({ error });

  // The confirm endpoint previously had NO rate limit at all — the only brake
  // was an `attempts` column updated via a racy read-modify-write, so N
  // parallel guesses all read the same value and all wrote n+1. That left the
  // full 10^6 keyspace open for the code's 10-minute lifetime.
  const rl = await rateLimit(`otp:confirm:user:${user.id}`, { max: 10, windowSec: 600, failClosed: false });
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
    return res.status(429).json({ error: 'too_many_attempts', retryAfterSeconds: rl.retryAfterSec || 60 });
  }
  const ipRl = await rateLimit(`otp:confirm:ip:${getClientIp(req)}`, { max: 30, windowSec: 600, failClosed: false });
  if (!ipRl.ok) {
    res.setHeader('Retry-After', String(ipRl.retryAfterSec || 60));
    return res.status(429).json({ error: 'too_many_attempts', retryAfterSeconds: ipRl.retryAfterSec || 60 });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const phoneNumber = normalizeE164(body?.phoneNumber);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!phoneNumber) return res.status(400).json({ error: 'invalid_phone_number' });
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'code_required' });

  const admin = getAdmin();
  if (!admin) return res.status(500).json({ error: 'server_misconfigured' });

  // Atomic: increments attempts and returns the row in one statement, so
  // concurrent guesses cannot all observe the same pre-increment value.
  const { data: claimRows, error: claimError } = await admin.rpc('claim_otp_attempt', {
    p_user_id: user.id,
    p_max_attempts: MAX_ATTEMPTS,
  });
  if (claimError) {
    console.error('[phone-verify-confirm] claim_otp_attempt error:', claimError.message);
    return res.status(500).json({ error: 'verify_failed' });
  }
  const pending = Array.isArray(claimRows) ? claimRows[0] : claimRows;

  if (!pending || !pending.found) {
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }
  if (pending.locked_out) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }
  if (pending.expired) {
    await admin.from('pending_phone_verifications').delete().eq('user_id', user.id);
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }
  if (pending.phone_number !== phoneNumber) {
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }

  if (!codeMatches(code, user.id, pending.code_hash)) {
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }

  const { error: upsertError } = await admin
    .from('phone_numbers')
    .upsert(
      {
        user_id: user.id,
        phone_number: phoneNumber,
        is_verified: true,
        sms_opted_out: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('[phone-verify-confirm] upsert error:', upsertError.message);
    if (upsertError.code === '23505') {
      return res.status(409).json({ error: 'phone_already_linked' });
    }
    return res.status(500).json({ error: 'save_failed' });
  }

  const { error: deleteError } = await admin
    .from('pending_phone_verifications').delete().eq('user_id', user.id);
  if (deleteError) {
    // Not fatal, but a surviving row keeps the (now-used) code replayable
    // until it expires, so it must not be silent.
    console.error('[phone-verify-confirm] failed to clear pending row:', deleteError.message);
  }

  console.log(`[phone-verify-confirm] verified for user ${user.id}: ${maskedTail(phoneNumber)}`);
  return res.status(200).json({ ok: true, phoneNumber });
}
