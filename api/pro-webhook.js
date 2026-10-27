/* global Buffer */
import { proConfig, proStripe, proAdmin, fulfillProSession, revokeProPayment, fulfillProInvoice, syncProSubscription, cancelRefundedSubscription } from './_pro.js';

export const config = { api: { bodyParser: false } };
const id = value => typeof value === 'string' ? value : value?.id;

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
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = await stripe.checkout.sessions.retrieve(object.id);
      if (session.metadata?.flow === 'ayna_pro_early_access_v1' && session.payment_status !== 'paid' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(id(session.subscription));
        if (sub.status !== 'canceled') await stripe.subscriptions.cancel(sub.id);
        await syncProSubscription(stripe, admin, sub.id);
      }
    } else if (event.type === 'invoice.paid') {
      await fulfillProInvoice(stripe, admin, object.id, at);
    } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncProSubscription(stripe, admin, object.id);
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
