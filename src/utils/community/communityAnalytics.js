import posthog from 'posthog-js';

/**
 * Community events for PostHog. Only counts and on/off flags: never the post
 * or comment text, the author, or who reacted. Sent after the database write
 * succeeds, so a failed post is never counted. Analytics never blocks posting.
 */
export const COMMUNITY_EVENTS = new Set([
  'community_viewed',
  'community_post_created',
  'community_comment_submitted',
  'community_reaction_added',
  'community_post_saved',
  'community_followed',
]);

const SAFE_KEYS = new Set(['kind', 'isAnonymous', 'hasProduct', 'hasPhoto', 'topicCount', 'isReply', 'target', 'surface', 'tab']);

export function communityEventProps(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (!SAFE_KEYS.has(k)) continue;
    if (typeof v === 'boolean' || typeof v === 'number') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 40);
  }
  return out;
}

export function trackCommunity(event, props) {
  if (!COMMUNITY_EVENTS.has(event)) return;
  try { posthog.capture(event, communityEventProps(props)); } catch { /* analytics unavailable */ }
}
