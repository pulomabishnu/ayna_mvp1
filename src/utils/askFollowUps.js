import posthog from 'posthog-js';
import { ensureAnalyticsContext } from './analyticsEvents.js';

/**
 * Client half of Ask ayna follow-ups (server half: api/_askFollowUps.js).
 * The server has already whitelisted what the model proposed; here we only
 * keep what this screen can actually open, and always end with "Ask
 * something else", which puts her back in the input.
 */

export const ASK_ELSE = { type: 'ask_else', label: 'Ask something else' };
const KNOWN = new Set(['open_product', 'browse', 'ask', 'open_dashboard', 'open_library', 'open_guide']);

// "SootheHer's Elaris Pod" -> "Elaris Pod", so a chip reads "Open Elaris Pod".
function shortName(p) {
  const name = String(p.name).trim();
  const brand = String(p.brand || '').trim();
  if (!brand) return name;
  const rest = name.replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:['’]s)?\\s+`, 'i'), '');
  return rest.length >= 3 ? rest : name;
}

/** Request fields that let the server propose ids it can check. */
export function followUpRequestFields({ products = [], reads = [], hasHealthData = false } = {}) {
  const list = (Array.isArray(products) ? products : Object.values(products || {}))
    .filter((p) => p && p.id != null && p.name)
    .slice(0, 30)
    .map((p) => ({ id: String(p.id), name: shortName(p).slice(0, 60), ...(p.brand ? { brand: String(p.brand).slice(0, 40) } : {}) }));
  const readList = (Array.isArray(reads) ? reads : [])
    .filter((r) => r && r.id && r.title)
    .slice(0, 12)
    .map((r) => ({ id: String(r.id), title: String(r.title).slice(0, 120) }));
  return { ecosystemProducts: list, reads: readList, hasHealthData: !!hasHealthData };
}

/**
 * Server follow-ups this screen can act on, plus the closing "Ask something
 * else". canOpen(f) lets a screen drop a product or read it can't resolve.
 */
export function chipsFor(followUps, { canOpen = () => true, hasDashboard = true, hasGuide = false } = {}) {
  const out = (Array.isArray(followUps) ? followUps : [])
    .filter((f) => f && KNOWN.has(f.type) && typeof f.label === 'string' && f.label.trim())
    .filter((f) => (f.type === 'open_dashboard' ? hasDashboard : true))
    .filter((f) => (f.type === 'open_guide' ? hasGuide : true))
    .filter((f) => (f.type === 'open_product' || f.type === 'open_library' ? canOpen(f) : true))
    .slice(0, 4);
  return [...out, ASK_ELSE];
}

/**
 * Record what kinds of follow-up the answer offered. No label/question/body is
 * sent because those can contain health detail.
 */
export function trackFollowUpsRendered(followUps, { surface = 'ask' } = {}) {
  ensureAnalyticsContext();
  const safe = (Array.isArray(followUps) ? followUps : [])
    .filter((f) => f && (KNOWN.has(f.type) || f.type === ASK_ELSE.type))
    .slice(0, 5);
  if (!safe.length) return;
  try {
    posthog.capture('ask_followups_rendered', {
      surface,
      followup_count: safe.length,
      has_product: safe.some((f) => f.type === 'open_product'),
      has_browse: safe.some((f) => f.type === 'browse'),
      has_ask: safe.some((f) => f.type === 'ask' || f.type === 'ask_else'),
      has_dashboard: safe.some((f) => f.type === 'open_dashboard'),
      has_read: safe.some((f) => f.type === 'open_library'),
      has_guide: safe.some((f) => f.type === 'open_guide'),
    });
  } catch { /* analytics off */ }
}

/** Type only: never the label or question, which can carry health detail. */
export function trackFollowUp(type, { surface = 'ask' } = {}) {
  ensureAnalyticsContext();
  if (!(KNOWN.has(type) || type === ASK_ELSE.type)) return;
  try { posthog.capture('ask_followup_clicked', { type, surface }); } catch { /* analytics off */ }
}
