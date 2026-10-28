/**
 * The products she picked to compare (2 to 4), shared by Saved, the save
 * prompt, product cards in select mode and the compare page, on the app
 * and the website. Kept on this device (not health data); works signed out.
 *
 * { ids: [productId], items: { [id]: compact product }, selecting: boolean }
 */
import { useSyncExternalStore } from 'react';

export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

const KEY = 'ayna_compare_v1';
const KEEP = ['id', 'name', 'brand', 'category', 'type', 'price', 'image', 'imageUrl', 'images', 'summary', 'userAdded'];
let state = load();
const listeners = new Set();
// The app or website root registers how to open the compare view.
let opener = null;

function load() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(KEY) || 'null');
    const ids = Array.isArray(raw?.ids) ? raw.ids.filter((x) => typeof x === 'string').slice(0, COMPARE_MAX) : [];
    const items = raw?.items && typeof raw.items === 'object' ? raw.items : {};
    return { ids, items: Object.fromEntries(ids.map((id) => [id, items[id] || { id }])), selecting: false };
  } catch {
    return { ids: [], items: {}, selecting: false };
  }
}
function persist() {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify({ ids: state.ids, items: state.items })); } catch { /* storage blocked */ }
}
function set(next) {
  state = next;
  persist();
  listeners.forEach((fn) => fn());
}
const compact = (p) => Object.fromEntries(KEEP.filter((k) => p?.[k] != null).map((k) => [k, p[k]]));

export const compareStore = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  has: (id) => state.ids.includes(id),
  /** Add or remove. Returns 'added' | 'removed' | 'full'. */
  toggle(product) {
    if (!product?.id) return 'removed';
    if (state.ids.includes(product.id)) {
      const items = { ...state.items }; delete items[product.id];
      set({ ...state, ids: state.ids.filter((x) => x !== product.id), items });
      return 'removed';
    }
    if (state.ids.length >= COMPARE_MAX) return 'full';
    set({ ...state, ids: [...state.ids, product.id], items: { ...state.items, [product.id]: compact(product) } });
    return 'added';
  },
  add(product) { return state.ids.includes(product?.id) ? 'added' : this.toggle(product); },
  remove(id) { if (state.ids.includes(id)) this.toggle({ id }); },
  replaceAll(products = []) {
    const list = products.filter((p) => p?.id).slice(0, COMPARE_MAX);
    set({ ...state, ids: list.map((p) => p.id), items: Object.fromEntries(list.map((p) => [p.id, compact(p)])) });
  },
  clear() { set({ ...state, ids: [], items: {} }); },
  setOpener(fn) { opener = typeof fn === 'function' ? fn : null; return () => { if (opener === fn) opener = null; }; },
  canOpen: () => Boolean(opener),
  open() { state = { ...state, selecting: false }; listeners.forEach((f) => f()); opener?.(); },
  setSelecting(on) { if (state.selecting !== Boolean(on)) set({ ...state, selecting: Boolean(on) }); },
};

/** React: the current compare list. `resolve(id)` maps an id to the full catalog product. */
export function useCompare(resolve = null) {
  const s = useSyncExternalStore(compareStore.subscribe, compareStore.get, compareStore.get);
  const products = s.ids.map((id) => (resolve && resolve(id)) || s.items[id]).filter(Boolean);
  return { ...s, products, count: s.ids.length, full: s.ids.length >= COMPARE_MAX };
}
