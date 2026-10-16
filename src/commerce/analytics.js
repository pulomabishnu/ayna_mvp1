/**
 * Commerce analytics properties. Built from the router result only, through
 * an allowlist, so health-profile fields, symptoms, search text and full
 * merchant URLs (which can carry tracking IDs) never reach analytics.
 */

const ALLOWED = ['productId', 'variantId', 'provider', 'merchant', 'method', 'selectionReason', 'isPartner', 'platform', 'priceShown', 'priceSource'];

export function commerceEventProps(routed, { platform = 'web' } = {}) {
  if (!routed) return {};
  let destinationHost = null;
  try {
    destinationHost = routed.destinationUrl ? new URL(routed.destinationUrl).hostname : null;
  } catch { /* ignore */ }
  const raw = {
    productId: routed.productId,
    variantId: routed.variantId || null,
    provider: routed.provider,
    merchant: routed.merchant,
    method: routed.method,
    selectionReason: routed.selectionReason,
    isPartner: Boolean(routed.isPartner),
    platform,
    priceShown: Boolean(routed.priceDisplay?.show),
    priceSource: routed.price?.source || null,
  };
  const out = Object.fromEntries(ALLOWED.map((k) => [k, raw[k]]));
  out.destinationHost = destinationHost;
  return out;
}

export const COMMERCE_EVENTS = Object.freeze({
  OFFER_VIEWED: 'commerce_offer_viewed',
  VARIANT_SELECTED: 'commerce_variant_selected',
  EXTERNAL_PURCHASE_CLICKED: 'commerce_external_purchase_clicked',
  CHECKOUT_STARTED: 'commerce_checkout_started',
  PRICE_REVALIDATED: 'commerce_price_revalidated',
  PRICE_CHANGED: 'commerce_price_changed',
  CHECKOUT_COMPLETED: 'commerce_checkout_completed',
  FULFILLMENT_CREATED: 'commerce_fulfillment_created',
  FULFILLMENT_FAILED: 'commerce_fulfillment_failed',
  EXTERNAL_ORDER_PLACED: 'commerce_external_order_placed',
  CATALOG_MISMATCH_DETECTED: 'commerce_catalog_mismatch_detected',
});
