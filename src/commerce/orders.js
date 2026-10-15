/**
 * Managed-order state: payment and fulfilment are separate state machines and
 * are never collapsed into one status. Affiliate clicks have their own states
 * and never become orders.
 */

export const PAYMENT_STATUS = Object.freeze({
  NONE: 'none',
  AUTHORIZED: 'authorized', // card hold placed (Stripe requires_capture)
  CAPTURED: 'captured',
  PARTIALLY_CAPTURED: 'partially_captured',
  CANCELED: 'canceled', // hold released, nothing charged
  EXPIRED: 'expired', // hold lapsed before capture
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
});

export const FULFILLMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PRICE_VALIDATING: 'price_validating',
  AWAITING_PAYMENT: 'awaiting_payment',
  AWAITING_FULFILLMENT: 'awaiting_fulfillment',
  FULFILLMENT_IN_PROGRESS: 'fulfillment_in_progress',
  PRICE_CHANGE_REQUIRES_ACTION: 'price_change_requires_action',
  OUT_OF_STOCK_REQUIRES_ACTION: 'out_of_stock_requires_action',
  MERCHANT_ORDER_PLACED: 'merchant_order_placed',
  MERCHANT_ORDER_FAILED: 'merchant_order_failed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

/** An affiliate click's life. ayna cannot know an order happened unless the network reports it. */
export const AFFILIATE_STATUS = Object.freeze({
  CLICKED: 'affiliate_click',
  REPORTED_CONVERSION: 'reported_conversion',
  REPORTED_COMMISSION: 'reported_commission',
  REVERSED: 'reversed',
});

const F = FULFILLMENT_STATUS;
const FULFILLMENT_TRANSITIONS = {
  [F.DRAFT]: [F.PRICE_VALIDATING, F.CANCELLED],
  [F.PRICE_VALIDATING]: [F.AWAITING_PAYMENT, F.PRICE_CHANGE_REQUIRES_ACTION, F.OUT_OF_STOCK_REQUIRES_ACTION, F.CANCELLED],
  [F.AWAITING_PAYMENT]: [F.AWAITING_FULFILLMENT, F.CANCELLED],
  [F.AWAITING_FULFILLMENT]: [F.FULFILLMENT_IN_PROGRESS, F.PRICE_CHANGE_REQUIRES_ACTION, F.OUT_OF_STOCK_REQUIRES_ACTION, F.MERCHANT_ORDER_FAILED, F.CANCELLED],
  [F.FULFILLMENT_IN_PROGRESS]: [F.MERCHANT_ORDER_PLACED, F.PRICE_CHANGE_REQUIRES_ACTION, F.OUT_OF_STOCK_REQUIRES_ACTION, F.MERCHANT_ORDER_FAILED, F.AWAITING_FULFILLMENT],
  [F.PRICE_CHANGE_REQUIRES_ACTION]: [F.AWAITING_FULFILLMENT, F.CANCELLED],
  [F.OUT_OF_STOCK_REQUIRES_ACTION]: [F.AWAITING_FULFILLMENT, F.CANCELLED],
  [F.MERCHANT_ORDER_FAILED]: [F.AWAITING_FULFILLMENT, F.CANCELLED],
  [F.MERCHANT_ORDER_PLACED]: [F.SHIPPED, F.CANCELLED],
  [F.SHIPPED]: [F.DELIVERED],
  [F.DELIVERED]: [],
  [F.CANCELLED]: [],
};

export function canTransitionFulfillment(from, to) {
  return (FULFILLMENT_TRANSITIONS[from] || []).includes(to);
}

export const PLACEMENT_CHECKLIST = Object.freeze([
  ['correctProduct', 'Correct product'],
  ['correctSize', 'Correct size'],
  ['correctColor', 'Correct colour / scent'],
  ['correctCount', 'Correct count / pack'],
  ['correctQuantity', 'Correct quantity'],
  ['shippingAddress', 'Shipping address matches the order'],
  ['withinApprovedTotal', 'Total is within the customer-approved amount'],
]);

const cents = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

/**
 * Validates "mark order placed". Returns { ok, nextStatus, errors }.
 * A total above the customer-approved maximum never counts as placed: it goes
 * to PRICE_CHANGE_REQUIRES_ACTION and the customer must approve the new amount.
 *
 * @param {{ externalOrderId?: string, productCostCents?: number, shippingCents?: number, taxCents?: number,
 *   merchantTotalCents?: number, placedAt?: string, checklist?: Record<string, boolean> }} input
 * @param {{ maxApprovedTotalCents: number }} task
 */
export function validateMarkPlaced(input, task) {
  const errors = [];
  if (!String(input?.externalOrderId || '').trim()) errors.push('External retailer order number is required.');
  for (const [key, label] of [['productCostCents', 'Actual product cost'], ['shippingCents', 'Actual shipping'], ['taxCents', 'Actual tax'], ['merchantTotalCents', 'Actual merchant total']]) {
    if (cents(input?.[key]) === null) errors.push(`${label} is required (whole cents, 0 or more).`);
  }
  if (!input?.placedAt || !Number.isFinite(Date.parse(input.placedAt))) errors.push('Order placed time is required.');
  const sum = (input?.productCostCents || 0) + (input?.shippingCents || 0) + (input?.taxCents || 0);
  if (cents(input?.merchantTotalCents) !== null && sum !== input.merchantTotalCents) errors.push('Product + shipping + tax must equal the merchant total.');
  const missing = PLACEMENT_CHECKLIST.filter(([k]) => input?.checklist?.[k] !== true).map(([, label]) => label);
  if (missing.length) errors.push(`Confirm before marking placed: ${missing.join(', ')}.`);

  if (cents(input?.merchantTotalCents) !== null && Number.isInteger(task?.maxApprovedTotalCents) && input.merchantTotalCents > task.maxApprovedTotalCents) {
    return { ok: false, nextStatus: F.PRICE_CHANGE_REQUIRES_ACTION, errors: [`Merchant total exceeds the customer-approved ${task.maxApprovedTotalCents} cents. Do not place; ask the customer to approve the new amount.`] };
  }
  return errors.length ? { ok: false, nextStatus: null, errors } : { ok: true, nextStatus: F.MERCHANT_ORDER_PLACED, errors: [] };
}

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/**
 * How urgent a held payment is. The deadline comes from Stripe
 * (payment_method_details.card.capture_before), never from "created + 7 days".
 * @returns {{ level: 'ok'|'urgent'|'expiring'|'expired'|'unknown', msRemaining: number|null, cancelRecommended: boolean }}
 */
export function authorizationUrgency({ captureBefore, authorizedAt }, now = Date.now()) {
  const deadline = typeof captureBefore === 'number' ? captureBefore * (captureBefore < 1e12 ? 1000 : 1) : Date.parse(captureBefore || '');
  if (!Number.isFinite(deadline)) return { level: 'unknown', msRemaining: null, cancelRecommended: false };
  const msRemaining = deadline - now;
  if (msRemaining <= 0) return { level: 'expired', msRemaining, cancelRecommended: false };
  if (msRemaining <= DAY) return { level: 'expiring', msRemaining, cancelRecommended: msRemaining <= 6 * HOUR };
  const age = now - Date.parse(authorizedAt || '');
  if (Number.isFinite(age) && age >= 3 * DAY) return { level: 'urgent', msRemaining, cancelRecommended: false };
  return { level: 'ok', msRemaining, cancelRecommended: false };
}

const RANK = { expired: 0, expiring: 1, urgent: 2, unknown: 3, ok: 4 };

/** Fulfilment queue order: most urgent hold first, then oldest. */
export function sortFulfillmentQueue(tasks, now = Date.now()) {
  return [...tasks]
    .map((t) => ({ ...t, urgency: authorizationUrgency(t, now) }))
    .sort((a, b) => (RANK[a.urgency.level] - RANK[b.urgency.level])
      || ((a.urgency.msRemaining ?? Infinity) - (b.urgency.msRemaining ?? Infinity))
      || (Date.parse(a.authorizedAt || 0) - Date.parse(b.authorizedAt || 0)));
}
