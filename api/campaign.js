/* global process */
/**
 * Free product campaign API. The only way the browser touches campaign data.
 *
 *   GET  /api/campaign                    progress for the signed-in person
 *   POST /api/campaign { action: 'feedback', questionKey, response }
 *   POST /api/campaign { action: 'spin' }
 *   POST /api/campaign { action: 'claim', rewardId, spinId, idempotencyKey }
 *   POST /api/campaign { action: 'shipping', address }
 *   GET  /api/campaign?sweep=1             daily cron: "unlocked" emails (CRON_SECRET)
 *
 * Every decision (verified, counts, eligibility, what the spin lands on,
 * whether a claim succeeds) is made by Postgres functions in
 * supabase/migrations/20261015120000_free_product_campaign.sql, called with
 * the service role. Nothing the client sends is trusted beyond "which
 * question" / "which spin".
 */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { claimedEmail, sendEmail, unlockedEmail, unsubscribeUrl, SITE } from './_campaignEmail.js';
import {
  CAMPAIGN_ID, FEEDBACK_MESSAGES, feedbackProblem, questionFor, shippingProblems, tooSimilar,
} from '../src/utils/campaignRules.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_RE = /^[A-Za-z0-9_-]{16,80}$/;

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

const tooMany = (res, rl) => {
  res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
  return res.status(429).json({ error: 'rate_limited' });
};

async function rpc(admin, fn, args) {
  const { data, error } = await admin.rpc(fn, args);
  if (error) {
    const err = new Error(error.message || 'rpc_error');
    err.code = error.code;
    throw err;
  }
  return data;
}

/** Turns DB rows into what the page needs. Never includes other people's details. */
export async function buildStatus(admin, user) {
  const p = await rpc(admin, 'campaign_progress', { p_user: user.id, p_campaign: CAMPAIGN_ID });
  if (!p?.campaign) return { campaign: null };

  const [{ data: answers }, friends, code] = await Promise.all([
    admin.from('campaign_feedback').select('question_key, response, char_count, updated_at')
      .eq('campaign_id', CAMPAIGN_ID).eq('user_id', user.id),
    rpc(admin, 'campaign_referral_rows', { p_user: user.id, p_campaign: CAMPAIGN_ID }),
    rpc(admin, 'ayna_get_referral_code', { p_user: user.id }),
  ]);

  let claim = null;
  if (p.claim) {
    const [{ data: product }, { data: ship }] = await Promise.all([
      admin.from('product_catalog').select('id, name, brand, category, image, summary').eq('id', p.claim.product_id).maybeSingle(),
      admin.from('campaign_shipping').select('full_name, address_line1, address_line2, city, state, postal_code, email')
        .eq('claim_id', p.claim.id).maybeSingle(),
    ]);
    claim = {
      id: p.claim.id,
      claimedAt: p.claim.claimed_at,
      status: p.claim.fulfillment_status,
      product: {
        id: p.claim.product_id,
        name: product?.name || p.claim.product_name,
        brand: product?.brand || p.claim.product_brand || null,
        category: product?.category || null,
        image: product?.image || null,
        summary: product?.summary || null,
      },
      // Her own address, shown back only to her so she can check or edit it.
      shipping: ship ? {
        fullName: ship.full_name, line1: ship.address_line1, line2: ship.address_line2 || '',
        city: ship.city, state: ship.state, postal: ship.postal_code, email: ship.email,
      } : null,
    };
  }

  return {
    campaign: {
      id: p.campaign.id,
      open: Boolean(p.campaign.open),
      endsAt: p.campaign.ends_at,
      minChars: p.campaign.feedback_min_chars,
      friendsRequired: p.campaign.referrals_required,
    },
    verified: Boolean(p.verified),
    feedbackDone: Array.isArray(p.feedback_done) ? p.feedback_done : [],
    answers: Object.fromEntries((answers || []).map((a) => [a.question_key, { response: a.response, chars: a.char_count }])),
    friendsJoined: p.referrals_joined || 0,
    friendsVerified: p.referrals_verified || 0,
    friendsRequired: p.campaign.referrals_required,
    // Friend 1, Friend 2... and a status. No names, emails or ids.
    friends: (friends || []).map((f, i) => ({
      label: `Friend ${i + 1}`,
      status: f.verified ? 'verified' : 'joined',
      joinedAt: f.joined_at ? String(f.joined_at).slice(0, 10) : null,
    })),
    referralLink: code ? `${SITE}/join?ref=${code}` : null,
    eligible: Boolean(p.eligible),
    inventoryAvailable: Boolean(p.inventory_available),
    claim,
  };
}

async function handleStatus(admin, user, res) {
  const status = await buildStatus(admin, user);
  // She's looking at the unlock right now: record it so the daily sweep
  // doesn't also email her about it.
  if (status.eligible) {
    await admin.from('campaign_email_log')
      .upsert({ user_id: user.id, campaign_id: CAMPAIGN_ID, kind: 'unlocked' }, { onConflict: 'user_id,campaign_id,kind', ignoreDuplicates: true })
      .then(() => {}, () => {});
  }
  return res.status(200).json(status);
}

async function handleFeedback(admin, user, body, res) {
  const rl = await rateLimit(`campaign:feedback:${user.id}`, { max: 30, windowSec: 600 });
  if (!rl.ok) return tooMany(res, rl);

  const key = String(body.questionKey || '');
  const question = questionFor(key);
  if (!question) return res.status(400).json({ error: 'unknown_question' });
  const response = typeof body.response === 'string' ? body.response.replace(/\0/g, '').trim() : '';

  const progress = await rpc(admin, 'campaign_progress', { p_user: user.id, p_campaign: CAMPAIGN_ID });
  if (!progress?.campaign?.open) return res.status(409).json({ error: 'campaign_closed' });
  if (progress.claim) return res.status(409).json({ error: 'already_claimed' });
  const min = progress.campaign.feedback_min_chars;

  const problem = feedbackProblem(response, min);
  if (problem) return res.status(422).json({ error: problem, message: FEEDBACK_MESSAGES[problem](min) });

  const { data: others } = await admin.from('campaign_feedback').select('question_key, response')
    .eq('campaign_id', CAMPAIGN_ID).eq('user_id', user.id).neq('question_key', key);
  if ((others || []).some((o) => tooSimilar(o.response, response))) {
    return res.status(422).json({ error: 'duplicate', message: FEEDBACK_MESSAGES.duplicate() });
  }

  const { error } = await admin.from('campaign_feedback').upsert({
    campaign_id: CAMPAIGN_ID, user_id: user.id, question_key: key, question: question.label, response,
  }, { onConflict: 'campaign_id,user_id,question_key' });
  if (error) {
    if (error.code === '23505') return res.status(422).json({ error: 'duplicate', message: FEEDBACK_MESSAGES.duplicate() });
    if (/feedback_too_short/.test(error.message)) return res.status(422).json({ error: 'too_short', message: FEEDBACK_MESSAGES.too_short(min) });
    if (/feedback_low_effort/.test(error.message)) return res.status(422).json({ error: 'low_effort', message: FEEDBACK_MESSAGES.low_effort() });
    throw new Error(error.message);
  }
  return res.status(200).json({ ok: true, status: await buildStatus(admin, user) });
}

async function handleSpin(admin, user, res) {
  const rl = await rateLimit(`campaign:spin:${user.id}`, { max: 60, windowSec: 600 });
  if (!rl.ok) return tooMany(res, rl);
  const r = await rpc(admin, 'campaign_spin', { p_user: user.id, p_campaign: CAMPAIGN_ID });
  if (r?.status === 'ok') {
    return res.status(200).json({
      status: 'ok', spinId: r.spin_id, spinCount: r.spin_count, rewardId: r.reward_id, product: r.product,
    });
  }
  const code = { not_eligible: 403, already_claimed: 409, empty: 409 }[r?.status] || 500;
  return res.status(code).json({ status: r?.status || 'error' });
}

async function handleClaim(admin, user, body, res) {
  const rl = await rateLimit(`campaign:claim:${user.id}`, { max: 20, windowSec: 600, failClosed: false });
  if (!rl.ok) return tooMany(res, rl);
  const rewardId = String(body.rewardId || '');
  const spinId = Number(body.spinId);
  const key = String(body.idempotencyKey || '');
  if (!UUID_RE.test(rewardId) || !Number.isSafeInteger(spinId) || spinId <= 0 || !KEY_RE.test(key)) {
    return res.status(400).json({ error: 'bad_request' });
  }

  const r = await rpc(admin, 'campaign_claim', {
    p_user: user.id, p_campaign: CAMPAIGN_ID, p_reward: rewardId, p_spin_id: spinId, p_idempotency_key: key,
  });

  if (r?.status === 'claimed') {
    // Confirmation email, at most once (the log row is the guard).
    if (user.email) {
      const { data: logged } = await admin.from('campaign_email_log')
        .upsert({ user_id: user.id, campaign_id: CAMPAIGN_ID, kind: 'claimed' }, { onConflict: 'user_id,campaign_id,kind', ignoreDuplicates: true })
        .select('kind');
      if (logged?.length) {
        const mail = claimedEmail({ email: user.email, productName: r.product_name, productBrand: r.product_brand });
        await sendEmail({ to: user.email, ...mail, unsubscribe: unsubscribeUrl(user.email), idempotencyKey: `claimed-${r.claim_id}` });
      }
    }
    return res.status(200).json({ status: 'claimed', spinsBeforeClaim: r.spins_before_claim, productId: r.product_id, claim: (await buildStatus(admin, user)).claim });
  }
  if (r?.status === 'already_claimed') {
    // Same request replayed (double click, refresh): same answer, 200.
    const claim = (await buildStatus(admin, user)).claim;
    return res.status(r.same_request ? 200 : 409).json({ status: 'already_claimed', claim });
  }
  const code = { out_of_stock: 409, stale_spin: 409, not_eligible: 403 }[r?.status] || 500;
  return res.status(code).json({ status: r?.status || 'error' });
}

async function handleShipping(admin, user, body, res) {
  const rl = await rateLimit(`campaign:shipping:${user.id}`, { max: 15, windowSec: 600 });
  if (!rl.ok) return tooMany(res, rl);
  const a = body.address && typeof body.address === 'object' ? body.address : {};
  const errors = shippingProblems(a);
  if (Object.keys(errors).length) return res.status(422).json({ error: 'invalid_address', fields: errors });
  const s = (k) => String(a[k] ?? '').replace(/\0/g, '').trim();
  try {
    const r = await rpc(admin, 'campaign_save_shipping', {
      p_user: user.id, p_campaign: CAMPAIGN_ID, p_full_name: s('fullName'), p_line1: s('line1'), p_line2: s('line2'),
      p_city: s('city'), p_state: s('state').toUpperCase(), p_postal: s('postal'), p_email: s('email').toLowerCase(),
    });
    if (r?.status === 'no_claim') return res.status(409).json({ error: 'no_claim' });
    if (r?.status === 'locked') return res.status(409).json({ error: 'already_shipped' });
  } catch (e) {
    if (e.code === '23514') return res.status(422).json({ error: 'invalid_address', fields: {} });
    throw e;
  }
  return res.status(200).json({ ok: true, status: await buildStatus(admin, user) });
}

/** Daily cron: email people who became eligible while they weren't on the page. */
async function handleSweep(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || (req.headers.authorization || '') !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });
  const admin = getAdmin();
  if (!admin) return res.status(503).json({ error: 'server_misconfigured' });
  const candidates = await rpc(admin, 'campaign_unlock_candidates', { p_campaign: CAMPAIGN_ID, p_limit: 200 });
  let sent = 0;
  for (const c of candidates || []) {
    const { data: logged } = await admin.from('campaign_email_log')
      .upsert({ user_id: c.user_id, campaign_id: CAMPAIGN_ID, kind: 'unlocked' }, { onConflict: 'user_id,campaign_id,kind', ignoreDuplicates: true })
      .select('kind');
    if (!logged?.length) continue;
    const r = await sendEmail({ to: c.email, ...unlockedEmail({ email: c.email }), unsubscribe: unsubscribeUrl(c.email), idempotencyKey: `unlocked-${c.user_id}` });
    if (r.ok) sent += 1;
  }
  return res.status(200).json({ candidates: (candidates || []).length, sent });
}

export default async function handler(req, res) {
  privateHeaders(res);
  try {
    if (req.method === 'GET' && (req.query?.sweep === '1')) return await handleSweep(req, res);
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    const { user, error, admin } = await verifyUser(req);
    if (!user) {
      return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
    }
    // Community guests have real (anonymous) sessions. They are not accounts.
    if (user.is_anonymous) return res.status(401).json({ error: 'auth_required' });

    if (req.method === 'GET') return await handleStatus(admin, user, res);

    const body = parseBody(req);
    switch (body.action) {
      case 'feedback': return await handleFeedback(admin, user, body, res);
      case 'spin': return await handleSpin(admin, user, res);
      case 'claim': return await handleClaim(admin, user, body, res);
      case 'shipping': return await handleShipping(admin, user, body, res);
      default: return res.status(400).json({ error: 'unknown_action' });
    }
  } catch (e) {
    console.error('[campaign]', e?.message);
    return res.status(500).json({ error: 'server_error' });
  }
}

