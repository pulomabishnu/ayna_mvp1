import { withAuthRetry } from './authToken.js';
import { fetchWithTimeout } from './network.js';
import { apiUrl } from './apiUrl.js';
export const FEEDBACK_CAMPAIGN = '2026-09-26';
const PENDING_KEY = 'ayna_retailer_returns_v1';
let activeOwner = null;
let memoryQueue = [];
export function setFeedbackOwner(owner) { activeOwner = owner; }
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
// Same 14 days the server enforces (api/_feedbackStore.js). This device copy
// also covers the answer time, which the server never links to an account.
export const SURVEY_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;
const SURVEY_SEEN_KEY = 'ayna_feedback_survey_seen_v1';
function readSeen() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SURVEY_SEEN_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}
/** When this device last showed, closed or sent the survey for this account. */
export function markSurveySeen(userId, now = Date.now()) {
  if (!userId) return;
  try { localStorage.setItem(SURVEY_SEEN_KEY, JSON.stringify({ ...readSeen(), [userId]: now })); } catch { /* storage unavailable: the server still limits it */ }
}
export function surveySeenRecently(userId, now = Date.now()) {
  const last = Number(readSeen()[userId]);
  return Number.isFinite(last) && now - last < SURVEY_INTERVAL_MS;
}
export async function sendFeedback(body, authenticated = false) {
  const post = (token) => fetchWithTimeout(apiUrl('/api/feedback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    keepalive: true,
  });
  // Signed-in calls get a fresh token and one refresh-and-retry on 401
  // (src/utils/authToken.js); reading the session once failed right after sign-in.
  const response = authenticated ? await withAuthRetry(post) : await post(null);
  if (!response) { const e = new Error('Sign in required'); e.code = 'auth_required'; throw e; }
  if (response.status === 401) { const e = new Error('Sign in required'); e.code = 'auth_required'; throw e; }
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
