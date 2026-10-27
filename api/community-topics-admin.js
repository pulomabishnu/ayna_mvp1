/**
 * Admin review for Community topics (/admin/topics).
 *
 * GET  -> { topics: { available, pending, reported, hidden }, suggestions: { available, rows } }
 * POST { action: 'approve' | 'hide' | 'keep' | 'restore', topicId }
 * POST { action: 'suggestion-done' | 'suggestion-reopen', suggestionId }
 *
 * The gate is here, on the server: a confirmed, non-guest account on
 * ADMIN_EMAILS (api/_admin.js). Everyone else gets 401/403 and no data.
 * Uses the service role (status changes are admin-only by design; the
 * database lets only the service role or an ayna admin change them).
 * Anonymous creators stay anonymous here too: no ids or emails are returned,
 * only a public @handle when the creator chose to show it.
 */
import { verifyUser } from './_usageLimit.js';
import { isAdminUser } from './_admin.js';

const TOPIC_COLUMNS = 'id, slug, name, description, cover_image_url, cover_color, title_font, text_color, visibility, status, creator_anonymous, created_by, created_at, updated_at, reviewed_at';
const UUID_RE = /^[0-9a-f-]{36}$/i;

function setPrivateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function isMissingSchema(error) {
  const code = String(error?.code || '');
  return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(code)
    || /does not exist|schema cache|could not find the (table|column)/i.test(String(error?.message || ''));
}

/** Strips the creator id; adds the public handle only for named topics. */
export function adminTopicRow(row, handles = new Map(), reports = null) {
  const { created_by: creator, ...rest } = row;
  return {
    ...rest,
    creator_label: row.creator_anonymous ? 'Anonymous member' : handles.get(creator) ? `@${handles.get(creator)}` : 'Member without a profile',
    ...(reports ? { reports } : {}),
  };
}

async function handlesFor(db, rows) {
  const ids = [...new Set(rows.filter((r) => !r.creator_anonymous && r.created_by).map((r) => r.created_by))];
  if (!ids.length) return new Map();
  const { data } = await db.from('community_profiles').select('user_id, username').in('user_id', ids);
  return new Map((data || []).map((p) => [p.user_id, p.username]));
}

async function loadTopics(db) {
  const pendingQ = await db.from('community_topics').select(TOPIC_COLUMNS).eq('status', 'pending').order('created_at', { ascending: true }).limit(100);
  if (pendingQ.error) {
    if (isMissingSchema(pendingQ.error)) return { available: false, pending: [], reported: [], hidden: [] };
    throw pendingQ.error;
  }
  const hiddenQ = await db.from('community_topics').select(TOPIC_COLUMNS).eq('status', 'hidden').order('updated_at', { ascending: false }).limit(30);
  if (hiddenQ.error) throw hiddenQ.error;

  // Open reports on topics, grouped per topic with a count per reason.
  const reportsQ = await db.from('community_reports').select('topic_id, reason, created_at')
    .eq('target_type', 'topic').in('status', ['open', 'reviewing']).order('created_at', { ascending: false }).limit(500);
  if (reportsQ.error && !isMissingSchema(reportsQ.error)) throw reportsQ.error;
  const byTopic = new Map();
  for (const r of reportsQ.data || []) {
    if (!r.topic_id) continue;
    const entry = byTopic.get(r.topic_id) || { count: 0, reasons: {}, latest: r.created_at };
    entry.count += 1;
    entry.reasons[r.reason] = (entry.reasons[r.reason] || 0) + 1;
    byTopic.set(r.topic_id, entry);
  }
  let reportedRows = [];
  if (byTopic.size) {
    const q = await db.from('community_topics').select(TOPIC_COLUMNS).in('id', [...byTopic.keys()]).neq('status', 'hidden');
    if (q.error) throw q.error;
    reportedRows = (q.data || []).sort((a, b) => byTopic.get(b.id).count - byTopic.get(a.id).count);
  }
  const all = [...pendingQ.data || [], ...hiddenQ.data || [], ...reportedRows];
  const handles = await handlesFor(db, all);
  return {
    available: true,
    pending: (pendingQ.data || []).map((r) => adminTopicRow(r, handles)),
    reported: reportedRows.map((r) => adminTopicRow(r, handles, byTopic.get(r.id))),
    hidden: (hiddenQ.data || []).map((r) => adminTopicRow(r, handles)),
  };
}

async function loadSuggestions(db) {
  const run = (cols) => db.from('suggestions').select(cols).eq('kind', 'topic').order('created_at', { ascending: false }).limit(100);
  let q = await run('id, topic, reason, context, platform, created_at, reviewed_at');
  let canMark = true;
  if (q.error && isMissingSchema(q.error)) {
    // Before the topics migration there is no reviewed_at column.
    q = await run('id, topic, reason, context, platform, created_at');
    canMark = false;
  }
  if (q.error) {
    if (isMissingSchema(q.error)) return { available: false, canMark: false, rows: [] };
    throw q.error;
  }
  return { available: true, canMark, rows: q.data || [] };
}

const NEXT_STATUS = { approve: 'visible', restore: 'visible', hide: 'hidden' };

export default async function handler(req, res) {
  setPrivateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error, admin: db } = await verifyUser(req);
  if (error || !user || !db) {
    return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
  }
  if (!isAdminUser(user)) return res.status(403).json({ error: 'forbidden' });

  try {
    if (req.method === 'GET') {
      const [topics, suggestions] = await Promise.all([loadTopics(db), loadSuggestions(db)]);
      return res.status(200).json({ ok: true, topics, suggestions });
    }

    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const action = String(body.action || '');

    if (action === 'suggestion-done' || action === 'suggestion-reopen') {
      if (!UUID_RE.test(String(body.suggestionId || ''))) return res.status(400).json({ error: 'bad_request' });
      const { error: upError } = await db.from('suggestions')
        .update({ reviewed_at: action === 'suggestion-done' ? new Date().toISOString() : null })
        .eq('id', body.suggestionId).eq('kind', 'topic');
      if (upError) {
        if (isMissingSchema(upError)) return res.status(409).json({ error: 'migration_needed' });
        throw upError;
      }
      return res.status(200).json({ ok: true });
    }

    if (!['approve', 'hide', 'keep', 'restore'].includes(action) || !UUID_RE.test(String(body.topicId || ''))) {
      return res.status(400).json({ error: 'bad_request' });
    }
    if (NEXT_STATUS[action]) {
      const { data, error: upError } = await db.from('community_topics').update({ status: NEXT_STATUS[action] })
        .eq('id', body.topicId).select('id, status').maybeSingle();
      if (upError) {
        if (isMissingSchema(upError)) return res.status(409).json({ error: 'migration_needed' });
        throw upError;
      }
      if (!data) return res.status(404).json({ error: 'not_found' });
    }
    // Close the open reports on this topic: hidden = actioned, kept = dismissed.
    if (action === 'hide' || action === 'keep') {
      await db.from('community_reports').update({ status: action === 'hide' ? 'actioned' : 'dismissed', reviewed_at: new Date().toISOString() })
        .eq('target_type', 'topic').eq('topic_id', body.topicId).in('status', ['open', 'reviewing']);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[community-topics-admin] failed:', e?.code, e?.message);
    return res.status(500).json({ error: 'load_failed' });
  }
}
