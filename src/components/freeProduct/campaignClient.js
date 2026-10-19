/**
 * Browser side of the free product campaign. Thin on purpose: every decision
 * (eligibility, which product, whether a claim worked) comes back from
 * /api/campaign. Nothing here is trusted by the server.
 */
import posthog from 'posthog-js';
import { getSupabaseClient } from '../../utils/supabaseClient';

export class CampaignRequestError extends Error {
  constructor(code, status, body) {
    super(code);
    this.code = code;
    this.status = status;
    this.body = body;
  }
}

async function token() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function call(path, { method = 'GET', body } = {}) {
  const t = await token();
  if (!t) throw new CampaignRequestError('auth_required', 401);
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${t}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new CampaignRequestError('network', 0);
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok) throw new CampaignRequestError(json?.error || `http_${res.status}`, res.status, json);
  return json;
}

export const getCampaignStatus = () => call('/api/campaign');
export const saveFeedback = (key, response) => call('/api/campaign', { method: 'POST', body: { action: 'feedback', key, response } });
export const spin = () => call('/api/campaign', { method: 'POST', body: { action: 'spin' } });
export const claim = (spinId, idempotencyKey) => call('/api/campaign', { method: 'POST', body: { action: 'claim', spinId, idempotencyKey } });
export const saveShipping = (address) => call('/api/campaign', { method: 'POST', body: { action: 'shipping', address } });

export const getAdminOverview = () => call('/api/campaign-admin');
export const adminAction = (body) => call('/api/campaign-admin', { method: 'POST', body });

/** Random key for one claim attempt; retries of the same attempt reuse it. */
export function newIdempotencyKey() {
  const bytes = new Uint8Array(16);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * PostHog, same conventions as the rest of the site: snake_case past-tense
 * names, camelCase props, no free text, no addresses, no emails. The global
 * sanitizer in main.jsx strips sensitive keys again as a backstop.
 */
export function track(event, props = {}) {
  try { posthog.capture(event, { campaign: 'free-product-2026', ...props }); } catch { /* analytics never breaks the page */ }
}

/** Fire an event at most once per browser for this campaign (e.g. "eligible"). */
export function trackOnce(event, props = {}, scope = '') {
  const key = `ayna_fp_once_v1:${event}:${scope}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, '1');
  } catch { /* private mode: may fire twice, acceptable */ }
  track(event, props);
}

export function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
