/* global process */
// Order emails. The database is the source of truth; email is only a notification,
// so every function here is best-effort and returns true/false instead of throwing.
import { pilotConfig, teamRecipients, esc } from './_pilot.js';

const money = (cents, currency = 'usd') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cream = '#FAF6F1', ink = '#1A1714', muted = '#8c8078', navy = '#242A52', amber = '#FFC774', border = '#E1D5CE';

export const orderLabel = order => order?.order_number ? `AYNA-${order.order_number}` : `AYNA-${String(order?.id || '').slice(0, 8).toUpperCase()}`;
const itemName = i => i.variant_label ? `${i.product_name} — ${i.variant_label}` : i.product_name;
const firstName = (ship, email) => String(ship?.name || '').trim().split(/\s+/)[0] || String(email || '').split('@')[0] || 'there';
export function formatAddress(ship) {
  const a = ship?.address || {};
  return [ship?.name, a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(' '), a.country].filter(Boolean).join('\n');
}
const modePrefix = env => (pilotConfig(env).paymentMode === 'test' ? '[TEST] ' : '');

async function sendMail({ env, send }, payload) {
  if (!env.RESEND_API_KEY) { console.warn('[pilot] RESEND_API_KEY not set; email skipped'); return false; }
  try {
    const r = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>', ...payload }),
    });
    if (!r.ok) console.error('[pilot] email failed', r.status);
    return r.ok;
  } catch (e) { console.error('[pilot] email error', e?.message); return false; }
}

function shell({ logoUrl, eyebrow, heading, intro, body, ctaUrl, ctaLabel, footer }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${cream}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${border};border-radius:20px;font-family:Georgia,'Times New Roman',serif;color:${ink}">
<tr><td style="padding:28px 28px 0" align="center">${logoUrl ? `<img src="${esc(logoUrl)}" width="44" height="44" alt="ayna" style="border-radius:12px;display:block">` : ''}
<p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${muted}">${esc(eyebrow)}</p>
<h1 style="margin:6px 0 0;font-size:26px;font-weight:400;line-height:1.25">${esc(heading)}</h1></td></tr>
<tr><td style="padding:14px 32px 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6" align="center">${intro}</td></tr>
<tr><td style="padding:20px 24px 0;font-family:Arial,sans-serif;font-size:14px">${body}</td></tr>
${ctaUrl ? `<tr><td align="center" style="padding:24px 28px 8px"><a href="${esc(ctaUrl)}" style="display:inline-block;background:${navy};color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px">${esc(ctaLabel)}</a></td></tr>` : ''}
<tr><td style="padding:22px 28px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:${muted}" align="center"><div style="height:4px;width:48px;background:${amber};border-radius:2px;margin:0 auto 16px"></div>${footer}</td></tr>
</table></td></tr></table></body></html>`;
}
const row = (left, right, strong) => `<tr><td style="padding:6px 0;color:${strong ? ink : muted};${strong ? 'font-weight:700;' : ''}">${left}</td><td style="padding:6px 0;text-align:right;${strong ? 'font-weight:700;' : ''}">${right}</td></tr>`;
const logo = env => env.PILOT_EMAIL_LOGO_URL || 'https://www.aynahealth.co/ayna-favicon-180.png';
const CUSTOMER_FOOTER = 'Questions about your order? Just reply to this email &mdash; a real person on the ayna team will get back to you.';

// Team: a paid order needs buying. Lists every item with the exact retailer link and
// the expected retailer price, plus a button to the admin-only fulfillment page.
export async function notifyTeam(order, items, shipping, email, { env = process.env, send = fetch } = {}) {
  const to = teamRecipients(env);
  if (!to.length) return false;
  const label = orderLabel(order);
  const link = `${pilotConfig(env).origin}/pilot/admin?order=${encodeURIComponent(order.id)}`;
  const address = formatAddress(shipping) || 'No address recorded — check the fulfillment page';
  const lines = items.map(i => {
    const expected = i.retailer_unit_cents * i.quantity;
    return `- ${itemName(i)} × ${i.quantity}\n  Buy from: ${i.retailer_url || 'no link saved — open the fulfillment page'}\n  Expected retailer price: ${money(i.retailer_unit_cents)} each (${money(expected)}) · customer paid ${money(i.customer_line_cents)} for this item`;
  });
  const rows = items.map(i => `<tr><td style="padding:8px 0;border-top:1px solid ${border}"><strong>${esc(itemName(i))}</strong> &times; ${esc(i.quantity)}<br><span style="color:${muted}">Expected retailer price ${esc(money(i.retailer_unit_cents))} each (${esc(money(i.retailer_unit_cents * i.quantity))}) &middot; customer paid ${esc(money(i.customer_line_cents))}</span><br>${i.retailer_url ? `<a href="${esc(i.retailer_url)}" style="color:${navy}">Open exact retailer listing</a>` : '<span style="color:#b42318">No retailer link saved</span>'}</td></tr>`).join('');
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row('Order', esc(label))}${row('Customer', `${esc(shipping?.name || 'customer')} &middot; ${esc(email || 'no email')}`)}${row('Paid', esc(money(order.amount, order.currency)), true)}</table>
<p style="margin:14px 0 4px;color:${muted}">Ship to</p><div style="white-space:pre-line;background:${cream};border-radius:12px;padding:12px 14px">${esc(address)}</div>
<p style="margin:16px 0 0;color:${muted}">Items to buy</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>`;
  return sendMail({ env, send }, {
    to,
    subject: `${modePrefix(env)}New ayna order #${label} – fulfillment needed`,
    text: [`New paid order ${label} — someone needs to buy and ship it.`, '', `Customer: ${shipping?.name || 'customer'} <${email || 'no email'}>`, `Amount paid: ${money(order.amount, order.currency)}`, '', 'Ship to:', address, '', 'Items to buy:', ...lines, '', `Fulfill order (sign-in required): ${link}`].join('\n'),
    html: shell({ logoUrl: logo(env), eyebrow: 'Fulfillment needed', heading: `New order ${label}`, intro: 'Someone needs to buy these exact items and ship them to the customer.', body, ctaUrl: link, ctaLabel: 'Fulfill order', footer: 'The fulfillment page requires an ayna admin sign-in.' }),
  });
}

// Customer: payment received, before any manual fulfillment.
export async function notifyCustomerReceived(order, items, shipping, email, { env = process.env, send = fetch } = {}) {
  if (!EMAIL.test(email || '')) return false;
  const label = orderLabel(order);
  const url = `${pilotConfig(env).origin}/pilot/orders?order=${encodeURIComponent(order.id)}`;
  const breakdown = order.subtotal_cents == null ? '' : `${row('Items', esc(money(order.subtotal_cents, order.currency)))}${row('ayna service fee', esc(money(order.service_fee_cents, order.currency)))}${row('Payment processing', esc(money(order.processing_cents, order.currency)))}`;
  const rows = items.map(i => `<tr><td style="padding:8px 0;border-top:1px solid ${border}">${esc(itemName(i))}<br><span style="color:${muted}">Qty ${esc(i.quantity)}</span></td><td style="padding:8px 0;border-top:1px solid ${border};text-align:right;vertical-align:top">${esc(money(i.customer_line_cents, order.currency))}</td></tr>`).join('');
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid ${border}">${breakdown}${row('Total paid', esc(money(order.amount, order.currency)), true)}</table>
<p style="margin:14px 0 4px;color:${muted}">Shipping to</p><div style="white-space:pre-line;background:${cream};border-radius:12px;padding:12px 14px">${esc(formatAddress(shipping) || 'See your order page')}</div>`;
  const text = [`Hi ${firstName(shipping, email)},`, '', `We received your order ${label}. Thank you for shopping with ayna.`, 'Status: Order received', '', ...items.map(i => `- ${itemName(i)} × ${i.quantity} — ${money(i.customer_line_cents, order.currency)}`), '', `Total paid: ${money(order.amount, order.currency)}`, '', 'Shipping to:', formatAddress(shipping), '', `View your order: ${url}`, '', 'Questions? Just reply to this email.'].join('\n');
  return sendMail({ env, send }, {
    to: [email], reply_to: teamRecipients(env)[0],
    subject: `${modePrefix(env)}We received your ayna order ${label}`,
    text,
    html: shell({ logoUrl: logo(env), eyebrow: `Order ${label}`, heading: 'Order received', intro: `Hi ${esc(firstName(shipping, email))}, thank you &mdash; your payment went through and our team is getting your order ready.`, body, ctaUrl: url, ctaLabel: 'View your order', footer: CUSTOMER_FOOTER }),
  });
}

const CUSTOMER_STATUS = {
  needs_purchase: 'Processing', purchased: 'Processing', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', issue: 'Being looked into', refunded: 'Refunded',
};
export const customerStatusLabel = status => CUSTOMER_STATUS[status] || 'Processing';

// Customer: what we entered on the fulfillment page. Only customer-safe fields are
// read here (never retailer cost, retailer order numbers or internal notes), and an
// item that has not shipped is described as still processing.
export async function notifyCustomerUpdate(order, items, shipping, email, { env = process.env, send = fetch } = {}) {
  if (!EMAIL.test(email || '')) return false;
  const label = orderLabel(order);
  const url = `${pilotConfig(env).origin}/pilot/orders?order=${encodeURIComponent(order.id)}`;
  const allShipped = items.every(i => ['shipped', 'delivered'].includes(i.item_status));
  const detail = i => {
    if (!['shipped', 'delivered'].includes(i.item_status)) return i.item_status === 'issue' ? 'Our team is looking into this item and will email you.' : 'Still being prepared — we’ll email you when it ships.';
    if (!i.tracking_number) return 'Tracking will follow in a separate update.';
    return `${i.carrier ? `${i.carrier} · ` : ''}Tracking # ${i.tracking_number}`;
  };
  const rows = items.map(i => `<tr><td style="padding:10px 0;border-top:1px solid ${border}"><strong>${esc(itemName(i))}</strong><br><span style="color:${muted}">Qty ${esc(i.quantity)}</span><br><span>${esc(detail(i))}</span>${i.tracking_url && ['shipped', 'delivered'].includes(i.item_status) ? `<br><a href="${esc(i.tracking_url)}" style="color:${navy}">Track this shipment</a>` : ''}</td><td style="padding:10px 0;border-top:1px solid ${border};text-align:right;vertical-align:top;font-weight:700">${esc(customerStatusLabel(i.item_status))}</td></tr>`).join('');
  const text = [`Hi ${firstName(shipping, email)},`, '', `Your ayna order has been processed.`, `Order ${label}`, '', ...items.flatMap(i => [`- ${itemName(i)} × ${i.quantity}: ${customerStatusLabel(i.item_status)}`, `  ${detail(i)}`, ...(i.tracking_url && ['shipped', 'delivered'].includes(i.item_status) ? [`  Track: ${i.tracking_url}`] : [])]), '', `View your order: ${url}`, '', 'Questions? Just reply to this email.'].join('\n');
  return sendMail({ env, send }, {
    to: [email], reply_to: teamRecipients(env)[0],
    subject: `${modePrefix(env)}${allShipped ? `Your ayna order ${label} is on its way` : `Update on your ayna order ${label}`}`,
    text,
    html: shell({ logoUrl: logo(env), eyebrow: `Order ${label}`, heading: allShipped ? 'It’s on its way' : 'Order update', intro: `Hi ${esc(firstName(shipping, email))}, your ayna order has been processed.${allShipped ? '' : ' Some items are still being prepared &mdash; each one is listed below.'}`, body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`, ctaUrl: url, ctaLabel: 'View your order', footer: CUSTOMER_FOOTER }),
  });
}

// Sends the team notification and the customer's "order received" email for a paid
// order and records which ones went out, so the admin inbox can offer a retry.
// `only` limits it to one of 'team' | 'customer' (used by the admin retry).
export async function sendOrderEmails(db, orderId, session = null, { only = null, env = process.env, send = fetch } = {}) {
  const read = async (query) => { const r = await query; if (r.error) throw new Error('Pilot database operation failed'); return r.data; };
  const order = await read(db.from('pilot_orders').select('*').eq('id', orderId).single());
  const items = await read(db.from('pilot_order_items').select('*').eq('order_id', orderId).order('line_no', { ascending: true }));
  const fulfillment = await read(db.from('pilot_fulfillments').select('shipping,customer_email').eq('order_id', orderId).maybeSingle());
  const shipping = fulfillment?.shipping || session?.collected_information?.shipping_details || session?.shipping_details || {};
  const email = fulfillment?.customer_email || session?.customer_details?.email || null;
  const sent = {};
  if (only !== 'customer') sent.team = await notifyTeam(order, items, shipping, email, { env, send });
  if (only !== 'team') sent.customer = await notifyCustomerReceived(order, items, shipping, email, { env, send });
  const now = new Date().toISOString();
  const stamp = { ...(sent.team ? { team_notified_at: now } : {}), ...(sent.customer ? { customer_confirmed_at: now } : {}) };
  if (Object.keys(stamp).length) await db.from('pilot_fulfillments').update(stamp).eq('order_id', orderId);
  return sent;
}
