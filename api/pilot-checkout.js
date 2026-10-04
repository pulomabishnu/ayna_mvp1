/* global process */
import { pilotConfig, stripeClient, database, checked, signedIn } from './_pilot.js';
import { normalizeCartItems, cartKey, buildCartQuote, publicQuote, orderSummaryName, orderItemsPayload, stripeLineItems } from './_pilotCart.js';
import { rateLimit } from './_rateLimit.js';

const UUID = /^[0-9a-f-]{36}$/i;
const parseBody = req => (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {});
const clientIp = req => String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  let step = 'config';
  try {
    const config = pilotConfig();
    const fallback = config.paymentMode === 'test';

    // Product page: price for one option at a chosen quantity (server-calculated).
    if (req.method === 'GET') {
      const productId = String(req.query?.productId || config.productId);
      const variantId = String(req.query?.variantId || '');
      const quantity = Number(req.query?.quantity || 1);
      const items = normalizeCartItems([{ productId, variantId, quantity }]);
      if (!config.enabled || !items) return res.status(200).json({ enabled: false, productId, variantId });
      const quote = await buildCartQuote(database(), items, { allowCatalogFallback: fallback });
      const line = quote.lines[0];
      if (line.reason === 'unavailable') return res.status(200).json({ enabled: false, productId, variantId });
      return res.status(200).json({
        enabled: quote.ready, requestable: line.reason === 'price_needed', paymentMode: config.paymentMode, taxIncluded: config.taxIncluded,
        productId, variantId, variantLabel: line.variantLabel, quantity, serviceFeePercent: config.serviceFeePercent,
        unitCents: line.available ? line.unit : null, total: quote.totals?.total ?? null, totals: quote.totals,
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!config.enabled) return res.status(403).json({ error: 'Checkout is not enabled.' });
    const body = parseBody(req);

    // Cart page: re-price every line on the server. Public, like the product page quote.
    if (body.action === 'quote') {
      const items = normalizeCartItems(body.items);
      if (!items) return res.status(400).json({ error: 'Invalid cart.' });
      const limit = await rateLimit(`pilot-quote:${clientIp(req)}`, { max: 60, windowSec: 60 });
      if (!limit.ok) return res.status(429).json({ error: 'Please wait before trying again.' });
      return res.status(200).json(publicQuote(await buildCartQuote(database(), items, { allowCatalogFallback: fallback }), config));
    }

    if (!config.vendor || !config.admins.length || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Pilot setup is incomplete.' });
    step = 'supabase_config';
    const db = database();
    step = 'auth';
    const user = await signedIn(req, db);
    if (!user) return res.status(401).json({ error: 'Please sign in to ayna before checking out.' });
    // Buy now sends one item; the cart sends many. Both use this same path.
    const items = normalizeCartItems(body.items ?? (body.productId ? [{ productId: body.productId, variantId: body.variantId, quantity: body.quantity }] : null));
    if (!items || !UUID.test(body.attemptId || '')) return res.status(400).json({ error: 'Invalid checkout request.' });
    const limit = await rateLimit(`pilot:${user.id}`, { max: 10, windowSec: 60 });
    if (!limit.ok) return res.status(429).json({ error: 'Please wait before trying again.' });
    step = 'stripe_key';
    const stripe = stripeClient();
    step = 'orders_table';
    const key = cartKey(items);
    // Stable per user + browser attempt, including retries after a lost response.
    let order = checked(await db.from('pilot_orders').select('*').eq('user_id', user.id).eq('attempt_id', body.attemptId).maybeSingle());
    if (order && order.cart_key !== key) return res.status(409).json({ error: 'This checkout attempt belongs to a different cart. Start again.', restart: true });
    if (!order) {
      step = 'price_cart';
      const quote = await buildCartQuote(db, items, { allowCatalogFallback: fallback });
      if (!quote.ready) {
        const message = quote.error === 'cart_too_large' ? 'This cart is too large for one order. Remove an item or reduce a quantity.'
          : quote.lines.some(l => l.reason === 'unavailable') ? 'An item in your cart is no longer available for ayna checkout.'
            : 'The price for an item needs to be confirmed before checkout.';
        return res.status(409).json({ error: message, lines: publicQuote(quote, config).lines });
      }
      step = 'create_order';
      const { merchandise, fee, processing, total } = quote.totals;
      const created = await db.rpc('pilot_create_order', {
        p_user_id: user.id, p_attempt_id: body.attemptId, p_name: orderSummaryName(quote.lines), p_vendor: config.vendor,
        p_currency: 'usd', p_cart_key: key, p_subtotal: merchandise, p_fee: fee, p_processing: processing, p_amount: total,
        p_items: orderItemsPayload(quote.lines),
      });
      if (created.error) {
        if (/cart mismatch/.test(created.error.message || '')) return res.status(409).json({ error: 'This checkout attempt belongs to a different cart. Start again.', restart: true });
        throw new Error('Pilot database operation failed');
      }
      order = checked(await db.from('pilot_orders').select('*').eq('id', created.data).single());
    }
    if (order.status === 'paid') return res.status(200).json({ url: `${config.origin}/pilot/orders?order=${order.id}`, restart: true });
    // Stripe only retains idempotency keys for 24h. Never reuse an older attempt.
    if (Date.now() - Date.parse(order.created_at) > 23 * 3600000) return res.status(409).json({ error: 'Checkout expired. Start a new checkout.', restart: true });
    step = 'stripe_checkout';
    // The order total and its lines were fixed when the order was created, so a later
    // price or fee change never alters an in-progress checkout.
    let lineItems = null;
    if (!order.stripe_session_id) {
      const saved = checked(await db.from('pilot_order_items').select('id,line_no,product_id,variant_id,product_name,variant_label,quantity,retailer_unit_cents').eq('order_id', order.id).order('line_no', { ascending: true }));
      if (order.subtotal_cents == null || !saved?.length) return res.status(409).json({ error: 'This checkout is out of date. Start a new checkout.', restart: true });
      lineItems = stripeLineItems(order, saved, { taxIncluded: config.taxIncluded });
    }
    const session = order.stripe_session_id
      ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      : await stripe.checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'],
        line_items: lineItems,
        client_reference_id: user.id, metadata: { ayna_order_id: order.id, ayna_order_number: String(order.order_number) },
        shipping_address_collection: { allowed_countries: ['US'] },
        ...(config.taxIncluded ? { automatic_tax: { enabled: true } } : {}),
        success_url: `${config.origin}/pilot/orders?paid=1&order=${order.id}`,
        cancel_url: body.source === 'cart' ? `${config.origin}/pilot/cart?pilot_cancelled=1` : `${config.origin}/pilot/orders?pilot_cancelled=1`,
        ...(config.paymentMode === 'test' ? { custom_text: { submit: { message: 'Test order only. No real payment or shipment.' } } } : {}),
      }, { idempotencyKey: `ayna-pilot-${order.id}` });
    if (session.livemode !== (config.paymentMode === 'live')) throw new Error('Checkout mode mismatch');
    checked(await db.from('pilot_orders').update({ stripe_session_id: session.id }).eq('id', order.id));
    if (!session.url || session.status !== 'open') return res.status(409).json({ error: 'Checkout is complete or expired. View your orders or start again.', restart: true });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[pilot-checkout] failed at', step, e?.type || e?.code || '', String(e?.message || '').slice(0, 200));
    return res.status(503).json({ error: `Checkout is unavailable (step: ${step}). Please try again.`, step });
  }
}
