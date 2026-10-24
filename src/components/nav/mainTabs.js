/**
 * The one main tab set for the app (bottom tab bar) and the website (top nav
 * and the phone tab bar): Today · Explore · Ask ayna · Community · You.
 * Founder decision, Oct 24 2026 (UX spec section 2). Same names and order on
 * web, iOS and Android. Keys stay stable for analytics and CSS.
 */
export const MAIN_TABS = [
  { key: 'today', label: 'Today', href: '/today' },
  { key: 'explore', label: 'Explore', href: '/explore' },
  { key: 'ask', label: 'Ask ayna', href: '/ask', center: true },
  { key: 'community', label: 'Community', href: '/community' },
  { key: 'profile', label: 'You', href: '/you' },
];

/** Explore's sections, one row of text tabs (UX spec 11; team direction 17, Oct 24). `href` is the website address. */
export const EXPLORE_SECTIONS = [
  { key: 'overview', label: 'For you', href: '/explore' },
  { key: 'topics', label: 'Categories', href: '/explore/topics' },
  { key: 'products', label: 'Products', href: '/explore/products' },
  { key: 'services', label: 'Services', href: '/explore/services' },
  { key: 'resources', label: 'Resources', href: '/explore/resources' },
];

/** You's sections, in order (UX spec section 19). `href` is the website address. */
export const YOU_SECTIONS = [
  { key: 'ecosystem', label: 'My ecosystem', href: '/you/ecosystem' },
  { key: 'saved', label: 'Saved', href: '/you/saved' },
  { key: 'health', label: 'My health', href: '/you/health' },
  { key: 'tracking', label: 'Tracking', href: '/you/tracking' },
  { key: 'connected', label: 'Connected data', href: '/you/connected' },
  { key: 'activity', label: 'My activity', href: '/you/activity' },
  { key: 'settings', label: 'Settings and privacy', href: '/you/settings' },
];

/**
 * Old addresses keep working (bookmarks, texts, emails, shared links). The
 * server answers these with a permanent redirect (vercel.json "redirects");
 * the client maps them too, for the app shell and local preview.
 */
export const LEGACY_REDIRECTS = {
  '/shop': '/explore/products',
  '/discovery': '/explore/products',
  '/library': '/explore/resources',
  '/ecosystem': '/you/ecosystem',
  '/my-ecosystem': '/you/ecosystem',
  '/health': '/today',
};

/**
 * Analytics: the old page or screen a new address stands for, so dashboards
 * built on /shop, /library, /ecosystem (web) keep counting. Sent as
 * `legacy_path` on every pageview (main.jsx before_send).
 */
export function legacyPathFor(pathname) {
  const p = String(pathname || '').replace(/\/+$/, '') || '/';
  if (p === '/explore/products') return '/shop';
  if (p === '/explore/resources') return '/library';
  if (p === '/you/ecosystem') return '/ecosystem';
  if (p === '/today') return '/health';
  return null;
}
