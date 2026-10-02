/* global process, Buffer */
import { stripeClient, database, settleSession } from './_pilot.js';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let event;
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 1048576) return res.status(413).end();
      chunks.push(Buffer.from(chunk));
    }
    event = stripeClient().webhooks.constructEvent(Buffer.concat(chunks), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return res.status(400).json({ error: 'Invalid webhook signature or configuration' }); }
  if (event.livemode) return res.status(400).json({ error: 'Live events refused' });
  try {
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && event.data.object.payment_status === 'paid') {
      await settleSession(database(), event.data.object);
    }
    return res.status(200).json({ received: true });
  } catch { return res.status(500).json({ error: 'Order recording failed; retry webhook' }); }
}
