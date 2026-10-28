/* global Buffer */
import { createHash } from 'node:crypto';
import { proConfig, proStripe, proAdmin, fulfillProSession, revokeProPayment, fulfillProInvoice, syncProSubscription, cancelRefundedSubscription } from './_pro.js';

export const config = { api: { bodyParser: false } };
const id = value => typeof value === 'string' ? value : value?.id;
const PRO_FLOW = 'ayna_pro_early_access_v1';

function anonymousObjectId(value) {
  return `pro_${createHash('sha256').update(String(value || '')).digest('hex').slice(0, 24)}`;
}

function cents(value) {
  return Number.isFinite(Number(value)) ? Number(value) / 100 : undefined;
}

async function captureProFinance(eventName, object, at, stripeEventId, extra = {}) {
  const key = process.env.POSTHOG_PROJECT_KEY || process.env.VITE_PUBLIC_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return;
  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: eventName,
        timestamp: at,
        properties: {
          distinct_id: anonymousObjectId(object?.id || stripeEventId),
          source: 'stripe_webhook',
          plan: extra.plan || object?.metadata?.plan || 'unknown',
          amount: extra.amount,
          currency: String(extra.currency || object?.currency || 'usd').toUpperCase(),
          payment_status: extra.payment_status || object?.payment_status || object?.status || undefined,
          reason: extra.reason,
          // Stripe retries webhook events. $insert_id makes the money event idempotent in PostHog.
          $insert_id: `stripe_${stripeEventId}_${eventName}`,
          $process_person_profile: false,
        },
      }),
    });
  } catch {
    // Analytics must never block or fail payment fulfillment.
  }
}

async function proSubscriptionContext(stripe, subscriptionId) {
  if (!subscriptionId) return null;
  try {
    const sub = await stripe.subscriptions.retrieve(id(subscriptionId));
    if (sub?.metadata?.flow !== PRO_FLOW) return null;
    return { sub, plan: sub.metadata?.plan || 'unknown' };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let stripe, settings;
  try { settings = proConfig(); stripe = proStripe(); }
  catch { return res.status(503).json({ error: 'webhook_not_configured' }); }
  let event;
  try {
    let raw = req.rawBody;
    if (!raw) {
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 1024 * 1024) return res.status(413).end();
        chunks.push(Buffer.from(chunk));
      }
      raw = Buffer.concat(chunks);
    }
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], settings.webhookSecret);
  } catch { return res.status(400).json({ error: 'invalid_signature' }); }
  if (event.livemode !== settings.livemode) return res.status(400).json({ error: 'wrong_mode' });
  try {
    const admin = proAdmin();
    const object = event.data.object;
    const at = new Date(event.created * 1000).toISOString();

    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      await fulfillProSession(stripe, admin, object.id, at);
      if (object.payment_status === 'paid' && object.metadata?.flow === PRO_FLOW) {
        await captureProFinance('pro_payment_succeeded', object, at, event.id, {
          plan: object.metadata?.plan,
          amount: cents(object.amount_total),
          currency: object.currency,
          payment_status: object.payment_status,
        });
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = await stripe.checkout.sessions.retrieve(object.id);
      if (session.metadata?.flow === PRO_FLOW && session.payment_status !== 'paid' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(id(session.subscription));
        if (sub.status !== 'canceled') await stripe.subscriptions.cancel(sub.id);
        await syncProSubscription(stripe, admin, sub.id);
      }
      if (session.metadata?.flow === PRO_FLOW) {
        await captureProFinance('pro_payment_failed', session, at, event.id, {
          plan: session.metadata?.plan,
          amount: cents(session.amount_total),
          currency: session.currency,
          payment_status: session.payment_status,
        });
      }
    } else if (event.type === 'invoice.paid') {
      await fulfillProInvoice(stripe, admin, object.id, at);
      const ctx = await proSubscriptionContext(stripe, object.subscription);
      if (ctx) {
        await captureProFinance('pro_renewal_succeeded', object, at, event.id, {
          plan: ctx.plan,
          amount: cents(object.amount_paid),
          currency: object.currency,
          payment_status: object.status,
        });
      }
    } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncProSubscription(stripe, admin, object.id);
      if (object.metadata?.flow === PRO_FLOW && event.type === 'customer.subscription.deleted') {
        await captureProFinance('pro_subscription_canceled', object, at, event.id, {
          plan: object.metadata?.plan,
          payment_status: object.status,
        });
      }
    } else if (event.type === 'charge.refunded' && object.refunded) {
      await revokeProPayment(admin, id(object.payment_intent), 'refund', at);
      await cancelRefundedSubscription(stripe, admin, id(object.payment_intent));
      let ctx = null;
      if (object.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(id(object.invoice));
          ctx = await proSubscriptionContext(stripe, invoice.subscription);
        } catch { /* finance analytics only */ }
      }
      if (ctx) {
        await captureProFinance('pro_payment_refunded', object, at, event.id, {
          plan: ctx.plan,
          amount: cents(object.amount_refunded),
          currency: object.currency,
          reason: 'refund',
        });
      }
    } else if (event.type === 'charge.dispute.created') {
      const charge = await stripe.charges.retrieve(id(object.charge));
      await revokeProPayment(admin, id(charge.payment_intent), 'dispute', at);
      await cancelRefundedSubscription(stripe, admin, id(charge.payment_intent));
      let ctx = null;
      if (charge.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(id(charge.invoice));
          ctx = await proSubscriptionContext(stripe, invoice.subscription);
        } catch { /* finance analytics only */ }
      }
      if (ctx) {
        await captureProFinance('pro_payment_disputed', object, at, event.id, {
          plan: ctx.plan,
          amount: cents(object.amount),
          currency: object.currency,
          reason: object.reason || 'dispute',
        });
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[pro-webhook] fulfillment failed:', e?.name);
    return res.status(500).json({ error: 'fulfillment_failed' });
  }
}
