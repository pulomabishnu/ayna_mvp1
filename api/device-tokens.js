/**
 * /api/device-tokens — register the calling device's push-notification token
 * against the authenticated Supabase user.
 *
 * Same auth pattern as notification-preferences.js: verifyUser() reads the
 * caller's Supabase JWT from Authorization: Bearer <token> — a user id is
 * never trusted from the request body. Reads/writes use the service-role
 * client in deployed environments, falling back to a caller-scoped client
 * (verifyUserWithRls) for local development without a service-role key; the
 * existing RLS policies then restrict every read/write to auth.uid() = user_id.
 *
 * POST registers a token; DELETE unlinks it (on sign-out). Sending lives in
 * api/_apns.js.
 */
/* global process */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { verifyUserWithRls } from './_userScopedSupabase.js';

const PLATFORMS = new Set(['ios', 'android']);

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let { user, error } = await verifyUser(req);
  let db = getAdmin();

  if (!user && error === 'server_misconfigured') {
    const fallback = await verifyUserWithRls(req);
    user = fallback.user;
    error = fallback.error;
    db = fallback.client;
  }

  if (!user) return res.status(401).json({ error });
  if (!db) return res.status(500).json({ error: 'server_misconfigured' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const deviceToken = typeof body?.deviceToken === 'string' ? body.deviceToken.trim() : '';
  const platform = body?.platform;

  if (!deviceToken) return res.status(400).json({ error: 'device_token_required' });

  // Sign-out: unlink this phone so it stops getting this account's alerts.
  if (req.method === 'DELETE') {
    const { error: delError } = await db.from('device_tokens').delete().eq('user_id', user.id).eq('device_token', deviceToken);
    if (delError) {
      console.error('[device-tokens] delete error:', delError.message);
      return res.status(500).json({ error: 'delete_failed' });
    }
    return res.status(200).json({ ok: true });
  }

  if (!PLATFORMS.has(platform)) return res.status(400).json({ error: 'invalid_platform' });

  // Upsert on device_token (not user_id): the token identifies one physical
  // device+app install, not one account. Signing out and into a different
  // account on the same device must reassign this row's user_id rather than
  // fail on the unique constraint or leave a stale row behind.
  const { data, error: upsertError } = await db
    .from('device_tokens')
    .upsert(
      { user_id: user.id, device_token: deviceToken, platform, updated_at: new Date().toISOString() },
      { onConflict: 'device_token' },
    )
    .select('id, platform, created_at, updated_at')
    .single();

  if (upsertError) {
    console.error('[device-tokens] upsert error:', upsertError.message);
    return res.status(500).json({ error: 'save_failed' });
  }

  return res.status(200).json({
    id: data.id,
    platform: data.platform,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
