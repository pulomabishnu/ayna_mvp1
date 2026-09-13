import { verifyUser } from './_usageLimit.js';
import { revokeStoredAppleAuthorization } from './_appleSignIn.js';

const USER_TABLES = [
  'health_intakes',
  'notification_preferences',
  'pending_phone_verifications',
  'phone_numbers',
  'recall_notifications',
  'sms_conversations',
  'user_ai_usage',
  'user_ecosystem_builds',
  'user_ecosystems',
  'user_health_profiles',
  'user_learning_memory',
  'user_reviews',
  'account_deletion_requests',
  // Stored separately because it is a credential, not profile data. It is
  // revoked with Apple before this row is purged whenever a token is present.
  'apple_oauth_tokens',
];

function setPrivateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function missingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '');
}

async function deleteUserRows(admin, table, userId) {
  const { error } = await admin.from(table).delete().eq('user_id', userId);
  if (!error || missingTable(error)) return;
  throw new Error(`${table}: ${error.message}`);
}

export default async function handler(req, res) {
  setPrivateHeaders(res);
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error, admin } = await verifyUser(req);
  if (!user || !admin) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({
      error: error || 'auth_required',
    });
  }

  const body = typeof req.body === 'string' ? (() => {
    try { return JSON.parse(req.body); } catch { return {}; }
  })() : (req.body || {});
  if (body.confirm !== 'DELETE') return res.status(400).json({ error: 'confirmation_required' });

  try {
    // Apple asks apps using Sign in with Apple to revoke the associated token
    // when the user deletes the account. This is best-effort by design: an
    // older account may predate secure refresh-token storage, and account
    // deletion must still be completed even if no revocable token is available.
    const appleAuthorization = await revokeStoredAppleAuthorization(admin, user.id);

    // Explicitly purge every known user-owned table instead of assuming an
    // ON DELETE CASCADE is present or correct. Missing-table errors are ignored
    // only to allow a release to work across a schema rollout; real permission,
    // RLS, or database errors stop deletion and surface as a failure.
    for (const table of USER_TABLES) {
      await deleteUserRows(admin, table, user.id);
    }

    // Hard-delete the authentication identity and Supabase sessions last. This
    // also clears any additional rows that correctly use ON DELETE CASCADE.
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (authDeleteError) throw new Error(`auth.users: ${authDeleteError.message || 'delete failed'}`);

    return res.status(200).json({
      ok: true,
      deleted: true,
      appleAuthorization: appleAuthorization.status,
    });
  } catch (e) {
    console.error('[account-delete] deletion failed:', e?.message || 'unknown error');
    return res.status(500).json({ error: 'delete_failed' });
  }
}
