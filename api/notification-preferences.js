/**
 * /api/notification-preferences — GET/PATCH the authenticated user's
 * notification + delivery preferences ("How Ayna reaches you").
 *
 * Same auth pattern as phone-verify-send/confirm: verifyUser() reads the
 * caller's Supabase JWT from Authorization: Bearer <token> — a user id is
 * never trusted from the request body. Reads/writes use the service-role
 * client in deployed environments. Local development can fall back to a
 * caller-scoped Supabase client using the public key; the existing RLS
 * policies then restrict every read/write to auth.uid() = user_id.
 */
/* global process */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { verifyUserWithRls } from './_userScopedSupabase.js';

const DELIVERY_CHANNELS = new Set(['push', 'sms', 'email']);
const BOOLEAN_FIELDS = ['notifications_enabled', 'updates_enabled', 'night_mode_enabled', 'newsletter_enabled'];

const DEFAULT_PREFERENCES = {
  notifications_enabled: true,
  updates_enabled: true,
  night_mode_enabled: false,
  newsletter_enabled: false,
  delivery_channel: 'push',
};

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

async function isPhoneVerified(admin, userId) {
  const { data } = await admin
    .from('phone_numbers')
    .select('is_verified')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.is_verified === true;
}

function toClientShape(row, phoneVerified) {
  return {
    notificationsEnabled: row.notifications_enabled,
    updatesEnabled: row.updates_enabled,
    nightModeEnabled: row.night_mode_enabled,
    newsletterEnabled: row.newsletter_enabled,
    deliveryChannel: row.delivery_channel,
    phoneVerified,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH');
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

  const phoneVerified = await isPhoneVerified(db, user.id);

  if (req.method === 'GET') {
    const { data, error: selectError } = await db
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (selectError) {
      console.error('[notification-preferences] select error:', selectError.message);
      return res.status(500).json({ error: 'load_failed' });
    }

    if (!data) {
      const { data: created, error: insertError } = await db
        .from('notification_preferences')
        .insert({ user_id: user.id, ...DEFAULT_PREFERENCES })
        .select('*')
        .single();
      if (insertError) {
        // Two concurrent first-loads can both race past the select-miss
        // above; the loser hits the primary-key conflict, not a real error.
        if (insertError.code === '23505') {
          const { data: existing } = await db
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (existing) return res.status(200).json(toClientShape(existing, phoneVerified));
        }
        console.error('[notification-preferences] default-row insert error:', insertError.message);
        return res.status(500).json({ error: 'load_failed' });
      }
      return res.status(200).json(toClientShape(created, phoneVerified));
    }

    // Self-heal: the phone_numbers unverify trigger keeps this in sync going
    // forward, but a row written before that trigger existed could still be
    // stuck on 'sms' with no verified phone behind it.
    if (data.delivery_channel === 'sms' && !phoneVerified) {
      const { data: fixed, error: fixError } = await db
        .from('notification_preferences')
        .update({ delivery_channel: 'push', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (!fixError && fixed) return res.status(200).json(toClientShape(fixed, phoneVerified));
    }

    return res.status(200).json(toClientShape(data, phoneVerified));
  }

  // PATCH
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const patch = {};
  for (const field of BOOLEAN_FIELDS) {
    if (typeof body?.[field] === 'boolean') patch[field] = body[field];
  }
  if (body?.delivery_channel !== undefined) {
    if (!DELIVERY_CHANNELS.has(body.delivery_channel)) {
      return res.status(400).json({ error: 'invalid_delivery_channel' });
    }
    if (body.delivery_channel === 'sms' && !phoneVerified) {
      return res.status(400).json({ error: 'phone_not_verified' });
    }
    patch.delivery_channel = body.delivery_channel;
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'no_valid_fields' });
  }
  patch.updated_at = new Date().toISOString();

  // A real partial UPDATE, not an upsert-with-defaults: upserting
  // {...DEFAULT_PREFERENCES, ...patch} would silently reset every field the
  // caller didn't mention back to its default on a row that already has
  // other, real values in it.
  const { data: updatedRows, error: updateError } = await db
    .from('notification_preferences')
    .update(patch)
    .eq('user_id', user.id)
    .select('*');

  if (updateError) {
    console.error('[notification-preferences] update error:', updateError.message);
    return res.status(500).json({ error: 'save_failed' });
  }

  let result = updatedRows?.[0];
  if (!result) {
    const { data: created, error: insertError } = await db
      .from('notification_preferences')
      .insert({ user_id: user.id, ...DEFAULT_PREFERENCES, ...patch })
      .select('*')
      .single();
    if (insertError) {
      console.error('[notification-preferences] insert error:', insertError.message);
      return res.status(500).json({ error: 'save_failed' });
    }
    result = created;
  }

  return res.status(200).json(toClientShape(result, phoneVerified));
}
