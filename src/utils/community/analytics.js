import posthog from 'posthog-js';

/**
 * Community analytics. Property values are restricted to an allowlist of
 * structural, non-health fields — never topics (a topic like "PCOS" is health
 * information), never post text, never product ids or match percentages.
 * Consent/opt-out is enforced globally in main.jsx.
 */
const ALLOWED_PROPS = new Set([
  'filter', 'section', 'kind', 'source', 'has_product', 'has_photo',
  'is_anonymous', 'item_count', 'recipient_count', 'result_count', 'sort',
]);

export function sanitizeCommunityProps(props = {}) {
  const out = {};
  for (const [key, value] of Object.entries(props || {})) {
    if (!ALLOWED_PROPS.has(key)) continue;
    if (typeof value === 'boolean' || typeof value === 'number') out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, 40);
  }
  return out;
}

export function trackCommunity(event, props) {
  try {
    posthog.capture(event, sanitizeCommunityProps(props));
  } catch {
    // Analytics must never break the feature.
  }
}
