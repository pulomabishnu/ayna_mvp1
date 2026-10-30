/**
 * Browser side of the gift box. Every decision (limit, prices, one order per
 * link) is made again by /api/giftbox; nothing here is trusted by the server.
 */
import { getSupabaseClient } from '../../utils/supabaseClient';

export class GiftBoxError extends Error {
  constructor(code, status, body) {
    super(code);
    this.code = code;
    this.status = status;
    this.body = body;
  }
}

async function accessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session.access_token;
    const { data: r } = await supabase.auth.refreshSession();
    return r?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = body ? { 'Content-Type': 'application/json' } : {};
  if (auth) {
    const t = await accessToken();
    if (!t) throw new GiftBoxError('auth_required', 401);
    headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new GiftBoxError('network', 0);
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok) throw new GiftBoxError(json?.error || `http_${res.status}`, res.status, json);
  return json;
}

/** /gift/<token> → token, /gift → '' */
export function tokenFromPath(path = typeof window !== 'undefined' ? window.location.pathname : '') {
  const m = String(path).match(/^\/gift\/([A-Za-z0-9_-]{20,64})\/?$/);
  return m ? m[1] : '';
}

export const loadShop = (token) => (token
  ? request(`/api/giftbox?token=${encodeURIComponent(token)}`)
  : request('/api/giftbox', { auth: true }));

export const checkout = (token, items, shipping) => request('/api/giftbox', {
  method: 'POST',
  auth: !token,
  body: { ...(token ? { token } : {}), items, shipping },
});

export const getAdmin = () => request('/api/giftbox-admin', { auth: true });
export const adminAction = (body) => request('/api/giftbox-admin', { method: 'POST', body, auth: true });

export const money = (cents) => {
  const n = Number(cents || 0) / 100;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

/** Cart total in cents from { [productId]: qty } and the product list. */
export function cartTotal(cart, products) {
  return products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.priceCents, 0);
}

export const giftLink = (token) => `${typeof window !== 'undefined' ? window.location.origin : 'https://www.aynahealth.co'}/gift/${token}`;
