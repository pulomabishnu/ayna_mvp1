/**
 * Browser side of the free product campaign. Talks only to /api/campaign;
 * the server decides everything. Errors come back as { error } objects, never
 * thrown, so the page can always show a calm recovery state.
 */
import posthog from 'posthog-js';
import { getSupabaseClient } from './supabaseClient';
import { CAMPAIGN_ID } from './campaignRules';

async function token() {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    return data?.session?.access_token || null;
  } catch { return null; }
}

async function request(method, body, { retries = 0 } = {}) {
  const t = await token();
  if (!t) return { error: 'auth_required', httpStatus: 401 };
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch('/api/campaign', {
        method,
        headers: { Authorization: `Bearer ${t}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try { data = await res.json(); } catch { /* empty */ }
      if (res.ok) return { ...data, httpStatus: res.status };
      if (res.status >= 500 && attempt < retries) continue;
      return { ...data, error: data.error || data.status || 'server_error', httpStatus: res.status };
    } catch {
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 600 * (attempt + 1))); continue; }
      return { error: 'network', httpStatus: 0 };
    }
  }
}

export const loadCampaignStatus = () => request('GET', null, { retries: 2 });
export const submitFeedback = (questionKey, response) => request('POST', { action: 'feedback', questionKey, response });
export const spinForProduct = () => request('POST', { action: 'spin' });
export const saveShipping = (address) => request('POST', { action: 'shipping', address });

/** One key per claim attempt, reused on retries/refresh so the server can recognise replays. */
export function claimKey(spinId) {
  const k = `ayna_claim_key_${CAMPAIGN_ID}_${spinId}`;
  try {
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
  } catch { /* private mode */ }
  const bytes = new Uint8Array(18);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  try { sessionStorage.setItem(k, key); } catch { /* private mode */ }
  return key;
}

/**
 * Claim with a network-safe retry: the same idempotency key is resent, so a
 * request that actually went through comes back as "already_claimed, same
 * request" rather than failing.
 */
export async function claimProduct({ rewardId, spinId }) {
  const idempotencyKey = claimKey(spinId);
  return request('POST', { action: 'claim', rewardId, spinId, idempotencyKey }, { retries: 2 });
}

/** PostHog, ids and counts only. Never feedback text, addresses or emails. */
export function track(event, props = {}) {
  try { posthog.capture(event, { campaign: CAMPAIGN_ID, ...props }); } catch { /* analytics off */ }
}

/** First visit from the email: ?utm_source=email&utm_campaign=free-product-2026 */
export function trackEmailArrival() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('utm_campaign') === CAMPAIGN_ID && q.get('utm_source') === 'email') track('campaign_email_cta_clicked');
  } catch { /* noop */ }
}
