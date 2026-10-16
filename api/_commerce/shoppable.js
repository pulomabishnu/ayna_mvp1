/* global process */
/**
 * Shoppable Checkout API (V6) adapter. Shoppable is its own payment rail: its
 * payment element tokenizes the card and the retailer stays merchant of
 * record, so ayna's Stripe is never involved in a Shoppable transaction.
 *
 * Not live: SHOPPABLE_CHECKOUT_ACCESS_REQUIRES_CONFIRMATION. Shoppable's
 * pricing page lists the Checkout API on Growth, but its subscription terms
 * say Checkout API is Enterprise-only with written pre-approval.
 *
 * Behaviour this adapter preserves (about.shoppable.com/help/shoppable-embedded-checkout):
 *   - any line's price went up -> order rejected with itemsWithPriceChange;
 *   - price went down -> processed at the lower price;
 *   - out of stock -> order rejected with outOfStockItems;
 *   - substitutions are always declined (substitutionOptIn: false).
 * The payment element amount = items + shipping + 15% for estimated tax.
 */

export function shoppableCheckoutConfigured(env = process.env) {
  return String(env.SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED || '') === 'true'
    && Boolean(env.SHOPPABLE_BEARER_TOKEN && env.SHOPPABLE_SECRET);
}

/** Amount to place on hold in Shoppable's payment element, in cents. */
export function shoppableHoldAmountCents(itemsCents, shippingCents = 0) {
  return Math.ceil(itemsCents * 1.15) + shippingCents;
}

/**
 * @param {{ email: string, lines: { id: string, price: number, quantity: number }[], shipping: object, billing: object,
 *   paymentToken: string, sendConfirmationEmail?: boolean, marketingOptIn?: boolean }} args
 */
export function buildShoppableCheckout({ email, lines, shipping, billing, paymentToken, sendConfirmationEmail = true, marketingOptIn = false }) {
  if (!paymentToken) throw Object.assign(new Error('paymentToken from Shoppable\'s payment element is required'), { code: 'NO_PAYMENT_TOKEN' });
  return {
    cartDetails: {
      email,
      sendConfirmationEmail,
      // Never let a provider swap a health product for another item.
      substitutionOptIn: false,
      marketingOptIn: Boolean(marketingOptIn),
      lineItems: lines.map((l) => ({ id: String(l.id), price: Number(l.price), quantity: Math.max(1, Math.trunc(l.quantity) || 1) })),
    },
    shippingDetails: shipping,
    billingDetails: billing,
    paymentToken,
  };
}

/**
 * Normalizes a Checkout API response.
 * @returns {{ ok: boolean, state: 'PLACED'|'PRICE_CHANGED'|'OUT_OF_STOCK'|'PAYMENT_FAILED'|'REQUEST_ERROR'|'PROVIDER_ERROR', orderNumber?: string, items?: string[] }}
 */
export function mapShoppableResponse(status, body = {}) {
  if (status === 200 && body.orderNumber) return { ok: true, state: 'PLACED', orderNumber: body.orderNumber };
  const priceChanged = body.itemsWithPriceChange || [];
  const outOfStock = body.outOfStockItems || [];
  if (priceChanged.length) return { ok: false, state: 'PRICE_CHANGED', items: priceChanged };
  if (outOfStock.length) return { ok: false, state: 'OUT_OF_STOCK', items: outOfStock };
  if (status === 402) return { ok: false, state: 'PAYMENT_FAILED' };
  if (status === 400) return { ok: false, state: 'REQUEST_ERROR' };
  return { ok: false, state: 'PROVIDER_ERROR' };
}
