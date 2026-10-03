/* global process */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PRODUCT_VARIANTS } from '../src/data/productVariants.js';

export function pilotConfig(env = process.env) {
  const origin = new URL(env.PILOT_APP_URL || 'http://localhost:3000');
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Invalid pilot origin');
  return {
    enabled: env.PILOT_CHECKOUT_ENABLED === 'true',
    productId: env.PILOT_PRODUCT_ID || 'p-always-infinity',
    priceId: env.PILOT_STRIPE_PRICE_ID,
    vendor: env.PILOT_VENDOR_NAME,
    origin: origin.origin,
    admins: (env.PILOT_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
    serviceFeePercent: env.PILOT_SERVICE_FEE_PERCENT === undefined || env.PILOT_SERVICE_FEE_PERCENT === '' ? 10 : Number(env.PILOT_SERVICE_FEE_PERCENT),
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
export function parsePriceInput(value) {
  const match = String(value ?? '').trim().replace(/^\$/, '').match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] || '0').padEnd(2, '0'));
  return cents >= 50 && cents <= 50000 ? cents : null;
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
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Stripe test key required');
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
  if (session.livemode !== false || session.payment_status !== 'paid' || session.mode !== 'payment') throw new Error('Invalid test payment');
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

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
export function teamRecipients(env = process.env) {
  const list = (env.PILOT_NOTIFY_EMAILS || 'ameera@aynahealth.co,puloma@aynahealth.co,eliz@aynahealth.co')
    .split(',').map(s => s.trim()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return list.slice(0, 10);
}
// Manual fulfillment: a paid order emails the team so someone buys and ships it.
// Best-effort only — the /pilot/admin inbox is the durable record, so an email
// failure never fails the webhook. Only city/state go in the email; the full
// address stays behind the admin sign-in.
export async function notifyTeam(order, session, { env = process.env, send = fetch } = {}) {
  if (!env.RESEND_API_KEY) { console.warn('[pilot] RESEND_API_KEY not set; order notification skipped'); return false; }
  const to = teamRecipients(env);
  if (!to.length) return false;
  const ship = session.collected_information?.shipping_details || session.shipping_details || {};
  const where = [ship.address?.city, ship.address?.state].filter(Boolean).join(', ') || 'see inbox';
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.amount / 100);
  const inbox = `${pilotConfig(env).origin}/pilot/admin`;
  const test = session.livemode === false ? '[TEST] ' : '';
  try {
    const r = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
        to,
        subject: `${test}New ayna order to fulfill: ${order.product_name} (${amount})`,
        text: [`New paid order — someone needs to buy and ship it.`, '', `Product: ${order.product_name}`, `Paid: ${amount}`, `Ship to: ${ship.name || 'customer'} — ${where}`, '', `Full address + buy link: ${inbox}`, `When shipped, enter the tracking number there.`].join('\n'),
        html: `<div style="font-family:Arial,sans-serif;color:#1A1714;line-height:1.6"><h2>New paid order to fulfill</h2><p><strong>${esc(order.product_name)}</strong> · ${esc(amount)}</p><p>Ship to: ${esc(ship.name || 'customer')} — ${esc(where)}</p><p><a href="${esc(inbox)}">Open the fulfillment inbox</a> for the full address and buy link. Enter tracking there once it ships.</p></div>`,
      }),
    });
    if (!r.ok) console.error('[pilot] order notification failed', r.status);
    return r.ok;
  } catch (e) { console.error('[pilot] order notification error', e?.message); return false; }
}

// Customer "your order shipped" email. Sent once, when tracking is first saved
// (later corrections don't re-send). Best-effort: tracking is already saved and
// visible on /pilot/orders even if the email fails.
export function shippedEmailHtml({ productName, carrier, trackingNumber, ayanaUrl, carrierUrl, logoUrl }) {
  const cream = '#FAF6F1', ink = '#1A1714', muted = '#8c8078', navy = '#242A52', amber = '#FFC774', border = '#E1D5CE';
  const step = (label, done, last) => `<td align="center" style="padding:0 4px;width:33%"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;margin:0 auto 6px;background:${done ? navy : '#fff'};border:2px solid ${done ? navy : border};color:${done ? '#fff' : muted};font-size:14px;font-weight:700">${done ? '&#10003;' : '&middot;'}</div><div style="font-size:12px;color:${done ? ink : muted};font-weight:${done ? 700 : 400}">${label}</div></td>${last ? '' : ''}`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:${cream}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${border};border-radius:20px;font-family:Georgia,'Times New Roman',serif;color:${ink}">
<tr><td style="padding:28px 28px 0" align="center">${logoUrl ? `<img src="${esc(logoUrl)}" width="44" height="44" alt="ayna" style="border-radius:12px;display:block">` : ''}
<p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${muted}">Order update</p>
<h1 style="margin:6px 0 0;font-size:28px;font-weight:400;line-height:1.25">It&rsquo;s on its way</h1></td></tr>
<tr><td style="padding:14px 32px 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${ink}" align="center">Your <strong>${esc(productName)}</strong> just shipped. We picked it with care &mdash; thanks for shopping with ayna.</td></tr>
<tr><td style="padding:24px 24px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif"><tr>${step('Ordered', true)}${step('Shipped', true)}${step('Delivered', false, true)}</tr></table></td></tr>
<tr><td style="padding:20px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};border-radius:14px;font-family:Arial,sans-serif;font-size:14px"><tr><td style="padding:14px 18px;color:${muted}">Carrier</td><td style="padding:14px 18px;text-align:right;font-weight:700">${esc(carrier)}</td></tr><tr><td style="padding:0 18px 14px;color:${muted}">Tracking #</td><td style="padding:0 18px 14px;text-align:right;font-weight:700;word-break:break-all">${esc(trackingNumber)}</td></tr></table></td></tr>
<tr><td align="center" style="padding:24px 28px 8px"><a href="${esc(ayanaUrl)}" style="display:inline-block;background:${navy};color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px">Track your shipment</a></td></tr>
${carrierUrl ? `<tr><td align="center" style="padding:0 28px 4px;font-family:Arial,sans-serif;font-size:13px"><a href="${esc(carrierUrl)}" style="color:${navy}">or track directly with ${esc(carrier)}</a></td></tr>` : ''}
<tr><td style="padding:22px 28px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${muted}" align="center"><div style="height:4px;width:48px;background:${amber};border-radius:2px;margin:0 auto 16px"></div>Questions about your order? Just reply to this email &mdash; a real person on the ayna team will get back to you.</td></tr>
</table></td></tr></table></body></html>`;
}

// Customer "your order shipped" email. Sent once, when tracking is first saved
// (later corrections don't re-send). Best-effort: tracking is already saved and
// visible on /pilot/orders even if the email fails.
export async function notifyCustomerShipped(order, tracking, email, { env = process.env, send = fetch } = {}) {
  if (!env.RESEND_API_KEY || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return false;
  const origin = pilotConfig(env).origin;
  const ayanaUrl = `${origin}/pilot/orders${order.id ? `?order=${encodeURIComponent(order.id)}` : ''}`;
  const test = env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? '[TEST] ' : '';
  try {
    const r = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
        to: [email],
        reply_to: teamRecipients(env)[0],
        subject: `${test}Your ayna order is on its way`,
        text: [`It's on its way!`, '', `Your ${order.product_name} just shipped. Thanks for shopping with ayna.`, '', `Carrier: ${tracking.carrier}`, `Tracking #: ${tracking.tracking_number}`, '', `Track your shipment on ayna: ${ayanaUrl}`, tracking.tracking_url ? `Or track with ${tracking.carrier}: ${tracking.tracking_url}` : '', '', 'Questions? Just reply to this email.'].join('\n'),
        html: shippedEmailHtml({ productName: order.product_name, carrier: tracking.carrier, trackingNumber: tracking.tracking_number, ayanaUrl, carrierUrl: tracking.tracking_url, logoUrl: env.PILOT_EMAIL_LOGO_URL || 'https://www.aynahealth.co/ayna-favicon-180.png' }),
      }),
    });
    if (!r.ok) console.error('[pilot] shipped email failed', r.status);
    return r.ok;
  } catch (e) { console.error('[pilot] shipped email error', e?.message); return false; }
}
