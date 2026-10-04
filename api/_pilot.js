/* global process */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PRODUCT_VARIANTS } from '../src/data/productVariants.js';

export function pilotConfig(env = process.env) {
  const previewOrigin = env.VERCEL_ENV === 'preview' && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null;
  const origin = new URL(previewOrigin || env.PILOT_APP_URL || 'http://localhost:3000');
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Invalid pilot origin');
  const paymentMode = env.PILOT_PAYMENT_MODE || 'test';
  if (!['test', 'live'].includes(paymentMode)) throw new Error('Invalid pilot payment mode');
  if (paymentMode === 'live' && (env.PILOT_LIVE_ENABLED !== 'true' || env.PILOT_STRIPE_TAX_ENABLED !== 'true' || env.VERCEL_ENV !== 'production' || origin.protocol !== 'https:' || origin.hostname.endsWith('.vercel.app'))) throw new Error('Live checkout requires an explicit production and tax configuration');
  return {
    enabled: env.PILOT_CHECKOUT_ENABLED === 'true',
    productId: env.PILOT_PRODUCT_ID || 'p-always-infinity',
    priceId: env.PILOT_STRIPE_PRICE_ID,
    vendor: env.PILOT_VENDOR_NAME,
    origin: origin.origin,
    admins: (env.PILOT_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
    serviceFeePercent: env.PILOT_SERVICE_FEE_PERCENT === undefined || env.PILOT_SERVICE_FEE_PERCENT === '' ? 10 : Number(env.PILOT_SERVICE_FEE_PERCENT),
    taxIncluded: env.PILOT_STRIPE_TAX_ENABLED === 'true',
    paymentMode,
  };
}
// ayna service fee, as a percent of the product price (default 10%). Rounded to
// the nearest cent. 0 turns it off. Capped at 30% to catch typos.
export function serviceFeeCents(unitAmount, env = process.env) {
  const raw = env.PILOT_SERVICE_FEE_PERCENT;
  const pct = raw === undefined || raw === '' ? 10 : Number(raw);
  if (!Number.isFinite(pct) || pct < 0 || pct > 30) throw new Error('Invalid PILOT_SERVICE_FEE_PERCENT');
  return Math.round(unitAmount * pct / 100);
}
// Charge enough to leave the item price plus Ayna's fee after Stripe's
// standard US online-card fee. The customer amount is fixed before payment;
// different card fee schedules affect Ayna's margin, never the customer total.
export function checkoutTotalCents(unitAmount, env = process.env) {
  const base = unitAmount + serviceFeeCents(unitAmount, env);
  let total = base + 30;
  while (total - Math.round(total * 0.029) - 30 < base) total++;
  return total;
}
export function parsePriceInput(value) {
  const match = String(value ?? '').trim().replace(/^\$/, '').match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] || '0').padEnd(2, '0'));
  return cents >= 50 && cents <= 50000 ? cents : null;
}
export function checkoutPrice(product, variant, configuredPrice, { allowCatalogFallback = true } = {}) {
  if (configuredPrice) return configuredPrice;
  if (!allowCatalogFallback) return null;
  // A displayed range, pack description, or option-dependent amount is not a price.
  if (!variant || variant.id !== '') return null;
  const amount = parsePriceInput(product?.price);
  return amount === null ? null : { amount, currency: 'usd', retailer_url: cleanRetailerUrl(product?.url), variant_label: null };
}
export function cleanRetailerUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (/(^|\.)amazon\./i.test(url.hostname)) for (const key of ['tag', 'linkCode', 'ref_']) url.searchParams.delete(key);
    return url.toString().length <= 500 ? url.toString() : null;
  } catch { return null; }
}
export function purchasableProduct(product) {
  return product?.is_active === true && product.product_type === 'physical'
    && product.requires_prescription !== true && product.category !== 'telehealth'
    && ((product.source || 'curated') !== 'discovered'
      || (product.review_status === 'approved' && Boolean(product.discovery_meta?.humanReviewedAt)));
}
export function selectedPilotVariant(product, variantId = '') {
  const verified = PRODUCT_VARIANTS[product?.id]?.variants;
  const variants = Array.isArray(verified) ? verified : Array.isArray(product?.extra?.variants) ? product.extra.variants : [];
  if (!variants.length) return variantId === '' ? { id: '', label: null } : null;
  const match = variants.find(v => String(v.id) === variantId);
  return match && typeof match.label === 'string' ? { id: variantId, label: match.label } : null;
}
// Preserve the previously configured 60-count price while moving Always to
// explicit size IDs. A price for any other size must be entered separately.
export function legacyPriceVariantId(productId, variantId) {
  return productId === 'p-always-infinity' && variantId === 'target-94912100' ? '' : null;
}
export async function pilotVariantPrice(db, productId, variantId, columns = 'amount,currency,retailer_url,variant_label') {
  const read = async (id) => checked(await db.from('pilot_product_prices').select(columns).eq('product_id', productId).eq('variant_id', id).maybeSingle());
  const exact = await read(variantId);
  const legacy = legacyPriceVariantId(productId, variantId);
  if (exact || legacy === null) return exact;
  return read(legacy);
}
export function stripeClient() {
  const mode = pilotConfig().paymentMode;
  if (!process.env.STRIPE_SECRET_KEY?.startsWith(`sk_${mode}_`)) throw new Error(`Stripe ${mode} key required`);
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 10000 });
}
export function database() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase configuration required');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function checked(result) {
  if (result.error) throw new Error('Pilot database operation failed');
  return result.data;
}
export async function signedIn(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error || data?.user?.is_anonymous ? null : data?.user;
}
// Public tracking pages for common US carriers, so admins only paste the number.
export function carrierTrackingUrl(carrier, number) {
  const n = encodeURIComponent(String(number || '').replace(/\s+/g, ''));
  const c = String(carrier || '').toLowerCase();
  if (!n) return null;
  if (c.includes('usps') || c.includes('postal')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${n}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (c.includes('dhl')) return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?tracking-id=${n}`;
  if (c.includes('amazon')) return `https://track.amazon.com/tracking/${n}`;
  return null;
}
export function validTracking(body) {
  const carrier = String(body.carrier || '').trim();
  const number = String(body.tracking_number || '').trim();
  const url = String(body.tracking_url || '').trim();
  if (!carrier || carrier.length > 80 || !number || number.length > 150) return null;
  try { if (url && (new URL(url).protocol !== 'https:' || new URL(url).username || new URL(url).password)) return null; }
  catch { return null; }
  return { carrier, tracking_number: number, tracking_url: url || carrierTrackingUrl(carrier, number), status: 'shipped', shipped_at: new Date().toISOString() };
}
export async function settleSession(db, session) {
  if (session.livemode !== (pilotConfig().paymentMode === 'live') || session.payment_status !== 'paid' || session.mode !== 'payment') throw new Error('Invalid payment');
  const orderId = session.metadata?.ayna_order_id;
  if (!orderId) return;
  checked(await db.rpc('pilot_record_payment', {
    p_order_id: orderId, p_session_id: session.id,
    p_amount: session.amount_total, p_currency: session.currency,
    p_user_id: session.client_reference_id,
    p_shipping: session.collected_information?.shipping_details || session.shipping_details || {},
    p_email: session.customer_details?.email || null,
  }));
}

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
export function teamRecipients(env = process.env) {
  const list = (env.PILOT_NOTIFY_EMAILS || 'ameera@aynahealth.co,puloma@aynahealth.co,eliz@aynahealth.co')
    .split(',').map(s => s.trim()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return list.slice(0, 10);
}

export const ITEM_STATUSES = ['needs_purchase', 'purchased', 'processing', 'shipped', 'delivered', 'issue', 'refunded'];
// Validates one item's fulfillment form. Tracking is optional (an item can ship
// before its number is known), but anything entered must be well-formed, and a
// tracking link must be HTTPS.
export function validItemUpdate(input, now = new Date()) {
  const text = (v, max) => { const s = String(v ?? '').trim(); return s.length <= max ? s : null; };
  const status = String(input?.item_status ?? '');
  if (!ITEM_STATUSES.includes(status)) return null;
  const carrier = text(input.carrier, 80), number = text(input.tracking_number, 150), retailer = text(input.retailer_name, 100);
  const retailerOrder = text(input.retailer_order_number, 100), notes = text(input.internal_notes, 2000);
  if ([carrier, number, retailer, retailerOrder, notes].includes(null)) return null;
  let url = text(input.tracking_url, 500);
  if (url === null) return null;
  if (url) { try { const u = new URL(url); if (u.protocol !== 'https:' || u.username || u.password) return null; } catch { return null; } }
  let cost = null;
  if (String(input.actual_cost ?? '').trim() !== '') { cost = parsePriceInput(input.actual_cost); if (cost === null) return null; }
  const eta = String(input.estimated_delivery ?? '').trim();
  if (eta && (!/^\d{4}-\d{2}-\d{2}$/.test(eta) || Number.isNaN(Date.parse(eta)))) return null;
  if (!url && carrier && number) url = carrierTrackingUrl(carrier, number);
  return {
    item_status: status, retailer_name: retailer || null, retailer_order_number: retailerOrder || null,
    actual_cost_cents: cost, carrier: carrier || null, tracking_number: number || null, tracking_url: url || null,
    estimated_delivery: eta || null, internal_notes: notes || null, updated_at: now.toISOString(),
  };
}
