/**
 * Shared pieces for the gift box (monthly focus group winner): input checks,
 * public product shape, and the two emails. Tables and checkout live in
 * supabase/migrations/20261030120000_gift_box.sql.
 */
import { SITE_URL, escapeHtml, renderLayout } from './_campaignEmail.js';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const ORDER_STATUSES = ['new', 'preparing', 'shipped', 'delivered', 'canceled'];
export const MAX_CART_LINES = 50;

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Cart from the browser: [{ id, qty }]. Merges repeats. Null when malformed. */
export function parseCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_CART_LINES) return null;
  const byId = new Map();
  for (const it of items) {
    const id = String(it?.id || '');
    const qty = Number(it?.qty ?? 1);
    if (!UUID_RE.test(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return null;
    byId.set(id, (byId.get(id) || 0) + qty);
  }
  return [...byId].map(([id, qty]) => ({ id, qty }));
}

/** Shipping form. Returns { ship } or { error: field }. */
export function parseShipping(raw = {}) {
  const ship = {
    name: clean(raw.name, 120),
    email: clean(raw.email, 254).toLowerCase(),
    phone: clean(raw.phone, 40),
    line1: clean(raw.line1, 200),
    line2: clean(raw.line2, 200),
    city: clean(raw.city, 100),
    state: clean(raw.state, 60),
    postal: clean(raw.postal, 20),
    note: String(raw.note ?? '').trim().slice(0, 1000),
  };
  for (const k of ['name', 'line1', 'city', 'state']) if (!ship[k]) return { error: k };
  if (!EMAIL_RE.test(ship.email)) return { error: 'email' };
  if (ship.postal.length < 3) return { error: 'postal' };
  return { ship };
}

/** Only http(s) or a site path, so an image or link can't be javascript:. */
export function safeUrl(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (/^\/[^/]/.test(s) && s.length <= 2000) return s;
  try {
    const u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') && s.length <= 2000 ? u.href : null;
  } catch {
    return null;
  }
}

/** What a shopper sees of a product. */
export function publicProduct(p) {
  return {
    id: p.id,
    category: p.category || '',
    brand: p.brand || '',
    name: p.name,
    notes: p.notes || '',
    priceCents: p.price_cents,
    imageUrl: p.image_url || null,
    productUrl: p.product_url || null,
    maxPerOrder: p.max_per_order || 1,
  };
}

export const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2).replace(/\.00$/, '')}`;

const INK = '#3e2723';
const SOFT = '#6b524d';
const UI = "'DM Sans', Arial, Helvetica, sans-serif";

function itemRows(items = []) {
  return items.map((it) => `<tr>
    <td style="padding:6px 12px 6px 0;font:500 15px/22px ${UI};color:${INK}">${escapeHtml([it.brand, it.name].filter(Boolean).join(' · '))}${it.qty > 1 ? ` × ${it.qty}` : ''}</td>
    <td style="padding:6px 0;font:600 15px/22px ${UI};color:${INK};text-align:right;white-space:nowrap">${escapeHtml(money(it.priceCents * it.qty))}</td>
  </tr>`).join('');
}

const itemText = (items = []) => items.map((it) => `- ${[it.brand, it.name].filter(Boolean).join(' · ')}${it.qty > 1 ? ` x${it.qty}` : ''} (${money(it.priceCents * it.qty)})`).join('\n');

/** To the winner, right after checkout. */
export function winnerConfirmationEmail({ name, items, totalCents }) {
  const first = String(name || '').split(' ')[0];
  const body = `
    <h1 style="margin:0 0 16px;font:400 40px/44px 'DM Serif Display', Georgia, serif;color:${INK}">Your gift box is in.</h1>
    <p style="margin:0 0 18px;font:400 17px/27px ${UI};color:${INK}">${first ? `Thanks, ${escapeHtml(first)}. ` : ''}Here's what you picked. We pack and ship these ourselves, and we'll email you when it's on the way.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8d58f;border-bottom:1px solid #e8d58f;margin:0 0 18px">${itemRows(items)}</table>
    <p style="margin:0 0 18px;font:400 14px/22px ${UI};color:${SOFT}">Value ${escapeHtml(money(totalCents))}. You pay nothing.</p>`;
  return {
    subject: 'Your ayna gift box is in',
    html: renderLayout({ title: 'Your gift box is in', preheader: "Here's what you picked.", body, reason: 'You are getting this because you won the ayna focus group gift box.' }),
    text: `Your gift box is in.\n\n${itemText(items)}\n\nValue ${money(totalCents)}. You pay nothing. We'll email you when it ships.`,
  };
}

/** To the team: everything needed to pack and ship it. */
export function teamOrderEmail({ kind, placedBy, items, totalCents, budgetCents, ship }) {
  const who = kind === 'admin' ? `Admin order (${placedBy})` : `Winner: ${placedBy}`;
  const address = [ship.line1, ship.line2, `${ship.city}, ${ship.state} ${ship.postal}`].filter(Boolean).join(', ');
  const rows = [
    ['Ship to', ship.name], ['Address', address], ['Email', ship.email], ['Phone', ship.phone], ['Note', ship.note],
    ['Total', `${money(totalCents)}${budgetCents ? ` of ${money(budgetCents)}` : ''}`],
  ].filter(([, v]) => v);
  const adminUrl = `${SITE_URL}/admin/gift`;
  return {
    subject: `Gift box order: ${ship.name} (${items.length} item${items.length === 1 ? '' : 's'})`,
    html: `<div style="background:#ffedac;padding:24px"><div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid ${INK};border-radius:16px;padding:24px">
      <p style="margin:0 0 12px;color:${INK};font:600 16px/24px ${UI}">${escapeHtml(who)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${itemRows(items)}</table>
      <table role="presentation" cellpadding="0" cellspacing="0">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:${SOFT};font:400 14px/20px ${UI};vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0;color:${INK};font:600 14px/20px ${UI}">${escapeHtml(v)}</td></tr>`).join('')}</table>
      <p style="margin:20px 0 0"><a href="${adminUrl}" style="color:${INK};font:600 15px/22px ${UI}">Open gift box admin</a></p>
    </div></div>`,
    text: `${who}\n\n${itemText(items)}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${adminUrl}`,
  };
}
