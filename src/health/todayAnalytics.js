/**
 * Today decision log for PostHog (Phase 1, step 9; master prompt sections
 * 85, 150, 158). Enough to compute retention by history length, the
 * meaningful-action rate, the dismissal rate, insight relevance, follow-up
 * completion and outcome capture, and NOTHING about her health:
 *
 *   never: item ids, needs, symptoms, pattern metrics, class ids, drug
 *   classes, product ids, triage answers, outcome values, text.
 *
 * Every property passes a whitelist of keys AND of values. Anything else is
 * dropped before it reaches posthog.capture. Decision replay (section 150)
 * stays on the device (decide()'s debug), not in analytics.
 */
import posthog from 'posthog-js';

export const ITEM_TYPES = ['insight', 'check_in', 'follow_up', 'option', 'care', 'ask', 'products'];
export const ITEM_TIERS = ['safety', 'care', 'symptom', 'wellness', 'products'];
export const OUTPUTS = ['answer', 'ask_more', 'show_options', 'monitor', 'escalate', 'abstain', 'no_action'];
export const ITEM_ACTIONS = ['useful', 'not_relevant', 'show_options', 'remind', 'start_try', 'answer', 'open'];
// How much history she has, in coarse buckets (for retention by history).
export const HISTORY_BUCKETS = ['none', 'under_7', 'under_30', 'under_90', '90_plus'];

// Daily rundown and weekly recap (src/components/rundown): card categories only.
export const RUNDOWN_KINDS = ['daily', 'weekly'];
export const RUNDOWN_CATEGORIES = ['safety', 'goal', 'change', 'symptom', 'pattern', 'education', 'match', 'saved', 'community', 'win', 'week', 'frame'];
export const RUNDOWN_ACTIONS = ['answer', 'open', 'ask', 'save', 'not_relevant', 'not_useful', 'remind'];

export const TODAY_EVENTS = {
  today_items_shown: { count: 'count', types: ITEM_TYPES, tiers: ITEM_TIERS, output: OUTPUTS, history: HISTORY_BUCKETS },
  today_item_action: { type: ITEM_TYPES, action: ITEM_ACTIONS },
  followup_due: { count: 'count' },
  followup_completed: { completed: [true] },
  rundown_opened: { kind: RUNDOWN_KINDS, count: 'count', categories: RUNDOWN_CATEGORIES },
  rundown_card_action: { kind: RUNDOWN_KINDS, category: RUNDOWN_CATEGORIES, action: RUNDOWN_ACTIONS },
  rundown_closed: { kind: RUNDOWN_KINDS, seen: 'count', count: 'count' },
};

const one = (allowed, v) => (allowed === 'count' ? (Number.isInteger(v) && v >= 0 && v <= 50 ? v : undefined) : allowed.includes(v) ? v : undefined);

/** Keep only whitelisted keys and values. Arrays are filtered element by element. */
export function sanitizeTodayProps(event, props = {}) {
  const spec = TODAY_EVENTS[event];
  if (!spec) return null;
  const out = {};
  for (const [k, allowed] of Object.entries(spec)) {
    const v = props[k];
    if (Array.isArray(v)) {
      if (allowed === 'count') continue;
      const list = v.filter((x) => allowed.includes(x));
      if (list.length || v.length === 0) out[k] = list;
    } else {
      const x = one(allowed, v);
      if (x !== undefined) out[k] = x;
    }
  }
  return out;
}

export function historyBucket(daysLogged) {
  const n = Number(daysLogged) || 0;
  return n <= 0 ? 'none' : n < 7 ? 'under_7' : n < 30 ? 'under_30' : n < 90 ? 'under_90' : '90_plus';
}

export function trackToday(event, props, capture = (e, p) => posthog.capture(e, p)) {
  const clean = sanitizeTodayProps(event, props);
  if (!clean) return null;
  try { capture(event, clean); } catch { /* analytics never blocks */ }
  return clean;
}
