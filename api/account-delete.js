import { verifyUser } from './_usageLimit.js';

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

  try {
    // feedback uses ON DELETE SET NULL rather than CASCADE, so remove it
    // explicitly to avoid retaining a deleted user's message/email.
    const feedbackDeletes = [admin.from('feedback').delete().eq('user_id', user.id)];
    if (user.email) feedbackDeletes.push(admin.from('feedback').delete().eq('email', user.email));
    const feedbackResults = await Promise.all(feedbackDeletes);
    const feedbackError = feedbackResults.find((r) => r.error)?.error;
    if (feedbackError) throw new Error(`feedback: ${feedbackError.message}`);

    // The beta allowlist is keyed by email rather than auth user id, so it does
    // not cascade from auth.users. Treat it as account-linked personal data.
    if (user.email) {
      const { error: approvedError } = await admin.from('approved_users').delete().eq('email', user.email);
      if (approvedError) throw new Error(`approved_users: ${approvedError.message}`);
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
