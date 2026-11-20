/* global Buffer, process */
import { createHash } from 'node:crypto';
import { proConfig, proStripe, proAdmin, fulfillProSession, revokeProPayment, fulfillProInvoice, syncProSubscription, cancelRefundedSubscription } from './_pro.js';

export const config = { api: { bodyParser: false } };
const id = value => typeof value === 'string' ? value : value?.id;
const PRO_FLOW = 'ayna_pro_early_access_v1';

function anonymousCheckoutId(value) {
  return `pro_checkout_${createHash('sha256').update(String(value || '')).digest('hex').slice(0, 24)}`;
}

// Plan-level billing events (renewals, cancellations) from Stripe objects that
// carry the Pro subscription metadata. Same anonymous id scheme as checkout so
// no person profile is created; keyed on the subscription so one subscriber's
// renewals line up. Stripe event id is the $insert_id, so webhook retries are
// deduplicated by PostHog.
export function proBillingEventPayload(event, { seed, plan, amount, currency, eventId, at, extra = {} }) {
  return {
    event,
    timestamp: at,
    properties: {
      distinct_id: anonymousCheckoutId(seed),
      source: 'stripe_webhook',
      plan: plan || 'unknown',
      amount: Number.isFinite(amount) ? amount / 100 : undefined,
      currency: String(currency || 'usd').toUpperCase(),
      ...(eventId ? { $insert_id: `${event}:${eventId}` } : {}),
      ...extra,
      $process_person_profile: false,
    },
  };
}

async function sendPosthog(payload) {
  const key = process.env.POSTHOG_PROJECT_KEY || process.env.VITE_PUBLIC_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return;
  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, ...payload }),
    });
  } catch {
    // Analytics must never block or fail payment fulfillment.
  }
}

function invoiceSubscriptionMetadata(invoice) {
  return invoice?.subscription_details?.metadata
    || invoice?.parent?.subscription_details?.metadata
    || {};
}

async function captureProPayment(event, session, at, eventId) {
  // VITE_PUBLIC_POSTHOG_KEY is already configured for production and is a
  // publishable client token. POSTHOG_PROJECT_KEY can override it later, but an
  // accidentally-empty override must never disable Stripe-confirmed events.
  const key = process.env.POSTHOG_PROJECT_KEY || process.env.VITE_PUBLIC_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key || session?.metadata?.flow !== PRO_FLOW) return;

  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event,
        timestamp: at,
        properties: {
          distinct_id: anonymousCheckoutId(session.id),
          source: 'stripe_webhook',
          plan: session.metadata?.plan || 'unknown',
          amount: Number.isFinite(session.amount_total) ? session.amount_total / 100 : undefined,
          currency: String(session.currency || 'usd').toUpperCase(),
          payment_status: session.payment_status || undefined,
          ...(eventId ? { $insert_id: `${event}:${eventId}` } : {}),
          $process_person_profile: false,
        },
      }),
    });
  } catch {
    // Analytics must never block or fail payment fulfillment.
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
      if (object.payment_status === 'paid') await captureProPayment('pro_payment_succeeded', object, at, event.id);
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = await stripe.checkout.sessions.retrieve(object.id);
      if (session.metadata?.flow === PRO_FLOW && session.payment_status !== 'paid' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(id(session.subscription));
        if (sub.status !== 'canceled') await stripe.subscriptions.cancel(sub.id);
        await syncProSubscription(stripe, admin, sub.id);
      }
      await captureProPayment('pro_payment_failed', session, at, event.id);
    } else if (event.type === 'invoice.paid') {
      await fulfillProInvoice(stripe, admin, object.id, at);
      const meta = invoiceSubscriptionMetadata(object);
      // subscription_cycle = a real renewal charge (not the first checkout invoice).
      if (meta.flow === PRO_FLOW && object.billing_reason === 'subscription_cycle') {
        await sendPosthog(proBillingEventPayload('subscription_renewed', {
          seed: id(object.subscription) || object.id, plan: meta.plan, amount: object.amount_paid,
          currency: object.currency, eventId: event.id, at,
        }));
      }
    } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncProSubscription(stripe, admin, object.id);
      if (object.metadata?.flow === PRO_FLOW) {
        const prev = event.data.previous_attributes || {};
        let name = null;
        if (event.type === 'customer.subscription.deleted') name = 'subscription_expired';
        else if (object.cancel_at_period_end && prev.cancel_at_period_end === false) name = 'subscription_cancelled';
        else if (!object.cancel_at_period_end && prev.cancel_at_period_end === true) name = 'subscription_reactivated';
        else if (object.status === 'past_due' && prev.status && prev.status !== 'past_due') name = 'pro_payment_past_due';
        if (name) {
          await sendPosthog(proBillingEventPayload(name, {
            seed: object.id, plan: object.metadata?.plan, currency: object.currency, eventId: event.id, at,
            extra: { subscription_status: object.status || undefined },
          }));
        }
      }
    } else if (event.type === 'charge.refunded' && object.refunded) {
      await revokeProPayment(admin, id(object.payment_intent), 'refund', at);
      await cancelRefundedSubscription(stripe, admin, id(object.payment_intent));
    } else if (event.type === 'charge.dispute.created') {
      const charge = await stripe.charges.retrieve(id(object.charge));
      await revokeProPayment(admin, id(charge.payment_intent), 'dispute', at);
      await cancelRefundedSubscription(stripe, admin, id(charge.payment_intent));
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[pro-webhook] fulfillment failed:', e?.name);
    return res.status(500).json({ error: 'fulfillment_failed' });
  }
}
