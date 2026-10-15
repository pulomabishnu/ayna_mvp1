/**
 * Zinc purchasing adapter: a possible future replacement for a person placing
 * NON-Amazon retailer orders by hand, for merchants whose agreement with ayna
 * allows a purchasing provider. Not enabled anywhere yet.
 *
 * Zinc is not an affiliate channel. A Zinc order is ayna buying the item, so no
 * affiliate commission is earned on it, and ordering Amazon items through Zinc
 * conflicts with the Amazon Associates agreement. Amazon is refused here.
 *
 * Zinc facts (zinc.com/docs, checked 2026-10-15):
 *   - max_price is the ceiling, in cents, on the WHOLE order (items, tax,
 *     shipping); above it the order fails with max_price_exceeded.
 *   - one retailer per order; products are identified by the exact URL.
 *   - Zinc does not dedupe orders; send an idempotency key on every request.
 *   - webhooks: order.placed, order.failed, order.tracking_received, order.delivered.
 *   - pricing: $1 per successful order (+$0.25 tracking emails), $0.01 per data call.
 */
import { assertProviderOrderingAllowed, isAmazonUrlOrId, CommercePolicyError } from '../../src/commerce/policy.js';

export const ZINC_ERROR_TO_STATE = Object.freeze({
  max_price_exceeded: 'price_change_requires_action',
  product_out_of_stock: 'out_of_stock_requires_action',
  product_quantity_not_available: 'out_of_stock_requires_action',
  product_variant_required: 'merchant_order_failed',
  invalid_shipping_address: 'merchant_order_failed',
  retailer_unavailable: 'merchant_order_failed',
});

export function mapZincError(code) {
  return ZINC_ERROR_TO_STATE[code] || 'merchant_order_failed';
}

/**
 * Builds a Zinc create-order body. Throws if policy forbids it or any safety
 * field is missing.
 * @param {{ offer: object, lines: { url: string, quantity: number }[], shippingAddress: object,
 *   maxPriceCents: number, idempotencyKey: string, env?: object }} args
 */
export function buildZincOrder({ offer, lines, shippingAddress, maxPriceCents, idempotencyKey, env = {} }) {
  if (offer?.provider === 'amazon_associates' || (lines || []).some((l) => isAmazonUrlOrId(l.url))) {
    throw new CommercePolicyError('AMAZON_REDIRECT_ONLY', 'Zinc may not be used to buy Amazon items for ayna customers.');
  }
  assertProviderOrderingAllowed(offer, env);
  if (!Number.isInteger(maxPriceCents) || maxPriceCents <= 0) throw new CommercePolicyError('MAX_PRICE_REQUIRED', 'max_price (whole-order ceiling in cents) is required.');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(String(idempotencyKey || ''))) throw new CommercePolicyError('IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required; Zinc does not dedupe orders.');
  if (!Array.isArray(lines) || !lines.length) throw new CommercePolicyError('NO_LINES', 'At least one product is required.');
  const hosts = new Set(lines.map((l) => { try { return new URL(l.url).hostname.replace(/^www\./, ''); } catch { return null; } }));
  if (hosts.has(null) || hosts.size !== 1) throw new CommercePolicyError('ONE_RETAILER_PER_ORDER', 'Zinc orders must contain exact product URLs from one retailer.');
  return {
    idempotency_key: idempotencyKey,
    products: lines.map((l) => ({ url: l.url, quantity: Math.max(1, Math.min(100, Math.trunc(l.quantity) || 1)) })),
    shipping_address: shippingAddress,
    max_price: maxPriceCents,
  };
}
