/* global process */
import Stripe from 'stripe';
import { randomBytes } from 'node:crypto';
import { getServiceClient } from './_usageLimit.js';

export const CHECKOUT_FLOW = 'ayna_direct_checkout_test_v1';
export const checkoutAdmin = () => {
  const db = getServiceClient();
  if (!db) throw new Error('checkout_database_unavailable');
  return db;
};
export function checkoutConfig() {
  const key = process.env.STRIPE_CHECKOUT_TEST_KEY || '';
  const secret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET || '';
  const mailbox = process.env.CHECKOUT_TEST_ORDER_EMAIL || '';
  const origin = new URL(process.env.SITE_URL || 'https://www.aynahealth.co');
  if (process.env.CHECKOUT_TEST_ENABLED !== '1' || !/^(rk|sk)_test_/.test(key) ||
      !secret.startsWith('whsec_') || !mailbox || !process.env.RESEND_API_KEY ||
      !['https:', 'http:'].includes(origin.protocol) ||
      (origin.protocol === 'http:' && origin.hostname !== 'localhost')) {
    throw new Error('checkout_not_configured');
  }
  return { key, secret, mailbox, origin: origin.origin };
}
export const checkoutStripe = () => new Stripe(checkoutConfig().key, {
  apiVersion: '2026-09-30.endive', maxNetworkRetries: 2, timeout: 10000,
});
const need = (result, code) => {
  if (result.error) throw new Error(code);
  return result.data;
};
export async function availableProduct(db, id) {
  const product = need(await db.from('product_catalog')
    .select('id,name,brand,product_type,is_active,checkout_enabled,checkout_price_cents,checkout_sku,checkout_supplier_id')
    .eq('id', id).maybeSingle(), 'product_unavailable');
  if (!product || !product.is_active || !product.checkout_enabled ||
      product.product_type !== 'physical' || !product.checkout_supplier_id ||
      !product.checkout_sku || !Number.isInteger(product.checkout_price_cents) ||
      product.checkout_price_cents < 1) return null;
  const supplier = need(await db.from('checkout_suppliers').select('id,name,active')
    .eq('id', product.checkout_supplier_id).maybeSingle(), 'supplier_unavailable');
  return supplier?.active ? { product, supplier } : null;
}
export async function createCheckout(db, stripe, user, cart, returnPath) {
  if (!Array.isArray(cart) || cart.length < 1 || cart.length > 3) throw new Error('invalid_cart');
  if (typeof returnPath !== 'string' || !/^\/product\/[a-z0-9_/-]{1,160}$/i.test(returnPath)) throw new Error('invalid_cart');
  const ids = new Set();
  const items = [];
  let supplierId = '';
  for (const entry of cart) {
    if (typeof entry?.id !== 'string' || entry.id.length > 160 ||
        !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 10 ||
        ids.has(entry.id)) throw new Error('invalid_cart');
    ids.add(entry.id);
    const found = await availableProduct(db, entry.id);
    if (!found || (supplierId && found.supplier.id !== supplierId)) throw new Error('product_unavailable');
    supplierId = found.supplier.id;
    items.push({ product_id: found.product.id, name: found.product.name,
      sku: found.product.checkout_sku, quantity: entry.quantity,
      unit_price_cents: found.product.checkout_price_cents });
  }
  const subtotal = items.reduce((n, item) => n + item.quantity * item.unit_price_cents, 0);
  if (subtotal > 100000) throw new Error('invalid_cart');
  const attempt = need(await db.from('checkout_attempts').insert({
    user_id: user.id, supplier_id: supplierId, items, subtotal_cents: subtotal,
  }).select('id').single(), 'attempt_save_failed');
  const suffix = randomBytes(4).toString('hex').replace(/[0-9]/g, c => 'abcdefghij'[Number(c)]).slice(0, 8);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    integration_identifier: 'ayna_direct_' + suffix,
    client_reference_id: user.id,
    customer_email: user.email,
    line_items: items.map(item => ({
      price_data: { currency: 'usd', unit_amount: item.unit_price_cents,
        product_data: { name: item.name } },
      quantity: item.quantity,
    })),
    shipping_address_collection: { allowed_countries: ['US'] },
    success_url: checkoutConfig().origin + returnPath + '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: checkoutConfig().origin + returnPath + '?checkout=cancelled',
    metadata: { flow: CHECKOUT_FLOW, attempt_id: attempt.id },
  }, { idempotencyKey: 'ayna-checkout-' + attempt.id });
  need(await db.from('checkout_attempts').update({ stripe_session_id: session.id })
    .eq('id', attempt.id), 'attempt_session_save_failed');
  return session.url;
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export async function notifySupplier(db, order, items, supplier) {
  if (order.supplier_notified_at) return;
  const cfg = checkoutConfig();
  const address = order.shipping_address || {};
  const lines = [address.line1, address.line2, address.city,
    [address.state, address.postal_code].filter(Boolean).join(' '), address.country].filter(Boolean);
  const body = '<h1 style="color:#3e2723">ayna test order</h1>' +
    '<p>Order ' + esc(order.id) + '</p><ul>' +
    items.map(i => '<li>' + esc(i.product_name) + ' (' + esc(i.sku) + ') × ' + i.quantity + '</li>').join('') +
    '</ul><p>' + esc(order.shipping_name) + '<br>' + lines.map(esc).join('<br>') + '</p>' +
    '<p>Send tracking to the ayna team. Do not ship a test order.</p>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json', 'Idempotency-Key': 'ayna-test-order-' + order.id },
    body: JSON.stringify({ from: process.env.CHECKOUT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
      to: [cfg.mailbox], subject: 'Ayna test order ' + order.id.slice(0, 8), html: body }),
  });
  if (!response.ok) throw new Error('supplier_email_failed');
  need(await db.from('checkout_orders').update({ supplier_notified_at: new Date().toISOString() })
    .eq('id', order.id), 'supplier_email_save_failed');
}
export async function fulfillCheckout(db, stripe, sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
  if (session.metadata?.flow !== CHECKOUT_FLOW) return;
  if (session.livemode || session.mode !== 'payment' ||
      session.payment_status !== 'paid' || session.status !== 'complete') return;
  const attempt = need(await db.from('checkout_attempts').select('*')
    .eq('id', session.metadata.attempt_id).single(), 'attempt_missing');
  const items = attempt.items;
  const expected = items.reduce((n, i) => n + i.quantity * i.unit_price_cents, 0);
  const actual = session.line_items?.data || [];
  if (attempt.user_id !== session.client_reference_id ||
      attempt.stripe_session_id && attempt.stripe_session_id !== session.id ||
      expected !== attempt.subtotal_cents || session.currency !== 'usd' ||
      session.amount_subtotal !== expected || session.amount_total !== expected ||
      session.line_items?.has_more || actual.length !== items.length ||
      actual.some((line, i) => line.quantity !== items[i].quantity ||
        line.price?.unit_amount !== items[i].unit_price_cents)) throw new Error('session_mismatch');
  const shipping = session.collected_information?.shipping_details || session.shipping_details;
  if (!shipping?.name || !shipping?.address?.line1 || !shipping?.address?.postal_code) throw new Error('shipping_missing');
  const row = { attempt_id: attempt.id, user_id: attempt.user_id, supplier_id: attempt.supplier_id,
    stripe_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id,
    subtotal_cents: expected, total_cents: session.amount_total,
    shipping_name: shipping.name, shipping_address: shipping.address,
    customer_email: session.customer_details?.email || null };
  const order = need(await db.from('checkout_orders').upsert(row,
    { onConflict: 'attempt_id', ignoreDuplicates: true }).select('*').maybeSingle(), 'order_save_failed')
    || need(await db.from('checkout_orders').select('*').eq('attempt_id', attempt.id).single(), 'order_missing');
  need(await db.from('checkout_order_items').upsert(items.map(i => ({
    order_id: order.id, supplier_id: attempt.supplier_id, product_id: i.product_id,
    product_name: i.name, sku: i.sku, quantity: i.quantity, unit_price_cents: i.unit_price_cents,
  })), { onConflict: 'order_id,product_id', ignoreDuplicates: true }), 'items_save_failed');
  const supplier = need(await db.from('checkout_suppliers').select('name').eq('id', attempt.supplier_id).single(), 'supplier_missing');
  await notifySupplier(db, order, items.map(i => ({ product_name: i.name, ...i })), supplier);
}
