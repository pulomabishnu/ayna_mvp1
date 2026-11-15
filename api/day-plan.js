/**
 * Her day plan on every device (medications, doses, activities, check-ins).
 *
 *   GET                 her stored plan
 *   POST { plan }       merged with what's stored (src/health/planSync.js), saved, and the merged plan returned
 *
 * - Signed-in accounts only; runs with her own JWT so the owner-only RLS in
 *   supabase/day_plan_2026-11-15.sql applies.
 * - If the table doesn't exist yet, 503 { error: 'not_ready' }: the app keeps everything on the
 *   phone and tries again later.
 * - Rate limited. Private, never cached. Values are never logged and never go to analytics.
 */
import { verifyUserWithRls } from './_userScopedSupabase.js';
import { rateLimit } from './_rateLimit.js';
import { cleanPlan, mergePlans, emptyPlan } from '../src/health/planSync.js';
import { isMissingSchema } from './daily-log.js';

const MAX_BODY_CHARS = 900000;

async function readStored(client, userId) {
  const { data, error } = await client.from('user_day_plan').select('plan').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return cleanPlan(data?.plan || emptyPlan());
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error: authError, client } = await verifyUserWithRls(req);
  if (authError || !user || !client) {
    const status = authError === 'auth_required' || authError === 'invalid_session' ? 401 : 503;
    return res.status(status).json({ error: authError || 'auth_required' });
  }
  const limited = await rateLimit(`day-plan:${req.method}:${user.id}`, { max: 240, windowSec: 3600 });
  if (!limited.ok) {
    if (limited.retryAfterSec) res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: 'rate_limited' });
  }
  try {
    if (req.method === 'GET') return res.status(200).json({ plan: await readStored(client, user.id) });
    let body = req.body || {};
    if (typeof body === 'string') {
      if (body.length > MAX_BODY_CHARS) return res.status(413).json({ error: 'too_big' });
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_request' }); }
    }
    if (!body.plan || typeof body.plan !== 'object') return res.status(400).json({ error: 'bad_request' });
    if (JSON.stringify(body.plan).length > MAX_BODY_CHARS) return res.status(413).json({ error: 'too_big' });
    const incoming = cleanPlan(body.plan);
    const merged = mergePlans(await readStored(client, user.id), incoming);
    const { error } = await client.from('user_day_plan').upsert({ user_id: user.id, plan: merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return res.status(200).json({ ok: true, plan: merged });
  } catch (e) {
    if (isMissingSchema(e)) return res.status(503).json({ error: 'not_ready' });
    console.error('[day-plan] failed:', e?.code || e?.message);
    return res.status(500).json({ error: 'day_plan_failed' });
  }
}
