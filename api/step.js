/* global process, Buffer */
// Anonymous journey step counter. The site and the app send
// { s: "<step>", pl: "<platform>" } when a visitor reaches a step
// (src/utils/journeyStep.js countJourneyStep); this adds 1 to that step's
// count for today in public.journey_step_daily.
//
// Stored: day (UTC), step, platform, count. Nothing else: no IP, user agent,
// cookie, account or analytics id. The IP is used only in memory/Redis for
// rate limiting and is never written to Supabase. Unknown steps or platforms
// are ignored here and by the database function.
// Table + function: supabase/journey_step_daily_2026-11-11.sql (a founder runs it).
// Same design as the Buy counter (api/go.js).
import { createClient } from '@supabase/supabase-js';
import { getClientIp, rateLimit } from './_rateLimit.js';

export const JOURNEY_STEPS = ['landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created'];
export const JOURNEY_PLATFORMS = ['web', 'ios_app', 'android_app'];

/** { step, platform } from a fetch body or ?s=&pl=. Null if either is missing or unknown. Exported for tests. */
export function readStep(req) {
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const src = body && typeof body === 'object' ? body : {};
  const step = String(src.s ?? req.query?.s ?? '');
  const platform = String(src.pl ?? req.query?.pl ?? '');
  if (!JOURNEY_STEPS.includes(step) || !JOURNEY_PLATFORMS.includes(platform)) return null;
  return { step, platform };
}

let admin = null;
function getAdmin() {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
/** Tests swap the database client. */
export function setStepAdminForTests(client) { admin = client; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // The app (capacitor://localhost) posts here too.
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const hit = readStep(req);
  // 204 for everything the caller can't act on: the page never waits on this.
  if (!hit) return res.status(204).end();

  const limit = await rateLimit(`step:${getClientIp(req)}`, { max: 60, windowSec: 600, failClosed: false });
  if (!limit.ok) return res.status(204).end();

  const db = getAdmin();
  if (!db) return res.status(204).end();
  const { error } = await db.rpc('record_journey_step', { p_step: hit.step, p_platform: hit.platform });
  if (error) console.error('[step] count failed:', error.code, error.message);
  return res.status(204).end();
}
