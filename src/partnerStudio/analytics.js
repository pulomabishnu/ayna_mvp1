/**
 * Partner Studio product analytics (Phase 1 plan, p.14: "PostHog may track B2B
 * dashboard usage with non-sensitive event names; avoid health-related
 * payloads"). Events carry only which screen or control was used and the
 * brand being viewed, never a claim, need, scenario or product text.
 *
 * Same rules as the main site: only www.aynahealth.co reports, only after the
 * visitor granted analytics consent, no session recording, no IP.
 */
import posthog from 'posthog-js';
import { getStoredConsent } from '../utils/analyticsConsent.js';

let ready = false;

export function initPartnerAnalytics() {
  if (ready || typeof window === 'undefined') return;
  const key = String(import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '').trim();
  const allowed = window.location.hostname === 'www.aynahealth.co';
  if (!key || !allowed || getStoredConsent() !== 'granted') return;
  posthog.init(key, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest',
    ui_host: 'https://us.posthog.com',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    mask_all_text: true,
    ip: false,
    person_profiles: 'identified_only',
  });
  posthog.register({ platform: 'web', surface: 'partner_studio' });
  ready = true;
}

const ALLOWED = new Set(['partner_studio_opened', 'partner_studio_module_viewed', 'partner_studio_brand_switched', 'partner_studio_source_opened', 'partner_studio_action_updated', 'partner_studio_export_downloaded', 'partner_studio_methodology_opened']);

/** @param {string} event one of ALLOWED  @param {Record<string, string|number|boolean>} props */
export function track(event, props = {}) {
  if (!ready || !ALLOWED.has(event)) return;
  const safe = {};
  for (const [k, v] of Object.entries(props)) if (['module', 'brand', 'status', 'kind', 'category'].includes(k) && ['string', 'number', 'boolean'].includes(typeof v)) safe[k] = v;
  try { posthog.capture(event, safe); } catch { /* analytics never breaks the page */ }
}
