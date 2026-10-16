/* global process */
/**
 * Stripe authorize-then-capture for ayna-managed orders only (items ayna is
 * allowed to sell: wholesale/dropship/written-permission partners). Never for
 * Amazon, never for Shoppable (Shoppable takes its own payment).
 *
 * Flow (docs.stripe.com/payments/place-a-hold-on-a-payment-method):
 *   create PaymentIntent capture_method=manual -> customer confirms
 *   -> status requires_capture (card hold) -> team places the retailer order
 *   -> capture the actual amount (<= authorized; a partial capture releases
 *      the rest, and only one capture is allowed)
 *   -> retailer order fails -> cancel the PaymentIntent (hold released).
 * A price increase is never captured: capturing more than authorized needs
 * overcapture eligibility, so the customer must approve a new amount instead.
 * The hold deadline is read from the charge (capture_before), never computed.
 *
 * Metadata carries opaque ayna IDs only: no product names, no health data.
 * Uses Stripe's REST API directly (no SDK dependency); `fetchImpl` is
 * injectable for tests.
 */
import { assertManagedCheckoutAllowed } from '../../src/commerce/policy.js';

const API = 'https://api.stripe.com/v1';

function form(params, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) out.push(form(v, key));
    else if (Array.isArray(v)) v.forEach((item, i) => out.push(typeof item === 'object' ? form(item, `${key}[${i}]`) : `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.filter(Boolean).join('&');
}

async function stripe(path, { method = 'POST', params = null, idempotencyKey = null, env = process.env, fetchImpl = fetch } = {}) {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('STRIPE_SECRET_KEY is not set'), { code: 'STRIPE_NOT_CONFIGURED' });
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetchImpl(`${API}${path}`, { method, headers, body: params ? form(params) : undefined });
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body?.error?.message || `Stripe ${res.status}`), { code: body?.error?.code || 'STRIPE_ERROR', status: res.status });
  return body;
}

const OPAQUE = /^[A-Za-z0-9_-]{6,80}$/;

/**
 * @param {{ orderId: string, amountCents: number, currency?: string, offers: object[], customerId?: string }} args
 *   `offers` are the server-resolved offers in the order; every one must allow managed checkout.
 */
export async function createAuthorization({ orderId, amountCents, currency = 'usd', offers, customerId }, opts = {}) {
  if (!OPAQUE.test(String(orderId || ''))) throw Object.assign(new Error('orderId must be an opaque id'), { code: 'BAD_ORDER_ID' });
  if (!Number.isInteger(amountCents) || amountCents < 50) throw Object.assign(new Error('amountCents must be an integer >= 50'), { code: 'BAD_AMOUNT' });
  if (!Array.isArray(offers) || !offers.length) throw Object.assign(new Error('offers are required'), { code: 'NO_OFFERS' });
  for (const offer of offers) assertManagedCheckoutAllowed(offer, opts.env || process.env);
  return stripe('/payment_intents', {
    ...opts,
    idempotencyKey: `ayna-auth-${orderId}`,
    params: {
      amount: amountCents,
      currency,
      capture_method: 'manual',
      'payment_method_types[]': 'card', // card holds support manual capture; ACH does not
      ...(customerId ? { customer: customerId } : {}),
      metadata: { ayna_order_id: orderId },
    },
  });
}

/** Reads the PaymentIntent with its charge so the real hold deadline is known. */
export async function getAuthorization(paymentIntentId, opts = {}) {
  const pi = await stripe(`/payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge`, { ...opts, method: 'GET' });
  const captureBefore = pi?.latest_charge?.payment_method_details?.card?.capture_before ?? null;
  return { paymentIntent: pi, status: pi.status, amountCapturable: pi.amount_capturable ?? 0, captureBefore };
}

/**
 * Capture the actual amount owed. Refuses to capture more than is capturable
 * (a price increase needs a fresh customer approval, not a bigger capture).
 */
export async function captureAuthorization({ paymentIntentId, amountToCaptureCents, orderId }, opts = {}) {
  const { status, amountCapturable } = await getAuthorization(paymentIntentId, opts);
  if (status !== 'requires_capture') throw Object.assign(new Error(`PaymentIntent is ${status}, not requires_capture`), { code: 'NOT_CAPTURABLE' });
  if (!Number.isInteger(amountToCaptureCents) || amountToCaptureCents <= 0) throw Object.assign(new Error('amountToCaptureCents must be a positive integer'), { code: 'BAD_AMOUNT' });
  if (amountToCaptureCents > amountCapturable) {
    throw Object.assign(new Error('Capture would exceed the authorized amount; ask the customer to approve the new total.'), { code: 'PRICE_CHANGE_REQUIRES_ACTION' });
  }
  return stripe(`/payment_intents/${encodeURIComponent(paymentIntentId)}/capture`, {
    ...opts,
    idempotencyKey: `ayna-capture-${orderId || paymentIntentId}`,
    params: { amount_to_capture: amountToCaptureCents },
  });
}

/** Release the hold (retailer order failed, item unavailable, customer declined a new price). */
export async function cancelAuthorization({ paymentIntentId, reason = 'requested_by_customer' }, opts = {}) {
  return stripe(`/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`, {
    ...opts,
    idempotencyKey: `ayna-cancel-${paymentIntentId}`,
    params: { cancellation_reason: reason },
  });
}

export const _internals = { form };
