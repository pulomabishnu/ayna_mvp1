/* global process, Buffer */
import { pilotConfig, stripeClient, database, settleSession, checked, notifyTeam } from './_pilot.js';
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
  if (event.livemode !== (pilotConfig().paymentMode === 'live')) return res.status(400).json({ error: 'Payment mode mismatch' });
  try {
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && event.data.object.payment_status === 'paid') {
      const db = database(); const session = event.data.object;
      const orderId = session.metadata?.ayna_order_id;
      const before = orderId ? checked(await db.from('pilot_orders').select('status,product_name,amount,currency').eq('id', orderId).maybeSingle()) : null;
      await settleSession(db, session);
      // Notify only on the first transition to paid, not on Stripe retries/replays.
      if (before && before.status !== 'paid') await notifyTeam(before, session);
    }
    return res.status(200).json({ received: true });
  } catch { return res.status(500).json({ error: 'Order recording failed; retry webhook' }); }
}
