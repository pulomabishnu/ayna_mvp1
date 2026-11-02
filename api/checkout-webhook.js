/* global Buffer */
import { checkoutAdmin, checkoutStripe, checkoutWebhookSecret, fulfillCheckout } from './_checkoutCore.js';

export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let stripe, secret;
  try { secret = checkoutWebhookSecret(); stripe = checkoutStripe(); }
  catch { return res.status(503).json({ error: 'checkout_not_configured' }); }
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
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], secret);
  } catch { return res.status(400).json({ error: 'invalid_signature' }); }
  if (event.livemode) return res.status(400).json({ error: 'wrong_mode' });
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type))
    return res.status(200).json({ received: true });
  try {
    await fulfillCheckout(checkoutAdmin(), stripe, event.data.object.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[checkout-webhook] fulfillment failed:', error?.message);
    return res.status(500).json({ error: 'fulfillment_failed' });
  }
}
