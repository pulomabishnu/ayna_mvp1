/**
 * Create or edit a user-created Community topic.
 *
 * POST { action: 'create' | 'update', topicId?, name, description, coverImageUrl,
 *        coverColor, titleFont, textColor, visibility, anonymous }
 *
 * - Signed-in accounts only (guests are refused by verifyUserWithRls).
 * - Runs with the caller's own JWT and the public key, never the service
 *   role, so RLS and the database triggers in
 *   supabase/community_user_topics_2026-10-21.sql apply on top of the checks
 *   here (3 new topics a day per account, contrast, links, impersonation).
 * - Full Community rules on the name and description (the database trigger
 *   only has a short backstop list).
 * - Rate limited per account and per IP before anything is written.
 * - The response never names the creator of an anonymous topic; the team
 *   text for a topic waiting for review carries only its name.
 */
import { verifyUserWithRls } from './_userScopedSupabase.js';
import { getClientIp, rateLimit } from './_rateLimit.js';
import { sendTeamAlert } from './_twilio.js';
import { validateTopicInput, topicSlug, TOPIC_ERRORS } from '../src/utils/community/topicRules.js';

const COLUMNS = 'id, slug, name, description, cover_image_url, cover_color, title_font, text_color, visibility, status, creator_anonymous, created_at, updated_at';

function isMissingSchema(error) {
  const code = String(error?.code || '');
  return ['42P01', '42703', '42883', 'PGRST200', 'PGRST202', 'PGRST204', 'PGRST205'].includes(code)
    || /does not exist|schema cache|could not find the (table|function|column)/i.test(String(error?.message || ''));
}

/** Database error -> { status, error } for the person. */
export function describeDbError(error) {
  if (isMissingSchema(error)) return { status: 503, error: 'Community topics aren’t switched on yet.' };
  const msg = String(error?.message || '');
  for (const [code, text] of Object.entries(TOPIC_ERRORS)) {
    if (msg.includes(code)) return { status: code === 'community_rate_limited' ? 429 : code === 'community_not_topic_owner' ? 403 : 400, error: text };
  }
  if (error?.code === '23505') return { status: 409, error: 'Try that again: a topic just took that address.' };
  if (/row-level security|permission denied/i.test(msg)) return { status: 403, error: 'You don’t have access to do that.' };
  return { status: 500, error: 'That didn’t save. Try again in a moment.' };
}

/** Public shape of a saved row (no creator id). */
export function publicTopic(row) {
  if (!row) return null;
  const { created_by: _creator, ...rest } = row;
  return rest;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  }
  const action = body.action === 'update' ? 'update' : body.action === 'create' ? 'create' : '';
  if (!action) return res.status(400).json({ error: 'Invalid request.' });

  const { user, error: authError, client } = await verifyUserWithRls(req);
  if (authError || !user || !client) {
    const status = authError === 'auth_required' || authError === 'invalid_session' ? 401 : 503;
    return res.status(status).json({ error: status === 401 ? 'Sign in to start a topic.' : 'Community topics are offline for a moment.' });
  }

  // Bursts per IP first, then validation (a form she fixes and resends
  // doesn't use up her daily topics), then the daily cap per account. The
  // database enforces the same 3 a day even if this store is down.
  const ipLimit = await rateLimit(`topic-write-ip:${getClientIp(req)}`, { max: 20, windowSec: 3600 });
  if (!ipLimit.ok) {
    if (ipLimit.retryAfterSec) res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
    return res.status(429).json({ error: 'Lots of changes at once. Try again in a bit.' });
  }
  const { row, error, field } = validateTopicInput(body);
  if (error) return res.status(400).json({ error, field });
  const userLimit = action === 'create'
    ? await rateLimit(`topic-create:${user.id}`, { max: 3, windowSec: 86400 })
    : await rateLimit(`topic-edit:${user.id}`, { max: 30, windowSec: 3600 });
  if (!userLimit.ok) {
    if (userLimit.retryAfterSec) res.setHeader('Retry-After', String(userLimit.retryAfterSec));
    return res.status(429).json({ error: action === 'create' ? TOPIC_ERRORS.community_rate_limited : 'Lots of changes at once. Try again in a bit.' });
  }

  if (action === 'create') {
    const insert = { ...row, slug: topicSlug(row.name), created_by: user.id };
    const { data, error: dbError } = await client.from('community_topics').insert(insert).select(COLUMNS).single();
    if (dbError) {
      const out = describeDbError(dbError);
      if (out.status >= 500) console.error('[community-topics] insert failed:', dbError.code, dbError.message);
      return res.status(out.status).json({ error: out.error });
    }
    // Public topics wait for the team. Only the topic name goes out.
    if (data?.status === 'pending') await sendTeamAlert(`new community topic to review: ${String(data.name).slice(0, 60)}`);
    return res.status(200).json({ ok: true, topic: publicTopic(data) });
  }

  const topicId = typeof body.topicId === 'string' && /^[0-9a-f-]{36}$/i.test(body.topicId) ? body.topicId : '';
  if (!topicId) return res.status(400).json({ error: 'Invalid request.' });
  const { error: rpcError } = await client.rpc('community_update_topic', {
    tid: topicId,
    p_name: row.name,
    p_description: row.description,
    p_cover_image_url: row.cover_image_url,
    p_cover_color: row.cover_color,
    p_title_font: row.title_font,
    p_text_color: row.text_color,
    p_visibility: row.visibility,
  });
  if (rpcError) {
    const out = describeDbError(rpcError);
    if (out.status >= 500) console.error('[community-topics] update failed:', rpcError.code, rpcError.message);
    return res.status(out.status).json({ error: out.error });
  }
  const { data } = await client.from('community_feed_topics').select(COLUMNS).eq('id', topicId).maybeSingle();
  if (data?.status === 'pending') await sendTeamAlert(`community topic changed, review again: ${String(data.name).slice(0, 60)}`);
  return res.status(200).json({ ok: true, topic: publicTopic(data) });
}
