/**
 * /api/export-data, everything this app holds about the signed-in caller,
 * pulled live from the real tables (never a fabricated/placeholder shape).
 * Backs both the "Manage my data" screen (renders this JSON) and "Download
 * my data" (the client turns this same response into a file).
 *
 * Same auth pattern as notification-preferences.js: verifyUser() reads the
 * caller's Supabase JWT from Authorization: Bearer <token>, a user id is
 * never trusted from the request. Deployed environments use the existing
 * service-role client; local development can fall back to the caller's JWT
 * plus the public key, with each table's RLS policy enforcing ownership.
 *
 * GET returns the full export (every account-linked table, see below).
 * The real deletion is DELETE /api/account-delete. POST here still files a
 * "delete my account" request for app builds that use it (account_deletion_
 * requests table), kept on this same route rather than a new top-level
 * api/*.js file per README.md's Vercel function-count guidance. This only
 * records the request; it does not itself purge data (see that table's own
 * header comment for exactly what a real deletion still has to touch).
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

function missingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '');
}

async function fetchRows(db, table, userId, { single = false, select = '*' } = {}) {
  let query = db.from(table).select(select).eq('user_id', userId);
  if (single) query = query.maybeSingle();
  const result = await query;
  if (!result.error) return { data: result.data, warning: null };
  if (missingTable(result.error)) return { data: single ? null : [], warning: `${table}: not present in this schema` };
  return { data: single ? null : [], warning: `${table}: ${result.error.message}` };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
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

  if (req.method === 'POST') {
    const { data: existing } = await db
      .from('account_deletion_requests')
      .select('id, requested_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing) {
      return res.status(200).json({ requested: true, requestedAt: existing.requested_at, alreadyPending: true });
    }

    const { data: created, error: insertError } = await db
      .from('account_deletion_requests')
      .insert({ user_id: user.id, email: user.email || '' })
      .select('requested_at')
      .single();
    if (insertError) {
      console.error('[export-data] deletion request insert failed:', insertError.message);
      return res.status(500).json({ error: 'request_failed' });
    }
    return res.status(200).json({ requested: true, requestedAt: created.requested_at, alreadyPending: false });
  }

  const entries = await Promise.all([
    fetchRows(db, 'phone_numbers', user.id, { single: true, select: 'phone_number, is_verified, sms_opted_out, created_at, updated_at' }),
    fetchRows(db, 'notification_preferences', user.id, { single: true }),
    fetchRows(db, 'health_intakes', user.id, { single: true }),
    fetchRows(db, 'user_ecosystems', user.id),
    fetchRows(db, 'user_health_profiles', user.id),
    fetchRows(db, 'user_reviews', user.id),
    fetchRows(db, 'sms_conversations', user.id, { select: 'direction, message_body, created_at' }),
    fetchRows(db, 'user_ai_usage', user.id),
    fetchRows(db, 'user_ecosystem_builds', user.id),
    fetchRows(db, 'user_learning_memory', user.id),
    fetchRows(db, 'recall_notifications', user.id),
    fetchRows(db, 'account_deletion_requests', user.id, { select: 'status, requested_at, processed_at' }),
  ]);

  const [phone, prefs, intake, ecosystem, healthProfiles, reviews, sms, aiUsage, builds, learningMemory, recalls, deletionRequests] = entries;
  const warnings = entries.map((entry) => entry.warning).filter(Boolean);
  const meta = user.user_metadata || {};

  return res.status(200).json({
    exportedAt: new Date().toISOString(),
    scope: 'Account-linked data stored in ayna application databases. Third-party processor logs or platform records may be subject to separate retention and access processes. Security credentials such as password hashes, session tokens, encryption keys, and encrypted OAuth refresh tokens are intentionally not included.',
    incomplete: warnings.length > 0,
    warnings,
    account: {
      email: user.email || null,
      emailVerified: !!user.email_confirmed_at,
      createdAt: user.created_at || null,
      consent: {
        consentGivenAt: meta.consent_given_at || null,
        consentVersion: meta.consent_version || null,
        age18Confirmed: meta.age_18_confirmed === true,
        age18ConfirmedAt: meta.age_18_confirmed_at || null,
        aiHealthProcessingAllowed: meta.ai_health_processing_allowed === true,
        aiHealthProcessingConsentedAt: meta.ai_health_processing_consented_at || null,
        aiHealthProcessingRevokedAt: meta.ai_health_processing_revoked_at || null,
      },
      signInMethods: (user.identities || []).map((identity) => ({ provider: identity.provider })),
    },
    phone: phone.data
      ? {
          number: phone.data.phone_number,
          verified: phone.data.is_verified === true,
          smsOptedOut: phone.data.sms_opted_out === true,
          createdAt: phone.data.created_at || null,
          updatedAt: phone.data.updated_at || null,
        }
      : null,
    notificationPreferences: prefs.data || null,
    healthIntake: intake.data || null,
    savedAndEcosystemProducts: ecosystem.data || [],
    importedHealthProfiles: healthProfiles.data || [],
    reviews: reviews.data || [],
    smsConversationHistory: sms.data || [],
    aiUsageRecords: aiUsage.data || [],
    ecosystemBuildHistory: builds.data || [],
    personalizationMemory: learningMemory.data || [],
    recallNotificationRecords: recalls.data || [],
    accountDeletionRequests: deletionRequests.data || [],
  });
}
