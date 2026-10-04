// Browser cart for ayna checkout. It stores only WHAT to buy (product, exact option,
// quantity), never a price: the server prices every line again when the cart is
// shown and again when checkout starts. Different options of one product are
// separate lines; adding the same option again just raises its quantity.
import { useSyncExternalStore } from 'react';

export const CART_MAX_QTY = 10;
export const CART_MAX_LINES = 20;
const STORAGE_KEY = 'ayna-pilot-cart-v1';
const EVENT = 'ayna-pilot-cart';
const ID = /^[a-z0-9][a-z0-9._-]{1,100}$/i;

export const lineKey = line => `${line.productId}\u0000${line.variantId}`;

// Accepts whatever was stored (or tampered with) and keeps only well-formed lines.
export function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  const merged = new Map();
  for (const item of raw) {
    const productId = typeof item?.productId === 'string' ? item.productId : '';
    const variantId = typeof item?.variantId === 'string' ? item.variantId : '';
    const quantity = item?.quantity;
    if (!ID.test(productId) || variantId.length > 100 || !Number.isInteger(quantity) || quantity < 1) continue;
    const key = lineKey({ productId, variantId });
    const line = merged.get(key) || { productId, variantId, quantity: 0 };
    line.quantity = Math.min(CART_MAX_QTY, line.quantity + quantity);
    merged.set(key, line);
  }
  return [...merged.values()].slice(0, CART_MAX_LINES);
}

let memory = [];
let current = readStorage();
const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeCart(JSON.parse(raw)) : [];
  } catch { return memory; } // storage blocked (private mode): keep working in memory
}
function commit(lines) {
  current = lines; memory = lines;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* memory copy still works this visit */ }
  for (const listener of listeners) listener();
}
if (typeof window !== 'undefined') {
  // Another tab changed the cart.
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) { current = readStorage(); for (const listener of listeners) listener(); }
  });
}

export function getCart() { return current; }
export function cartCount(lines = current) { return lines.reduce((sum, line) => sum + line.quantity, 0); }

// Returns { added, capped, full }: `capped` when the line hit the per-item limit,
// `full` when a new line could not be added because the cart has too many lines.
export function addToCart(productId, variantId = '', quantity = 1) {
  const next = sanitizeCart([{ productId, variantId, quantity: 1 }]);
  if (!next.length || !Number.isInteger(quantity) || quantity < 1) return { added: false, capped: false, full: false };
  const key = lineKey({ productId, variantId });
  const existing = current.find(line => lineKey(line) === key);
  if (!existing && current.length >= CART_MAX_LINES) return { added: false, capped: false, full: true };
  const wanted = (existing?.quantity || 0) + quantity;
  const quantityNow = Math.min(CART_MAX_QTY, wanted);
  commit(existing
    ? current.map(line => (lineKey(line) === key ? { ...line, quantity: quantityNow } : line))
    : [...current, { productId, variantId, quantity: quantityNow }]);
  return { added: true, capped: wanted > CART_MAX_QTY, full: false };
}
export function setCartQuantity(productId, variantId, quantity) {
  const key = lineKey({ productId, variantId });
  if (!Number.isInteger(quantity) || quantity < 1) return removeFromCart(productId, variantId);
  commit(current.map(line => (lineKey(line) === key ? { ...line, quantity: Math.min(CART_MAX_QTY, quantity) } : line)));
}
export function removeFromCart(productId, variantId) {
  const key = lineKey({ productId, variantId });
  commit(current.filter(line => lineKey(line) !== key));
}
export function clearCart() { commit([]); }

function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function useCart() { return useSyncExternalStore(subscribe, getCart, getCart); }
// Test hook: reload from storage after it was changed behind the module's back.
export function reloadCartFromStorage() { current = readStorage(); for (const listener of listeners) listener(); }
export { EVENT as CART_EVENT };
