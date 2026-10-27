/* global process */
import { createHash } from 'node:crypto';
import { verifyUser, getServiceClient } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { proFeatureRules } from './_proFeatures.js';
import { PRO_FLOW, PRO_PLANS, proConfig, proStatus, proStripe, validateProPrices, renewalDate, syncProSubscription } from './_pro.js';

function isAdminUser(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return false;
  const allowed = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET' && req.query?.action === 'features') {
    try { return res.status(200).json(await proFeatureRules(getServiceClient())); }
    catch { return res.status(503).json({ error: 'pro_temporarily_unavailable' }); }
  }

  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });

  const { user, admin, error } = await verifyUser(req);
  if (!user) return res.status(error === 'server_misconfigured' ? 503 : 401).json({ error: 'sign_in_required' });

  try {
    let config;
    try { config = proConfig(); } catch { config = { enabled: false }; }
    const status = await proStatus(admin, user.id);
    const legacyPremium = user?.app_metadata?.is_premium === true;
    const active = legacyPremium || status.active;
    const offerOpen = config.enabled && Boolean(status.launchAt) && Date.parse(status.launchAt) > Date.now();
    const isAdmin = isAdminUser(user);

    if (req.method === 'GET') {
      return res.status(200).json({
        ...status,
        active,
        offerOpen,
        isAdmin,
        plans: Object.entries(PRO_PLANS).map(([id, plan]) => ({
          id,
          amount: plan.amount,
          regularAmount: plan.regularAmount,
          label: plan.label,
        })),
      });
    }

    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
    catch { return res.status(400).json({ error: 'invalid_request' }); }

    if (body.action === 'read') {
      const rules = await proFeatureRules(admin);
      if (!rules.enabled || !rules.premiumReadIds.includes(body.readId)) return res.status(200).json({ allowed: true });
      const { data, error: readError } = await admin.rpc('pro_claim_read', {
        p_user_id: user.id,
        p_read_id: body.readId,
        p_unlimited: active,
      });
      if (readError) throw new Error('Read allowance unavailable');
      return res.status(200).json({ allowed: data === true, active });
    }

    if (body.action === 'feature_gates_set') {
      if (!isAdmin) return res.status(403).json({ error: 'forbidden' });
      if (typeof body.enabled !== 'boolean') return res.status(400).json({ error: 'invalid_enabled' });
      const { error: rulesError } = await admin
        .from('pro_feature_rules')
        .update({ enabled: body.enabled })
        .eq('id', true);
      if (rulesError) throw new Error('Pro feature gate update failed');
      const rules = await proFeatureRules(admin);
      console.info('[pro] feature gates updated', { enabled: rules.enabled, admin: user.email });
      return res.status(200).json(rules);
    }

    if (body.action === 'focus_grant' || body.action === 'focus_revoke') {
      if (!isAdmin) return res.status(403).json({ error: 'forbidden' });
      if (!/^[0-9a-f-]{36}$/i.test(body.userId || '')) return res.status(400).json({ error: 'invalid_user' });
      const minutes = Math.min(Math.max(Number(body.minutes) || 60, 1), 240);
      const expiresAt = body.action === 'focus_revoke'
        ? new Date().toISOString()
        : new Date(Date.now() + minutes * 60000).toISOString();
      const { error: grantError } = await admin.from('pro_focus_grants').upsert({ user_id: body.userId, expires_at: expiresAt }, { onConflict: 'user_id' });
      if (grantError) throw new Error('Focus grant failed');
      return res.status(200).json({ expiresAt });
    }

    if (body.action === 'cancel_renewal') {
      const { data, error: subscriptionError } = await admin.from('pro_subscriptions').select('subscription_id').eq('user_id', user.id);
      if (subscriptionError) throw new Error('Subscription unavailable');
      const stripe = proStripe();
      for (const row of data || []) {
        const sub = await stripe.subscriptions.retrieve(row.subscription_id);
        if (!['canceled', 'incomplete_expired'].includes(sub.status)) {
          await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
        }
        await syncProSubscription(stripe, admin, sub.id);
      }
      return res.status(200).json({ canceled: true });
    }

    if (!offerOpen) return res.status(409).json({ error: 'early_access_closed' });
    if (status.hasPurchase || legacyPremium) return res.status(409).json({ error: 'already_pro' });

    const limit = await rateLimit(`pro:checkout:${user.id}`, { max: 5, windowSec: 600 });
    if (!limit.ok) return res.status(429).json({ error: 'try_again_later' });
    if (!Object.hasOwn(PRO_PLANS, body.plan)) return res.status(400).json({ error: 'invalid_plan' });
    if (!/^[0-9a-f-]{36}$/i.test(body.requestId || '')) return res.status(400).json({ error: 'invalid_request_id' });

    const stripe = proStripe();
    const offer = PRO_PLANS[body.plan];
    const { renewal, coupon } = await validateProPrices(stripe, body.plan);
    const renewAt = renewalDate(status.launchAt, body.plan);
    if (renewAt < Date.now() / 1000 + 172800 || renewAt > Date.now() / 1000 + 730 * 86400) throw new Error('Unsupported launch date');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: config.product,
            unit_amount: offer.standardAmount,
          },
          quantity: 1,
        },
        { price: renewal, quantity: 1 },
      ],
      discounts: [{ coupon }],
      client_reference_id: user.id,
      metadata: { flow: PRO_FLOW, user_id: user.id, plan: body.plan, launch_at: status.launchAt, renew_at: String(renewAt) },
      subscription_data: {
        trial_end: renewAt,
        billing_mode: { type: 'flexible' },
        metadata: { flow: PRO_FLOW, user_id: user.id, plan: body.plan },
      },
      integration_identifier: `ayna_pro_${createHash('sha256').update(body.requestId).digest().subarray(0, 8).reduce((s, b) => s + String.fromCharCode(97 + b % 26), '')}`,
      success_url: `${config.origin}/pro?checkout=success`,
      cancel_url: `${config.origin}/pro?checkout=canceled`,
      custom_text: {
        submit: {
          message: 'Your Early Access coupon is applied today. Your purchased period starts at launch; then renews at the regular price shown unless canceled.',
        },
      },
    }, { idempotencyKey: `pro:${user.id}:${body.plan}:${body.requestId}` });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[pro] request failed', {
      type: e?.type || e?.name,
      code: e?.code || e?.raw?.code || null,
      statusCode: e?.statusCode || e?.raw?.statusCode || null,
      param: e?.param || e?.raw?.param || null,
      requestId: e?.requestId || e?.raw?.requestId || null,
      message: e?.message || e?.raw?.message || null,
    });
    return res.status(503).json({ error: 'pro_temporarily_unavailable' });
  }
}
