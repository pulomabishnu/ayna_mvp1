/* global process */
import { pilotConfig, stripeClient, database, checked, signedIn } from './_pilot.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const config = pilotConfig();
    if (req.method === 'GET') return res.status(200).json({ enabled: config.enabled, productId: config.productId });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!config.enabled) return res.status(403).json({ error: 'Test checkout is not enabled.' });
    if (!config.priceId || !config.vendor || !config.admins.length || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Pilot setup is incomplete.' });
    const db = database();
    const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Please sign in to ayna before checking out.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (body.productId !== config.productId || !/^[0-9a-f-]{36}$/i.test(body.attemptId || '')) return res.status(400).json({ error: 'Invalid checkout request.' });
    const limit = await rateLimit(`pilot:${user.id}`, { max: 10, windowSec: 60 });
    if (!limit.ok) return res.status(429).json({ error: 'Please wait before trying again.' });
    const stripe = stripeClient();
    // Stable per user + browser attempt, including retries after a lost response.
    let order = checked(await db.from('pilot_orders').select('*').eq('user_id', user.id).eq('attempt_id', body.attemptId).maybeSingle());
    if (!order) {
      const product = checked(await db.from('product_catalog').select('id,name').eq('id', config.productId).single());
      const price = await stripe.prices.retrieve(config.priceId, { expand: ['product'] });
      if (price.livemode || !price.active || price.currency !== 'usd' || price.type !== 'one_time' || !Number.isSafeInteger(price.unit_amount) || price.unit_amount <= 0 || price.product?.deleted || !price.product?.active || price.metadata?.ayna_product_id !== product.id) throw new Error('Invalid pilot price');
      const inserted = await db.from('pilot_orders').insert({
        user_id: user.id, attempt_id: body.attemptId, product_id: product.id,
        product_name: product.name, stripe_price_id: price.id, amount: price.unit_amount,
        currency: price.currency, vendor_name: config.vendor,
      }).select('*').single();
      if (inserted.error?.code === '23505') order = checked(await db.from('pilot_orders').select('*').eq('user_id', user.id).eq('attempt_id', body.attemptId).single());
      else order = checked(inserted);
    }
    if (order.status === 'paid') return res.status(200).json({ url: `${config.origin}/pilot/orders`, restart: true });
    // Stripe only retains idempotency keys for 24h. Never reuse an older attempt.
    if (Date.now() - Date.parse(order.created_at) > 23 * 3600000) return res.status(409).json({ error: 'Checkout expired. Start a new checkout.', restart: true });
    const session = order.stripe_session_id
      ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      : await stripe.checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'],
        line_items: [{ price: order.stripe_price_id, quantity: 1 }],
        client_reference_id: user.id, metadata: { ayna_order_id: order.id },
        shipping_address_collection: { allowed_countries: ['US'] },
        success_url: `${config.origin}/pilot/orders`,
        cancel_url: `${config.origin}/product/always-infinity-flexfoam?pilot_cancelled=1`,
        custom_text: { submit: { message: 'Test order only. No real payment or shipment.' } },
      }, { idempotencyKey: `ayna-pilot-${order.id}` });
    if (session.livemode) throw new Error('Live checkout refused');
    checked(await db.from('pilot_orders').update({ stripe_session_id: session.id }).eq('id', order.id));
    if (!session.url || session.status !== 'open') return res.status(409).json({ error: 'Checkout is complete or expired. View your orders or start again.', restart: true });
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(503).json({ error: 'Test checkout is unavailable. Check the pilot configuration and try again.' });
  }
}
