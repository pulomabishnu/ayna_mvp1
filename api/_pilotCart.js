/* global process */
// Cart pricing for the manual-fulfillment checkout. Everything here runs on the
// server: the browser sends only product IDs, option IDs and quantities, never
// prices. Each product + option is priced on its own (an option never borrows
// another option's price) and an option with no confirmed price blocks payment.
import { checked, purchasableProduct, selectedPilotVariant, checkoutPrice, serviceFeeCents, legacyPriceVariantId } from './_pilot.js';

export const MAX_QTY = 10;
export const MAX_LINES = 20;
export const MAX_CART_MERCHANDISE_CENTS = 250000;
const ID = /^[a-z0-9][a-z0-9._-]{1,100}$/i;

// Validates the browser's request and merges repeats of the SAME product + option.
// Different options of one product always stay separate lines.
export function normalizeCartItems(raw) {
  if (!Array.isArray(raw) || !raw.length) return null;
  const merged = new Map();
  for (const item of raw) {
    const productId = String(item?.productId ?? '');
    const variantId = String(item?.variantId ?? '');
    const quantity = item?.quantity === undefined ? 1 : item.quantity;
    if (!ID.test(productId) || variantId.length > 100 || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return null;
    const key = `${productId}\u0000${variantId}`;
    const line = merged.get(key) || { productId, variantId, quantity: 0 };
    line.quantity += quantity;
    if (line.quantity > MAX_QTY) return null;
    merged.set(key, line);
  }
  return merged.size <= MAX_LINES ? [...merged.values()] : null;
}
// Order-independent fingerprint of a cart; lets a retried checkout attempt be
// recognized as the same cart (and a changed cart be recognized as different).
export function cartKey(items) {
  return items.map(i => `${i.productId}|${i.variantId}|${i.quantity}`).sort().join(';');
}

// One documented rule for every product: the customer pays
//   retailer item price x quantity
// + ayna service fee (PILOT_SERVICE_FEE_PERCENT, default 10%, of the item price)
// + payment processing (enough to cover Stripe's 2.9% + 30c on the whole payment).
// Tax is calculated by Stripe Tax from the shipping address INSIDE this total when
// enabled, so the amount shown before payment is the amount charged.
// Retailer shipping is not modeled yet; see PILOT.md.
export function cartTotals(lines, env = process.env) {
  let merchandise = 0;
  let fee = 0;
  for (const line of lines) {
    merchandise += line.unit * line.quantity;
    fee += serviceFeeCents(line.unit, env) * line.quantity;
  }
  const base = merchandise + fee;
  let total = base + 30;
  while (total - Math.round(total * 0.029) - 30 < base) total++;
  return { merchandise, fee, processing: total - base, total };
}

// Resolve every line against the catalog and the price table. A line is `available`
// only with an exact, confirmed price; otherwise it carries a reason and the whole
// cart is not `ready`.
export async function buildCartQuote(db, items, { allowCatalogFallback = false, allowUnapproved = true, env = process.env } = {}) {
  const ids = [...new Set(items.map(i => i.productId))];
  const products = checked(await db.from('product_catalog').select('id,name,price,url,category,product_type,requires_prescription,is_active,source,review_status,discovery_meta,extra').in('id', ids)) || [];
  const prices = checked(await db.from('pilot_product_prices').select('product_id,variant_id,variant_label,amount,currency,retailer_url,live_approved').in('product_id', ids)) || [];
  const productById = new Map(products.map(p => [p.id, p]));
  const priceByOption = new Map(prices.map(p => [`${p.product_id}\u0000${p.variant_id}`, p]));
  const lines = items.map(item => {
    const product = productById.get(item.productId);
    const variant = product ? selectedPilotVariant(product, item.variantId) : null;
    const base = { productId: item.productId, variantId: item.variantId, quantity: item.quantity, name: product?.name || null, variantLabel: variant?.label ?? null };
    if (!purchasableProduct(product) || !variant) return { ...base, available: false, reason: 'unavailable' };
    const legacyId = legacyPriceVariantId(item.productId, item.variantId);
    const configured = priceByOption.get(`${item.productId}\u0000${item.variantId}`)
      || (legacyId === null ? null : priceByOption.get(`${item.productId}\u0000${legacyId}`)) || null;
    const price = checkoutPrice(product, variant, configured, { allowCatalogFallback, allowUnapproved });
    if (!price) return { ...base, available: false, reason: 'price_needed' };
    if (price.currency !== 'usd' || !Number.isSafeInteger(price.amount) || price.amount < 50 || price.amount > 50000) return { ...base, available: false, reason: 'invalid_price' };
    return { ...base, available: true, unit: price.amount, retailerUrl: price.retailer_url || null };
  });
  const allAvailable = lines.every(l => l.available);
  const totals = allAvailable ? cartTotals(lines, env) : null;
  if (totals && totals.merchandise > MAX_CART_MERCHANDISE_CENTS) return { lines, totals: null, ready: false, error: 'cart_too_large' };
  return { lines, totals, ready: allAvailable };
}

// What the browser may see. No retailer link and no retailer-side figures.
export function publicQuote(quote, config) {
  return {
    enabled: true,
    paymentMode: config.paymentMode,
    taxIncluded: config.taxIncluded,
    serviceFeePercent: config.serviceFeePercent,
    ready: quote.ready,
    error: quote.error || null,
    lines: quote.lines.map(l => ({
      productId: l.productId, variantId: l.variantId, variantLabel: l.variantLabel, name: l.name, quantity: l.quantity,
      available: l.available, reason: l.reason || null,
      unitCents: l.available ? l.unit : null, lineCents: l.available ? l.unit * l.quantity : null,
    })),
    totals: quote.totals,
  };
}

export function orderSummaryName(lines) {
  const first = lines[0];
  const label = first.variantLabel ? `${first.name} — ${first.variantLabel}` : first.name;
  const head = first.quantity > 1 ? `${label} ×${first.quantity}` : label;
  return lines.length === 1 ? head : `${head} + ${lines.length - 1} more item${lines.length === 2 ? '' : 's'}`;
}

// Snapshot of each line, written with the order so later catalog or price changes
// never rewrite what was bought.
export function orderItemsPayload(lines, env = process.env) {
  return lines.map((l, index) => {
    const fee = serviceFeeCents(l.unit, env);
    return {
      line_no: index + 1, product_id: l.productId, product_name: l.name,
      variant_id: l.variantId, variant_label: l.variantLabel, quantity: l.quantity,
      retailer_url: l.retailerUrl, retailer_unit_cents: l.unit,
      customer_unit_cents: l.unit + fee, customer_line_cents: (l.unit + fee) * l.quantity,
    };
  });
}

// Stripe line items rebuilt from the order's saved snapshot (never from the
// browser). Each product line keeps its quantity and carries the order-item and
// product/option IDs as metadata; the fee and processing are their own visible lines.
export function stripeLineItems(order, items, { taxIncluded = false } = {}) {
  const tax = taxIncluded ? { tax_behavior: 'inclusive' } : {};
  const lines = items.map(i => ({
    quantity: i.quantity,
    price_data: {
      currency: order.currency, unit_amount: i.retailer_unit_cents, ...tax,
      product_data: {
        name: (i.variant_label ? `${i.product_name} — ${i.variant_label}` : i.product_name).slice(0, 250),
        metadata: { ayna_item_id: i.id, product_id: i.product_id, variant_id: i.variant_id || '' },
      },
    },
  }));
  if (order.service_fee_cents > 0) lines.push({ quantity: 1, price_data: { currency: order.currency, unit_amount: order.service_fee_cents, ...tax, product_data: { name: 'ayna service fee', description: 'Sourcing, packing and shipping coordination by the ayna team.' } } });
  if (order.processing_cents > 0) lines.push({ quantity: 1, price_data: { currency: order.currency, unit_amount: order.processing_cents, ...tax, product_data: { name: 'Payment processing', description: 'Covers card processing for your payment.' } } });
  const total = lines.reduce((sum, l) => sum + l.price_data.unit_amount * l.quantity, 0);
  if (total !== order.amount) throw new Error('Order total does not match line items');
  return lines;
}
