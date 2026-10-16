/**
 * One ayna bag, grouped by how each item is actually paid for. Items bought on
 * a retailer's site are never presented as part of an ayna payment.
 *
 * A bag line snapshots the exact commerce identity at add time. The snapshot
 * is for display and comparison only; the server re-resolves everything
 * (offer, option, price, stock) before any payment.
 */
import { capabilitiesFor, PAYMENT_PROVIDERS } from './policy.js';

export const CHECKOUT_GROUPS = Object.freeze({
  AYNA: 'ayna_checkout', // Stripe, ayna is the seller of record for these items
  SHOPPABLE: 'shoppable_checkout', // Shoppable's own payment, retailer is the seller
  EXTERNAL: 'external', // bought on the retailer's site (Amazon, brand, partner link)
});

export function offerKey(routed) {
  return [routed.provider, routed.productId, routed.variantId || ''].join(':');
}

/** @param {object} routed result of resolveCommerce for the chosen option */
export function bagLineFromRouted(routed, { quantity = 1, image = null, now = Date.now() } = {}) {
  if (!routed?.destinationUrl && !routed?.capabilities?.managedCheckout) return null;
  if (routed.needsVariantChoice) return null; // never add a sized product without its size
  const caps = routed.capabilities || capabilitiesFor({ provider: routed.provider, destinationUrl: routed.destinationUrl });
  let group = CHECKOUT_GROUPS.EXTERNAL;
  if (caps.managedCheckout && caps.paymentProvider === PAYMENT_PROVIDERS.STRIPE) group = CHECKOUT_GROUPS.AYNA;
  else if (caps.providerCheckout && caps.paymentProvider === PAYMENT_PROVIDERS.SHOPPABLE) group = CHECKOUT_GROUPS.SHOPPABLE;
  return {
    productId: routed.productId,
    offerKey: offerKey(routed),
    variantId: routed.variantId,
    variantLabel: routed.variantLabel,
    merchant: routed.merchant,
    provider: routed.provider,
    externalId: routed.amazon?.asin || routed.sku || routed.variantId || null,
    destinationUrl: group === CHECKOUT_GROUPS.EXTERNAL ? routed.destinationUrl : null,
    priceSnapshot: routed.priceDisplay?.show && routed.price ? { ...routed.price } : null,
    imageSnapshot: image,
    quantity: Math.max(1, Math.min(10, Math.trunc(quantity) || 1)),
    group,
    addedAt: new Date(now).toISOString(),
  };
}

/** Bag sections in display order. External items are grouped per merchant. */
export function groupBag(lines) {
  const ayna = lines.filter((l) => l.group === CHECKOUT_GROUPS.AYNA);
  const shoppable = lines.filter((l) => l.group === CHECKOUT_GROUPS.SHOPPABLE);
  const byMerchant = new Map();
  for (const l of lines.filter((x) => x.group === CHECKOUT_GROUPS.EXTERNAL)) {
    const key = l.merchant || 'Retailer';
    if (!byMerchant.has(key)) byMerchant.set(key, []);
    byMerchant.get(key).push(l);
  }
  const sections = [];
  if (ayna.length) sections.push({ group: CHECKOUT_GROUPS.AYNA, title: 'Checkout with ayna', lines: ayna, oneTransaction: true });
  if (shoppable.length) sections.push({ group: CHECKOUT_GROUPS.SHOPPABLE, title: 'Checkout with Shoppable', lines: shoppable, oneTransaction: true });
  for (const [merchant, items] of byMerchant) {
    sections.push({ group: CHECKOUT_GROUPS.EXTERNAL, title: `Purchased separately on ${merchant}`, merchant, lines: items, oneTransaction: false });
  }
  return sections;
}

/** After an ayna payment, what still has to be bought elsewhere. Never "Order complete" while this is non-empty. */
export function remainingExternalItems(lines) {
  return lines.filter((l) => l.group === CHECKOUT_GROUPS.EXTERNAL);
}

/**
 * Compare a bag line with a fresh server resolution.
 * @returns {{ status: 'ok'|'price_up'|'price_down'|'price_unknown'|'unavailable'|'offer_changed', line: object }}
 */
export function revalidateLine(line, fresh) {
  if (!fresh || fresh.availability === 'OUT_OF_STOCK' || fresh.availability === 'DISCONTINUED') return { status: 'unavailable', line };
  if (offerKey(fresh) !== line.offerKey || (fresh.variantId || null) !== (line.variantId || null)) return { status: 'offer_changed', line };
  const before = line.priceSnapshot?.amount;
  const after = fresh.priceDisplay?.show ? fresh.price?.amount : null;
  if (after === null || after === undefined) return { status: 'price_unknown', line };
  if (before === null || before === undefined) return { status: 'price_unknown', line };
  if (after > before + 0.001) return { status: 'price_up', line: { ...line, priceSnapshot: { ...fresh.price } } };
  if (after < before - 0.001) return { status: 'price_down', line: { ...line, priceSnapshot: { ...fresh.price } } };
  return { status: 'ok', line };
}
