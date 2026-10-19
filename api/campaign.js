/**
 * Free product campaign API. Everything that matters is decided here and in
 * Postgres (supabase/migrations/20261015120000_free_product_campaign.sql),
 * never in the browser:
 *
 *   GET  /api/campaign                     progress, friends, claim, pool
 *   POST /api/campaign { action: 'feedback', key, response }
 *   POST /api/campaign { action: 'spin' }
 *   POST /api/campaign { action: 'claim', spinId, idempotencyKey }
 *   POST /api/campaign { action: 'shipping', address }
 *
 * The caller is identified only from their Supabase session token. No
 * request field can name another user, mark a friend verified, or say
 * "eligible"; the database recomputes that on every spin and claim.
 */
import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { rpc, setPrivateHeaders } from './_campaign.js';
import { claimedEmail, sendCampaignEmail, sendTeamAlert, teamClaimAlert, teamShippingAlert } from './_campaignEmail.js';
import {
  CAMPAIGN_ID,
  FEEDBACK_QUESTIONS,
  questionByKey,
  validateFeedbackAnswer,
  validateShipping,
  referralCodeFor,
} from '../src/utils/freeProductCampaign.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_RE = /^[A-Za-z0-9_-]{16,80}$/;

const LIMITS = {
  status: { max: 120, windowSec: 600 },
  feedback: { max: 40, windowSec: 600 },
  spin: { max: 60, windowSec: 600 },
  claim: { max: 20, windowSec: 600 },
  shipping: { max: 15, windowSec: 600 },
};

async function limited(action, userId, res) {
  const { ok, retryAfterSec } = await rateLimit(`campaign:${action}:${userId}`, LIMITS[action]);
  if (ok) return false;
  res.setHeader('Retry-After', String(retryAfterSec || 60));
  res.status(429).json({ error: 'slow_down' });
  return true;
}

async function loadStatus(admin, user) {
  const progress = await rpc(admin, 'campaign_progress', { p_campaign: CAMPAIGN_ID, p_user: user.id });
  if (!progress?.campaign) return { campaign: null };
  // The reel shows what is left to win. Only once she can use it.
  const pool = progress.requirementsMet && !progress.claim
    ? await rpc(admin, 'campaign_pool', { p_campaign: CAMPAIGN_ID })
    : [];
  return {
    ...progress,
    pool: Array.isArray(pool) ? pool : [],
    referralCode: referralCodeFor(user.id),
    questions: FEEDBACK_QUESTIONS.map(({ key, question }) => ({ key, question })),
  };
}

async function handleFeedback(admin, user, body, res) {
  const q = questionByKey(body?.key);
  if (!q) return res.status(400).json({ error: 'bad_request' });
  const response = typeof body?.response === 'string' ? body.response : '';

  // Compare against her OTHER saved answers, from the database, not from the request.
  const progress = await rpc(admin, 'campaign_progress', { p_campaign: CAMPAIGN_ID, p_user: user.id });
  if (!progress?.campaign) return res.status(404).json({ error: 'campaign_not_found' });
  const others = (progress.feedback || []).filter((f) => f.key !== q.key).map((f) => f.response);
  const result = validateFeedbackAnswer(response, others, { minChars: progress.campaign.feedbackMinChars });
  // Too short / too long etc. are never stored; a valid answer is stored as complete.
  if (!result.ok) return res.status(422).json({ error: 'invalid_feedback', reason: result.reason, message: result.message, length: result.length });

  const saved = await rpc(admin, 'campaign_save_feedback', {
    p_campaign: CAMPAIGN_ID,
    p_user: user.id,
    p_key: q.key,
    p_question: q.question,
    p_response: response.replace(/\s+/g, ' ').trim(),
    p_complete: true,
  });
  if (!saved?.ok) return res.status(409).json({ error: saved?.error || 'not_saved' });
  return res.status(200).json({ ok: true, status: await loadStatus(admin, user) });
}

async function handleClaim(admin, user, body, res) {
  const spinId = String(body?.spinId || '');
  const key = String(body?.idempotencyKey || '');
  if (!UUID_RE.test(spinId) || !KEY_RE.test(key)) return res.status(400).json({ error: 'bad_request' });
  // The key is namespaced to the caller so it can never collide with someone else's.
  const result = await rpc(admin, 'campaign_claim', {
    p_campaign: CAMPAIGN_ID,
    p_user: user.id,
    p_spin: spinId,
    p_idempotency_key: `${user.id.slice(0, 8)}:${key}`.slice(0, 80),
  });
  if (!result?.ok) {
    const code = result?.error === 'out_of_stock' || result?.error === 'already_claimed' || result?.error === 'stale_spin' ? 409
      : result?.error === 'not_eligible' || result?.error === 'campaign_inactive' ? 403
        : 400;
    return res.status(code).json(result || { ok: false, error: 'claim_failed' });
  }
  // Confirmation email: at most once, never blocks or undoes the claim.
  if (!result.replayed) {
    try {
      const first = await rpc(admin, 'campaign_mark_notified', { p_campaign: CAMPAIGN_ID, p_user: user.id, p_kind: 'claimed' });
      if (first) {
        const sent = await sendCampaignEmail(user.email, claimedEmail({ product: result.claim?.product }));
        if (!sent.ok) await rpc(admin, 'campaign_unmark_notified', { p_campaign: CAMPAIGN_ID, p_user: user.id, p_kind: 'claimed' });
      }
    } catch (e) {
      console.error('[campaign] claim email failed', e?.message);
    }
    await alertTeam(teamClaimAlert({ accountEmail: user.email || user.phone, product: result.claim?.product, claimedAt: result.claim?.claimedAt }));
  }
  return res.status(200).json(result);
}

/** Tell the team (CAMPAIGN_TEAM_EMAIL or ADMIN_EMAILS). Best effort: never fails the request. */
async function alertTeam(message) {
  try {
    const sent = await sendTeamAlert(message);
    if (!sent.ok && !sent.skipped) console.error('[campaign] team alert failed', sent.error);
  } catch (e) {
    console.error('[campaign] team alert failed', e?.message);
  }
}

export default async function handler(req, res) {
  setPrivateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { user, error, admin } = await verifyUser(req);
  if (error === 'server_misconfigured') return res.status(503).json({ error: 'unavailable' });
  if (error === 'auth_error') return res.status(503).json({ error: 'unavailable' });
  if (error || !user) return res.status(401).json({ error: 'auth_required' });

  try {
    if (req.method === 'GET') {
      if (await limited('status', user.id, res)) return;
      return res.status(200).json(await loadStatus(admin, user));
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    switch (body.action) {
      case 'feedback':
        if (await limited('feedback', user.id, res)) return;
        return await handleFeedback(admin, user, body, res);
      case 'spin': {
        if (await limited('spin', user.id, res)) return;
        const result = await rpc(admin, 'campaign_spin', { p_campaign: CAMPAIGN_ID, p_user: user.id });
        if (!result?.ok) {
          const code = ['no_inventory', 'already_claimed', 'no_spins_left'].includes(result?.error) ? 409 : 403;
          return res.status(code).json(result || { ok: false, error: 'spin_failed' });
        }
        return res.status(200).json(result);
      }
      case 'claim':
        if (await limited('claim', user.id, res)) return;
        return await handleClaim(admin, user, body, res);
      case 'shipping': {
        if (await limited('shipping', user.id, res)) return;
        const { ok, value, errors } = validateShipping(body.address || {});
        if (!ok) return res.status(422).json({ error: 'invalid_address', errors });
        const result = await rpc(admin, 'campaign_save_shipping', { p_campaign: CAMPAIGN_ID, p_user: user.id, p_address: value });
        if (!result?.ok) return res.status(409).json(result || { ok: false, error: 'not_saved' });
        await alertTeam(teamShippingAlert({ accountEmail: user.email || user.phone, product: result.claim?.product, address: value, updated: Boolean(result.updated) }));
        return res.status(200).json(result);
      }
      default:
        return res.status(400).json({ error: 'bad_request' });
    }
  } catch (e) {
    console.error('[campaign]', e?.message, e?.cause?.message || '');
    return res.status(500).json({ error: 'server_error' });
  }
}
