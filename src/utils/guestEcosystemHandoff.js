/**
 * The ecosystem a guest built on this browser (ayna_guest_ecosystem_v1) is
 * handed to her account when she signs in: the products her account doesn't
 * already have are saved to it first, and the device copy is removed only
 * once that save succeeded. If it fails (offline, server hiccup) the copy
 * stays and the next sign-in tries again, so nothing is lost.
 */
import { upsertProductsBatch } from './ecosystemStore.js';

export const GUEST_ECO_KEY = 'ayna_guest_ecosystem_v1';
const FLAGS = { inEcosystem: true, isTracked: true, isOmitted: false };

export function readGuestEcosystem(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(GUEST_ECO_KEY) || 'null');
    if (!saved || !saved.myProducts || typeof saved.myProducts !== 'object' || Array.isArray(saved.myProducts)) return null;
    const products = Object.entries(saved.myProducts)
      .filter(([, p]) => p && typeof p === 'object')
      .map(([id, p]) => (p.id ? p : { ...p, id }));
    return { products, order: Array.isArray(saved.order) ? saved.order.filter((id) => typeof id === 'string') : products.map((p) => p.id) };
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{ products: object[], order: string[], uploaded: boolean }>}
 *   `products` are the guest-only ones (to show right away either way).
 */
export async function handOffGuestEcosystem({ supabase, userId, account, storage = globalThis.localStorage, upsert = upsertProductsBatch } = {}) {
  const saved = readGuestEcosystem(storage);
  if (!saved) return { products: [], order: [], uploaded: true };
  // Never override what her account already says about a product (on a shelf, or hidden).
  const taken = new Set([...Object.keys(account?.myProducts || {}), ...Object.keys(account?.omittedProducts || {})]);
  const products = saved.products.filter((p) => !taken.has(p.id));
  const order = saved.order.filter((id) => products.some((p) => p.id === id));
  if (products.length) {
    if (!supabase || !userId) return { products, order, uploaded: false };
    let result = null;
    try { result = await upsert(supabase, userId, products, FLAGS); } catch { result = null; }
    if (!result?.synced) return { products, order, uploaded: false };
  }
  try { storage?.removeItem(GUEST_ECO_KEY); } catch { /* storage blocked */ }
  return { products, order, uploaded: true };
}
