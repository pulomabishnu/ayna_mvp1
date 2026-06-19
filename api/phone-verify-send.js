/**
 * /api/phone-verify-send — Start phone verification for the authenticated user.
 *
 * Uses plain Twilio SMS + a self-issued hashed OTP (stored in
 * pending_phone_verifications) instead of the Twilio Verify product, since
 * Verify Services require an upgraded/approved account that trial accounts
 * often can't provision. Same security shape: short-lived code, hashed at
 * rest, capped attempts, rate-limited sends.
 */
/* global process */
import crypto from 'crypto';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';

// Scoped to the caller's own JWT so Postgres RLS (not this code) enforces
// "only your own row" — avoids touching the service-role key for a write
// that's already constrained to the authenticated user.
function getUserScopedClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** @type {Map<string, { start: number, count: number }>} */
const attemptBuckets = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  let b = attemptBuckets.get(userId);
  if (!b || now - b.start >= RATE_LIMIT_WINDOW_MS) {
    attemptBuckets.set(userId, { start: now, count: 1 });
    return false;
  }
  if (b.count >= RATE_LIMIT_MAX) return true;
  b.count += 1;
  return false;
}

function normalizeE164(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // Accept already-E.164, or a US 10-digit number we can prefix with +1
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function maskedTail(phoneNumber) {
  return `***${phoneNumber.slice(-4)}`;
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashCode(code, userId) {
  return crypto.createHash('sha256').update(`${userId}:${code}`).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error } = await verifyUser(req);
  if (!user) return res.status(401).json({ error });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const userClient = getUserScopedClient(token);

  if (isRateLimited(user.id)) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const phoneNumber = normalizeE164(body?.phoneNumber);
  if (!phoneNumber) return res.status(400).json({ error: 'invalid_phone_number' });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'sms_not_configured' });
  }

  const code = generateCode();

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      to: phoneNumber,
      from: fromNumber,
      body: `Your Ayna verification code is ${code}. It expires in 10 minutes.`,
    });
  } catch (e) {
    console.error('[phone-verify-send] Twilio error:', e?.message);
    return res.status(502).json({ error: 'twilio_send_failed' });
  }

  const { error: upsertError } = await userClient
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

  console.log(`[phone-verify-send] code sent for user ${user.id} to ${maskedTail(phoneNumber)}`);
  return res.status(200).json({ ok: true });
}
