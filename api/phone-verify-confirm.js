/**
 * /api/phone-verify-confirm — Confirm the self-issued OTP (see
 * api/phone-verify-send.js) and persist the verified phone number for the
 * authenticated user.
 */
/* global process */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';

const MAX_ATTEMPTS = 5;

// Scoped to the caller's own JWT so Postgres RLS (not this code) enforces
// "only your own row" — avoids touching the service-role key for writes
// that are already constrained to the authenticated user.
function getUserScopedClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function normalizeE164(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function maskedTail(phoneNumber) {
  return `***${phoneNumber.slice(-4)}`;
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

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const phoneNumber = normalizeE164(body?.phoneNumber);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!phoneNumber) return res.status(400).json({ error: 'invalid_phone_number' });
  if (!code) return res.status(400).json({ error: 'code_required' });

  const { data: pending, error: fetchError } = await userClient
    .from('pending_phone_verifications')
    .select('phone_number, code_hash, expires_at, attempts')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[phone-verify-confirm] fetch error:', fetchError.message);
    return res.status(500).json({ error: 'verify_failed' });
  }

  if (!pending || pending.phone_number !== phoneNumber) {
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await userClient.from('pending_phone_verifications').delete().eq('user_id', user.id);
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  if (hashCode(code, user.id) !== pending.code_hash) {
    await userClient
      .from('pending_phone_verifications')
      .update({ attempts: pending.attempts + 1 })
      .eq('user_id', user.id);
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }

  const { error: upsertError } = await userClient
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

  await userClient.from('pending_phone_verifications').delete().eq('user_id', user.id);

  console.log(`[phone-verify-confirm] verified for user ${user.id}: ${maskedTail(phoneNumber)}`);
  return res.status(200).json({ ok: true, phoneNumber });
}
