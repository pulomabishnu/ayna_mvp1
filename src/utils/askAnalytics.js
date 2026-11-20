import posthog from 'posthog-js';

/**
 * Ask ayna funnel (Nov 19, analytics gap report P0). Never the question or the answer text:
 *   ask_message_sent      { surface, is_retry, is_followup, history_len }
 *   ask_answer_received   { surface, duration_ms, followups_count, has_products }
 *   ask_answer_failed     { surface, reason: network | server | timeout }
 *   ask_limit_reached     { surface, kind: monthly | burst }
 *   ask_account_needed    { surface }   (signed out, asked something that needs the AI)
 */
const SURFACES = new Set(['web', 'app']);
const REASONS = new Set(['network', 'server', 'timeout']);
const KINDS = new Set(['monthly', 'burst']);
export const ASK_EVENTS = ['ask_message_sent', 'ask_answer_received', 'ask_answer_failed', 'ask_limit_reached', 'ask_account_needed'];

export function askEventProps(props = {}) {
  const out = {};
  if (SURFACES.has(props.surface)) out.surface = props.surface;
  if (typeof props.is_retry === 'boolean') out.is_retry = props.is_retry;
  if (typeof props.is_followup === 'boolean') out.is_followup = props.is_followup;
  if (typeof props.has_products === 'boolean') out.has_products = props.has_products;
  for (const k of ['history_len', 'duration_ms', 'followups_count']) {
    const n = Number(props[k]);
    if (Number.isFinite(n) && n >= 0) out[k] = Math.round(Math.min(n, k === 'duration_ms' ? 600000 : 1000));
  }
  if (REASONS.has(props.reason)) out.reason = props.reason;
  if (KINDS.has(props.kind)) out.kind = props.kind;
  return out;
}

/** network / timeout / server, from whatever the fetch threw (exported for tests). */
export function askFailReason(err) {
  const msg = String(err?.message || '').toLowerCase();
  if (err?.name === 'AbortError' || /timed? ?out/.test(msg)) return 'timeout';
  if (/network|failed to fetch|load failed|offline|connection/.test(msg)) return 'network';
  return 'server';
}

let client = posthog;
/** Tests swap the client. */
export function setAskAnalyticsClient(c) { client = c || posthog; }

export function trackAsk(event, props = {}) {
  if (!ASK_EVENTS.includes(event)) return;
  try { client.capture(event, askEventProps(props)); } catch { /* analytics never blocks */ }
}
