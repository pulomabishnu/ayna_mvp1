/**
 * /api/phone-verify-send — Start phone verification for the authenticated user.
 *
 * Uses plain Twilio SMS + a self-issued peppered OTP (stored in
 * pending_phone_verifications) instead of the Twilio Verify product, since
 * Verify Services require an upgraded/approved account that trial accounts
 * often can't provision.
 *
 * The pending row is written with the SERVICE-ROLE key, not the caller's JWT:
 * the table's SELECT policy has been dropped so `code_hash` is never readable
 * by the client. Ownership is still enforced — user.id comes from the verified
 * token and every query is scoped to it.
 */
/* global process */
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { rateLimit, getClientIp } from './_rateLimit.js';
import { hashCode, generateCode, normalizeE164, maskedTail } from './_otp.js';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const phoneNumber = normalizeE164(body?.phoneNumber);
  if (!phoneNumber) return res.status(400).json({ error: 'invalid_phone_number' });

  // Durable and fail-closed: every send costs real money, and an in-process
  // Map cannot rate limit a serverless function (each cold isolate starts
  // empty, so "3/hour" became "3/hour per isolate"). Limited on three axes so
  // neither one account, one target handset, nor one source can be hammered.
  for (const [key, max, windowSec] of [
    [`sms:send:user:${user.id}`, 3, 3600],
    [`sms:send:to:${phoneNumber}`, 3, 3600],
    [`sms:send:ip:${getClientIp(req)}`, 10, 3600],
  ]) {
    const rl = await rateLimit(key, { max, windowSec, failClosed: true });
    if (!rl.ok) {
      res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
      return res.status(429).json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSec || 60 });
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'sms_not_configured' });
  }

  const admin = getAdmin();
  if (!admin) return res.status(500).json({ error: 'server_misconfigured' });

  const code = generateCode();

  // PERSIST BEFORE SENDING. The old order sent the SMS first, so a failed write
  // meant the user was billed for a code that could never validate — and every
  // retry burned another message with a 0% chance of succeeding.
  const { error: upsertError } = await admin
    .from('pending_phone_verifications')
    .upsert(
      {
        user_id: user.id,
        phone_number: phoneNumber,
        code_hash: hashCode(code, user.id),
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        attempts: 0,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('[phone-verify-send] save error:', upsertError.message);
    return res.status(500).json({ error: 'save_failed' });
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      to: phoneNumber,
      from: fromNumber,
      body: `Your Ayna verification code is ${code}. It expires in 10 minutes.`,
    });
  } catch (e) {
    console.error('[phone-verify-send] Twilio error:', e?.message);
    // Roll the row back so a stale hash isn't left sitting around.
    await admin.from('pending_phone_verifications').delete().eq('user_id', user.id);
    return res.status(502).json({ error: 'twilio_send_failed' });
  }

  console.log(`[phone-verify-send] code sent for user ${user.id} to ${maskedTail(phoneNumber)}`);
  return res.status(200).json({ ok: true });
}
