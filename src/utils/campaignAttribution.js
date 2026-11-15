/**
 * First-touch campaign attribution (founder decision, Ameera, Nov 15: "Track the five conversion stages
 * with consistent attribution"). PostHog saw 150 TikTok pageviews in 30 days but none of the later
 * steps carried the source, because utm_* only rides on the landing pageview. This keeps the first
 * visit's source and medium (and campaign) on this device and registers them on every later event,
 * so landing -> sign-up -> quiz -> recommendations -> product click can be split by source.
 * Nothing health-related is stored. Opted-out visitors send nothing (PostHog's own opt-out).
 */
const KEY = 'ayna_first_touch_v1';
const SOCIAL = [['tiktok', 'tiktok'], ['instagram', 'instagram'], ['facebook', 'facebook'], ['t.co', 'twitter'], ['twitter', 'twitter'], ['reddit', 'reddit'], ['pinterest', 'pinterest'], ['youtube', 'youtube'], ['linkedin', 'linkedin']];
const clean = (v) => String(v || '').trim().toLowerCase().slice(0, 60);

export function firstTouchFrom({ search = '', referrer = '' } = {}) {
  let p;
  try { p = new URLSearchParams(search); } catch { p = new URLSearchParams(); }
  const source = clean(p.get('utm_source'));
  if (source) return { first_utm_source: source, first_utm_medium: clean(p.get('utm_medium')), first_utm_campaign: clean(p.get('utm_campaign')) };
  let host = '';
  try { host = referrer ? new URL(referrer).hostname.toLowerCase() : ''; } catch { host = ''; }
  const social = SOCIAL.find(([needle]) => host.includes(needle));
  return social ? { first_utm_source: social[1], first_utm_medium: 'referral', first_utm_campaign: '' } : null;
}

/** Read (or set once) this device's first touch. Returns {} when there is none. */
export function firstTouch(storage = globalThis.localStorage, loc = globalThis.location, doc = globalThis.document) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || 'null');
    if (saved && saved.first_utm_source) return saved;
    const now = firstTouchFrom({ search: loc?.search || '', referrer: doc?.referrer || '' });
    if (now) { storage?.setItem(KEY, JSON.stringify(now)); return now; }
  } catch { /* storage blocked */ }
  return {};
}
