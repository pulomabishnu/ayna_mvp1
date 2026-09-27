import { getSupabaseClient } from './supabaseClient';
export const FEEDBACK_CAMPAIGN = '2026-09-26';
const PENDING_KEY = 'ayna_retailer_returns_v1';
let activeOwner = null;
let memoryQueue = [];
export function setFeedbackOwner(owner) { activeOwner = owner; }
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export async function sendFeedback(body, authenticated = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authenticated) {
    const { data } = await getSupabaseClient()?.auth.getSession() || {};
    const token = data?.session?.access_token;
    if (!token) throw new Error('Sign in required');
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch('/api/feedback', { method: 'POST', headers, body: JSON.stringify(body), keepalive: true });
  if (!response.ok) throw new Error('Could not save. Please try again.');
  return response.json();
}
export function readPurchaseQueue() {
  try {
    const rows = JSON.parse(sessionStorage.getItem(PENDING_KEY) || '[]');
    memoryQueue = Array.isArray(rows) ? rows : [];
    return Array.isArray(rows) ? rows.filter(row => row.createdAt > Date.now() - MAX_AGE).slice(-20) : [];
  } catch { return memoryQueue.filter(row => row.createdAt > Date.now() - MAX_AGE).slice(-20); }
}
export function writePurchaseQueue(rows) {
  memoryQueue = rows;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(rows)); } catch { /* Tab storage may be disabled. */ }
}
export function updatePurchase(id, patch) { writePurchaseQueue(readPurchaseQueue().map(row => row.id === id ? { ...row, ...patch } : row)); }
export function removePurchase(id) { writePurchaseQueue(readPurchaseQueue().filter(row => row.id !== id)); }
export function readyPurchase(rows) { return rows.find(row => row.departed && !row.prompted && row.receipt) || null; }
export function recordRetailerVisit(product, variant = null) {
  const id = crypto.randomUUID();
  const row = { id, owner: activeOwner, name: product.name, productId: product.id, variant: variant?.label || '', createdAt: Date.now(), departed: false, prompted: false };
  writePurchaseQueue([...readPurchaseQueue(), row]);
  // Opening the retailer remains the anchor's normal action, independent of this request.
  void sendFeedback({ action: 'begin-purchase', productId: product.id, ...(variant ? { variantId: variant.id } : {}) }).then(({ receipt }) => {
    updatePurchase(id, { receipt });
    window.dispatchEvent(new Event('ayna-purchase-ready'));
  }).catch(() => removePurchase(id));
}
