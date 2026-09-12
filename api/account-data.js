import { verifyUser } from './_usageLimit.js';

const USER_TABLES = [
  ['health_intakes', '*'],
  ['notification_preferences', '*'],
  // Verification code hashes are an internal security credential, not useful
  // account data. Export the user's phone/status metadata without the hash.
  ['pending_phone_verifications', 'user_id,phone_number,expires_at,attempts,created_at'],
  ['phone_numbers', '*'],
  ['recall_notifications', '*'],
  ['sms_conversations', '*'],
  ['user_ai_usage', '*'],
  ['user_ecosystem_builds', '*'],
  ['user_ecosystems', '*'],
  ['user_learning_memory', '*'],
  ['user_reviews', '*'],
];

function dedupeById(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const key = row?.id || JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
      USER_TABLES.map(async ([table, columns]) => {
        const { data, error: tableError } = await admin.from(table).select(columns).eq('user_id', user.id);
        if (tableError) throw new Error(`${table}: ${tableError.message}`);
        return [table, data || []];
      })
    );

    // Query feedback by user id and email separately instead of interpolating
    // the email into a PostgREST .or() filter string. This avoids malformed
    // filters for legitimate emails containing punctuation and removes an
    // unnecessary filter-injection surface.
    const feedbackQueries = [admin.from('feedback').select('*').eq('user_id', user.id)];
    if (user.email) feedbackQueries.push(admin.from('feedback').select('*').eq('email', user.email));

    const [feedbackResults, approvedResult] = await Promise.all([
      Promise.all(feedbackQueries),
      user.email
        ? admin.from('approved_users').select('email,approved_at').eq('email', user.email)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const feedbackError = feedbackResults.find((result) => result.error)?.error;
    if (feedbackError) throw new Error(`feedback: ${feedbackError.message}`);
    if (approvedResult.error) throw new Error(`approved_users: ${approvedResult.error.message}`);

    const feedback = dedupeById(feedbackResults.flatMap((result) => result.data || []));

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
        ['feedback', feedback],
        ['approved_users', approvedResult.data || []],
      ]),
    };

    const filename = `ayna-data-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (e) {
    console.error('[account-data] export failed:', e?.message);
    return res.status(500).json({ error: 'export_failed' });
  }
}
