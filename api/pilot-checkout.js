/* global process */
import { pilotConfig, stripeClient, database, checked, signedIn, serviceFeeCents, purchasableProduct, selectedPilotVariant } from './_pilot.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  let step = 'config';
  try {
    const config = pilotConfig();
    if (req.method === 'GET') {
      const productId = String(req.query?.productId || config.productId);
      const variantId = String(req.query?.variantId || '');
      if (!config.enabled || !/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(productId) || variantId.length > 100) return res.status(200).json({ enabled: false, productId });
      const db = database();
      const product = checked(await db.from('product_catalog').select('id,category,product_type,requires_prescription,is_active,source,review_status,discovery_meta,extra').eq('id', productId).maybeSingle());
      if (!purchasableProduct(product) || !selectedPilotVariant(product, variantId)) return res.status(200).json({ enabled: false, productId });
      const price = checked(await db.from('pilot_product_prices').select('amount,currency,variant_label').eq('product_id', productId).eq('variant_id', variantId).maybeSingle());
      return res.status(200).json({ enabled: Boolean(price), productId, variantId, variantLabel: price?.variant_label || null, total: price ? price.amount + serviceFeeCents(price.amount) : null });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!config.enabled) return res.status(403).json({ error: 'Test checkout is not enabled.' });
    if (!config.vendor || !config.admins.length || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Pilot setup is incomplete.' });
    step = 'supabase_config';
    const db = database();
    step = 'auth';
    const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Please sign in to ayna before checking out.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(body.productId || '') || String(body.variantId || '').length > 100 || !/^[0-9a-f-]{36}$/i.test(body.attemptId || '')) return res.status(400).json({ error: 'Invalid checkout request.' });
    const limit = await rateLimit(`pilot:${user.id}`, { max: 10, windowSec: 60 });
    if (!limit.ok) return res.status(429).json({ error: 'Please wait before trying again.' });
    step = 'stripe_key';
    const stripe = stripeClient();
    step = 'orders_table';
    // Stable per user + browser attempt, including retries after a lost response.
    let order = checked(await db.from('pilot_orders').select('*').eq('user_id', user.id).eq('attempt_id', body.attemptId).maybeSingle());
    if (order && (order.product_id !== body.productId || String(order.variant_id || '') !== String(body.variantId || ''))) return res.status(409).json({ error: 'This checkout attempt belongs to another item. Start again.', restart: true });
    if (!order) {
      step = 'catalog_product';
      const product = checked(await db.from('product_catalog').select('id,name,category,product_type,requires_prescription,is_active,source,review_status,discovery_meta,extra').eq('id', body.productId).maybeSingle());
      const variant = selectedPilotVariant(product, String(body.variantId || ''));
      if (!purchasableProduct(product) || !variant) return res.status(400).json({ error: 'This item is not available for ayna checkout.' });
      step = 'retailer_price';
      const price = checked(await db.from('pilot_product_prices').select('amount,currency,retailer_url,variant_label').eq('product_id', product.id).eq('variant_id', variant.id).single());
      if (price.currency !== 'usd' || !Number.isSafeInteger(price.amount) || price.amount < 50 || price.amount > 50000) throw new Error('Invalid pilot price');
      step = 'create_order';
      const inserted = await db.from('pilot_orders').insert({
        user_id: user.id, attempt_id: body.attemptId, product_id: product.id,
        product_name: price.variant_label || variant.label ? `${product.name} — ${price.variant_label || variant.label}` : product.name,
        variant_id: variant.id, variant_label: price.variant_label || variant.label,
        stripe_price_id: `retailer:${price.amount}`, amount: price.amount + serviceFeeCents(price.amount),
        currency: price.currency, vendor_name: config.vendor, retailer_url: price.retailer_url,
      }).select('*').single();
      if (inserted.error?.code === '23505') order = checked(await db.from('pilot_orders').select('*').eq('user_id', user.id).eq('attempt_id', body.attemptId).single());
      else order = checked(inserted);
    }
    if (order.status === 'paid') return res.status(200).json({ url: `${config.origin}/pilot/orders`, restart: true });
    // Stripe only retains idempotency keys for 24h. Never reuse an older attempt.
    if (Date.now() - Date.parse(order.created_at) > 23 * 3600000) return res.status(409).json({ error: 'Checkout expired. Start a new checkout.', restart: true });
    step = 'stripe_checkout';
    // The order total was fixed when the order was created (product + fee), so a
    // later fee-setting change never alters an in-progress order.
    let lineItems = null;
    if (!order.stripe_session_id) {
      const dynamic = /^retailer:(\d+)$/.exec(order.stripe_price_id);
      const unit = dynamic ? Number(dynamic[1]) : (await stripe.prices.retrieve(order.stripe_price_id)).unit_amount;
      const fee = order.amount - unit;
      if (!Number.isSafeInteger(fee) || fee < 0) throw new Error('Order total does not match price');
      lineItems = dynamic
        ? [{ quantity: 1, price_data: { currency: order.currency, unit_amount: unit, product_data: { name: order.product_name } } }]
        : [{ price: order.stripe_price_id, quantity: 1 }];
      if (fee > 0) lineItems.push({ quantity: 1, price_data: { currency: order.currency, unit_amount: fee, product_data: { name: 'ayna service fee', description: 'Covers sourcing, packing and shipping coordination by the ayna team.' } } });
    }
    const session = order.stripe_session_id
      ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      : await stripe.checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'],
        line_items: lineItems,
        client_reference_id: user.id, metadata: { ayna_order_id: order.id },
        shipping_address_collection: { allowed_countries: ['US'] },
        success_url: `${config.origin}/pilot/orders`,
        cancel_url: `${config.origin}/pilot/orders?pilot_cancelled=1`,
        custom_text: { submit: { message: 'Test order only. No real payment or shipment.' } },
      }, { idempotencyKey: `ayna-pilot-${order.id}` });
    if (session.livemode) throw new Error('Live checkout refused');
    checked(await db.from('pilot_orders').update({ stripe_session_id: session.id }).eq('id', order.id));
    if (!session.url || session.status !== 'open') return res.status(409).json({ error: 'Checkout is complete or expired. View your orders or start again.', restart: true });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    // Test pilot only: surface which setup step failed (a fixed label, no secrets).
    console.error('[pilot-checkout] failed at', step, e?.type || e?.code || '', String(e?.message || '').slice(0, 200));
    return res.status(503).json({ error: `Test checkout is unavailable (step: ${step}). Check the pilot configuration and try again.`, step });
  }
}
