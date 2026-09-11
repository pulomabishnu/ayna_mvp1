/* global process */
import { verifyUser } from './_usageLimit.js';

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
  'user_learning_memory',
  'user_reviews',
];

function safeFilenamePart(value) {
  return String(value || 'account').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'account';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({
      error: error || 'auth_required',
    });
  }

  try {
    const tableResults = await Promise.all(
      USER_TABLES.map(async (table) => {
        const { data, error: tableError } = await admin.from(table).select('*').eq('user_id', user.id);
        if (tableError) throw new Error(`${table}: ${tableError.message}`);
        return [table, data || []];
      })
    );

    const [{ data: feedback, error: feedbackError }, { data: approvedUsers, error: approvedError }] = await Promise.all([
      admin.from('feedback').select('*').or(`user_id.eq.${user.id},email.eq.${user.email || ''}`),
      user.email
        ? admin.from('approved_users').select('*').eq('email', user.email)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (feedbackError) throw new Error(`feedback: ${feedbackError.message}`);
    if (approvedError) throw new Error(`approved_users: ${approvedError.message}`);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null,
        createdAt: user.created_at || null,
        lastSignInAt: user.last_sign_in_at || null,
        userMetadata: user.user_metadata || {},
      },
      data: Object.fromEntries([
        ...tableResults,
        ['feedback', feedback || []],
        ['approved_users', approvedUsers || []],
      ]),
    };

    const filename = `ayna-data-${safeFilenamePart(user.email || user.id)}-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (e) {
    console.error('[account-data] export failed:', e?.message);
    return res.status(500).json({ error: 'export_failed' });
  }
}
