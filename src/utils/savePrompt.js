/**
 * After Save: which product just got saved, so one small follow-up
 * ("Remind me later · Compare") can show next to it. A product page that is
 * open for that product shows it inline and registers itself as the host;
 * everywhere else (cards) a small strip shows it for a few seconds.
 *
 * Also: a save she started while signed out, kept until she signs in
 * (sessionStorage, so it survives the Google or Apple redirect).
 */
import { useSyncExternalStore } from 'react';

let state = { product: null, at: 0, hosts: [] };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export const savePrompt = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  show(product) { if (product?.id) { state = { ...state, product, at: Date.now() }; emit(); } },
  hide() { if (state.product) { state = { ...state, product: null }; emit(); } },
  host(id) { state = { ...state, hosts: [...state.hosts, id] }; emit(); return () => { const i = state.hosts.indexOf(id); if (i >= 0) { const h = [...state.hosts]; h.splice(i, 1); state = { ...state, hosts: h }; emit(); } }; },
};

export function useSavePrompt() {
  return useSyncExternalStore(savePrompt.subscribe, savePrompt.get, savePrompt.get);
}

const PENDING_KEY = 'ayna_pending_save_v1';
const KEEP = ['id', 'name', 'brand', 'category', 'type', 'price', 'image', 'imageUrl', 'images', 'summary'];

export function stashPendingSave(product) {
  if (!product?.id) return;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(Object.fromEntries(KEEP.filter((k) => product[k] != null).map((k) => [k, product[k]])))); } catch { /* storage blocked */ }
}

/** The save to finish after sign-in (read once). */
export function takePendingSave() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const p = raw ? JSON.parse(raw) : null;
    return p?.id ? p : null;
  } catch { return null; }
}

export function hasPendingSave() {
  try { return Boolean(sessionStorage.getItem(PENDING_KEY)); } catch { return false; }
}
