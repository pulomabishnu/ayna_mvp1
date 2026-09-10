/**
 * /api/export-data — everything this app holds about the signed-in caller,
 * pulled live from the real tables (never a fabricated/placeholder shape).
 * Backs both the "Manage my data" screen (renders this JSON) and "Download
 * my data" (the client turns this same response into a file).
 *
 * Same auth pattern as notification-preferences.js: verifyUser() reads the
 * caller's Supabase JWT from Authorization: Bearer <token> — a user id is
 * never trusted from the request. Deployed environments use the existing
 * service-role client; local development can fall back to the caller's JWT
 * plus the public key, with each table's RLS policy enforcing ownership.
 */
/* global process */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { verifyUserWithRls } from './_userScopedSupabase.js';

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
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
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

  const [phoneResult, prefsResult, intakeResult, ecosystemResult] = await Promise.all([
    db.from('phone_numbers').select('phone_number, is_verified').eq('user_id', user.id).maybeSingle(),
    db.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('health_intakes').select('profile, updated_at').eq('user_id', user.id).maybeSingle(),
    db.from('user_ecosystems').select('product_id, product_name, brand, category, is_saved, updated_at').eq('user_id', user.id),
  ]);

  const prefsRow = prefsResult.data;

  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email || null,
      emailVerified: !!user.email_confirmed_at,
      createdAt: user.created_at || null,
      signInMethods: (user.identities || []).map((i) => ({
        provider: i.provider,
        email: i.identity_data?.email || null,
      })),
    },
    phone: phoneResult.data
      ? { number: phoneResult.data.phone_number, verified: phoneResult.data.is_verified === true }
      : null,
    notificationPreferences: prefsRow
      ? {
          notificationsEnabled: prefsRow.notifications_enabled,
          updatesEnabled: prefsRow.updates_enabled,
          nightModeEnabled: prefsRow.night_mode_enabled,
          newsletterEnabled: prefsRow.newsletter_enabled,
          deliveryChannel: prefsRow.delivery_channel,
        }
      : null,
    healthIntake: intakeResult.data?.profile || null,
    healthIntakeUpdatedAt: intakeResult.data?.updated_at || null,
    savedProducts: ecosystemResult.data || [],
  });
}
