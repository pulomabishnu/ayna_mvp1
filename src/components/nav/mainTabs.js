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

/**
 * The app's tab bar (founder, Oct 24 20:12, "App home = ayna chat"): Explore,
 * Library, ayna (centre, the chat as home), Community, You. The website keeps
 * MAIN_TABS for now. `today` and `ask` are not tabs in the app any more: they
 * open the ayna tab (My dashboard and Chat).
 */
export const APP_TABS = [
  { key: 'explore', label: 'Explore' },
  { key: 'library', label: 'Library' },
  { key: 'ayna', label: 'ayna', center: true },
  { key: 'community', label: 'Community' },
  { key: 'profile', label: 'You' },
];

/** The small switch at the top of the app's ayna tab. Chat is the home. */
export const AYNA_HOME_VIEWS = [
  { key: 'chat', label: 'Chat' },
  { key: 'products', label: 'Products' },
  { key: 'dashboard', label: 'My dashboard' },
];

/** Explore's sections, one row of text tabs (UX spec 11; team direction 17, Oct 24). `href` is the website address. */
export const EXPLORE_SECTIONS = [
  { key: 'overview', label: 'For you', href: '/explore' },
  { key: 'topics', label: 'Categories', href: '/explore/topics' },
  { key: 'products', label: 'Products', href: '/explore/products' },
  { key: 'services', label: 'Services', href: '/explore/services' },
  { key: 'resources', label: 'Resources', href: '/explore/resources' },
];

/** In the app the reads have their own tab (Library), so Explore has no Resources section. */
export const APP_EXPLORE_SECTIONS = EXPLORE_SECTIONS.filter((s) => s.key !== 'resources');

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
