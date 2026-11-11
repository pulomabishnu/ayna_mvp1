import { apiUrl } from './apiUrl.js';

/**
 * Which product an event is about: id, name and brand.
 *
 * Sent on product_card_viewed, product_card_opened and product_buy_now_clicked.
 * main.jsx before_send (sanitizeEventPayload) keeps these fields ONLY for a
 * visitor who clicked "Turn on" in the analytics banner (Puloma, 2026-11-10);
 * for everyone else they are stripped before anything leaves the browser.
 * Names are the catalog's own product names, never anything she typed.
 */
const MAX = 120;

function text(value) {
  if (value == null) return undefined;
  // eslint-disable-next-line no-control-regex
  const s = String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, MAX) : undefined;
}

/** { productId, productName, brand } for posthog.capture / trackApp. Empty fields are left out. */
export function productIdentity(product) {
  const out = {};
  const id = text(product?.id);
  const name = text(product?.name);
  const brand = text(product?.brand);
  if (id) out.productId = id;
  if (name) out.productName = name;
  if (brand) out.brand = brand;
  return out;
}

const GO_ID = /^[a-z0-9][a-z0-9_.:-]{0,79}$/i;

/**
 * Anonymous Buy Now counter: tells /api/go "one Buy click on this product".
 * Only the product id is sent: no cookie, no account, no analytics id. It
 * runs for every visitor (consent or not) because it records nothing about
 * the person, only a daily total per product. Fire-and-forget: the Buy link
 * opens the seller whatever happens here.
 */
export function countBuyClick(productId) {
  const id = String(productId || '');
  if (!GO_ID.test(id)) return;
  try {
    if (typeof fetch !== 'function') return;
    // Not sendBeacon: a beacon always carries the site's cookies (including
    // the analytics cookie). credentials: 'omit' sends none. keepalive lets
    // it finish while the seller's tab opens.
    fetch(apiUrl('/api/go'), {
      method: 'POST',
      body: JSON.stringify({ p: id }),
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(() => {});
  } catch { /* the counter never blocks buying */ }
}
