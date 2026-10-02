/* global process */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
  };
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
export function validTracking(body) {
  const carrier = String(body.carrier || '').trim();
  const number = String(body.tracking_number || '').trim();
  const url = String(body.tracking_url || '').trim();
  if (!carrier || carrier.length > 80 || !number || number.length > 150) return null;
  try { if (url && (new URL(url).protocol !== 'https:' || new URL(url).username || new URL(url).password)) return null; }
  catch { return null; }
  return { carrier, tracking_number: number, tracking_url: url || null, status: 'shipped', shipped_at: new Date().toISOString() };
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
