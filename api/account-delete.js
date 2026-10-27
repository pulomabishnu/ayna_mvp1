/* global process */
import { proStripe } from './_pro.js';
import { verifyUser } from './_usageLimit.js';
import { revokeStoredAppleAuthorization } from './_appleSignIn.js';
import { revokeProvider, PROVIDERS } from './_healthProviders.js';

const USER_TABLES = [
  'health_intakes', 'notification_preferences', 'pending_phone_verifications', 'phone_numbers',
  'recall_notifications', 'sms_conversations', 'sms_preferences', 'sms_events', 'user_ai_usage', 'user_ecosystem_builds',
  'user_ecosystems', 'user_health_profiles', 'user_learning_memory', 'user_reviews',
  'device_tokens', 'apple_oauth_tokens',
  // Connected health data (supabase/health_data.sql). Provider access is
  // revoked first, below, while the tokens still exist.
  'health_daily_metrics', 'health_connections', 'health_imports', 'health_source_requests',
  'health_oauth_states', 'health_oauth_tokens', 'health_data_events',
];

function missingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '');
}

function setPrivateResponseHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  setPrivateResponseHeaders(res);

  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({
      error: error || 'auth_required',
    });
  }

  if (req.body?.confirm !== 'DELETE') {
    return res.status(400).json({ error: 'confirmation_required' });
  }

  // Reason/reasonDetails are optional exit-survey fields from the delete
  // account page. They are logged for product visibility only, never
  // persisted to a table: the `feedback` rows for this user are deleted a
  // few lines below in this same handler, so writing there would just be
  // deleted again immediately.
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 120) : null;
  const reasonDetails = typeof req.body?.reasonDetails === 'string' ? req.body.reasonDetails.slice(0, 600) : null;
  if (reason || reasonDetails) {
    console.info('[account-delete] exit reason', { userId: user.id, reason, hasDetails: Boolean(reasonDetails) });
  }

  try {
    // Stop future billing before deleting the account and its ledger rows.
    if (process.env.PRO_BILLING_ENABLED === '1') {
      const { data, error } = await admin.from('pro_subscriptions').select('subscription_id').eq('user_id', user.id);
      if (error) throw new Error('Unable to check Pro billing');
      if (data?.length) {
        const stripe = proStripe();
        for (const row of data) {
          const sub = await stripe.subscriptions.retrieve(row.subscription_id);
          if (!['canceled', 'incomplete_expired'].includes(sub.status)) await stripe.subscriptions.cancel(sub.id);
        }
      }
    }
    // feedback uses ON DELETE SET NULL rather than CASCADE, so remove it
    // explicitly to avoid retaining a deleted user's message/email.
    const feedbackDeletes = [admin.from('feedback').delete().eq('user_id', user.id)];
    // Email-matched rows only for a confirmed inbox (see account-data.js).
    const ownsEmail = Boolean(user.email && user.email_confirmed_at);
    if (ownsEmail) feedbackDeletes.push(admin.from('feedback').delete().eq('email', user.email));
    const feedbackResults = await Promise.all(feedbackDeletes);
    const feedbackError = feedbackResults.find((r) => r.error)?.error;
    if (feedbackError) throw new Error(`feedback: ${feedbackError.message}`);

    // The beta allowlist is keyed by email rather than auth user id, so it does
    // not cascade from auth.users. Treat it as account-linked personal data.
    if (ownsEmail) {
      const { error: approvedError } = await admin.from('approved_users').delete().eq('email', user.email);
      if (approvedError) throw new Error(`approved_users: ${approvedError.message}`);
    }

    // Sign in with Apple: Apple requires revoking the user's token on account
    // deletion (App Store guideline 5.1.1(v)). Best-effort — never blocks.
    try { await revokeStoredAppleAuthorization(admin, user.id); } catch (e) {
      console.warn('[account-delete] Apple revocation skipped:', e?.message);
    }

    // Connected health providers (Oura): revoke ayna's access while the
    // tokens still exist. Best-effort; the tokens are deleted either way.
    for (const provider of Object.keys(PROVIDERS)) {
      try { await revokeProvider(admin, user.id, provider); } catch {
        console.warn('[account-delete] health provider revocation skipped:', provider);
      }
    }

    // Explicitly purge user-owned tables (the app adds several that may not
    // cascade); a table that doesn't exist yet is skipped.
    for (const table of USER_TABLES) {
      const { error: tableError } = await admin.from(table).delete().eq('user_id', user.id);
      if (tableError && !missingTable(tableError)) throw new Error(`${table}: ${tableError.message}`);
    }

    // Every other user-owned public table has an auth.users FK with ON DELETE
    // CASCADE. Supabase also removes sessions/identities when the auth user is
    // deleted. false = hard delete, not recoverable soft deletion.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw new Error(deleteError.message || 'auth_delete_failed');

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[account-delete] deletion failed:', e?.message);
    return res.status(500).json({ error: 'delete_failed' });
  }
}
