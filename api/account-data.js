import { verifyUser } from './_usageLimit.js';

const USER_TABLES = [
  ['health_intakes', '*'],
  ['user_health_profiles', '*'],
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

// Community rows the person authored or owns, keyed by whichever column
// identifies them as the owner. Anonymous posts are included — they are this
// person's own data, and the export only ever goes to them.
const COMMUNITY_TABLES = [
  ['community_profiles', 'user_id'],
  ['community_posts', 'author_id'],
  ['community_comments', 'author_id'],
  ['community_post_media', 'owner_id'],
  ['community_helpful_votes', 'user_id'],
  ['community_saved_posts', 'user_id'],
  ['community_hidden_posts', 'user_id'],
  ['community_follows', 'follower_id'],
  ['community_blocks', 'blocker_id'],
  ['community_playlists', 'owner_id'],
  ['community_playlist_saves', 'user_id'],
  ['community_notifications', 'recipient_id'],
  ['community_reports', 'reporter_id'],
];

// The community schema may not be applied in every environment yet; a missing
// table must not fail the whole export.
function isMissingTable(err) {
  return err?.code === '42P01' || err?.code === 'PGRST205' || /does not exist|schema cache/i.test(err?.message || '');
}

async function exportCommunity(admin, userId) {
  const out = {};
  for (const [table, column] of COMMUNITY_TABLES) {
    const { data, error } = await admin.from(table).select('*').eq(column, userId);
    if (error) {
      if (isMissingTable(error)) return {};
      throw new Error(`${table}: ${error.message}`);
    }
    out[table] = data || [];
  }
  const playlistIds = (out.community_playlists || []).map((p) => p.id);
  const extra = await Promise.all([
    playlistIds.length
      ? admin.from('community_playlist_items').select('*').in('playlist_id', playlistIds)
      : Promise.resolve({ data: [], error: null }),
    out.community_posts?.length
      ? admin.from('community_post_products').select('*').in('post_id', out.community_posts.map((p) => p.id))
      : Promise.resolve({ data: [], error: null }),
    admin.from('community_friend_requests').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    admin.from('community_product_recommendations').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
  ]);
  const names = ['community_playlist_items', 'community_post_products', 'community_friend_requests', 'community_product_recommendations'];
  extra.forEach((result, i) => {
    if (result.error) throw new Error(`${names[i]}: ${result.error.message}`);
    out[names[i]] = result.data || [];
  });
  return out;
}

function dedupeById(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const key = row?.id || JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function setPrivateResponseHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  setPrivateResponseHeaders(res);

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

    const [feedbackResults, approvedResult, community] = await Promise.all([
      Promise.all(feedbackQueries),
      user.email
        ? admin.from('approved_users').select('email,approved_at').eq('email', user.email)
        : Promise.resolve({ data: [], error: null }),
      exportCommunity(admin, user.id),
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
        ...Object.entries(community),
      ]),
    };

    const filename = `ayna-data-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (e) {
    // Never include table contents or user data in the response. Server logs get
    // only the coarse error text needed to diagnose a failed export.
    console.error('[account-data] export failed:', e?.message);
    return res.status(500).json({ error: 'export_failed' });
  }
}
