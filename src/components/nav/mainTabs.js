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
 * The app's tab bar (all-pages build brief, Oct 25 23:03, supersedes the
 * Oct 24 22:12 four tabs): the same five as the website, Today · Explore ·
 * Ask ayna · Community · You. Today is the dashboard (AynaHomeScreen, the
 * 'ayna' screen); its key stays 'home' so analytics and CSS keep working.
 * Ask ayna opens the full chat as a tab screen (the 'ayna' screen's 'chat'
 * view). The Library is not a tab: it lives inside Explore (Reads) as a
 * pushed screen with Back. The old `today`, `ask` and `ayna` screens still
 * route (navTab.js aynaRoute).
 */
export const APP_TABS = [
  { key: 'home', label: 'Today', icon: 'today' },
  { key: 'explore', label: 'Explore' },
  { key: 'ask', label: 'Ask ayna', center: true, icon: 'ask' },
  { key: 'community', label: 'Community' },
  { key: 'profile', label: 'You' },
];

/**
 * The chat-first Home kept for the focus group (?home=chat): the first tab
 * is "ayna", the chat is home, and a small switch flips to Products and My
 * dashboard (founder, Oct 24 20:12). The chat is that tab, so no Ask tab.
 */
export const APP_TABS_CHAT_FIRST = APP_TABS
  .filter((t) => t.key !== 'ask')
  .map((t) => (t.key === 'home' ? { ...t, label: 'ayna', icon: 'ask' } : t));
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

// Explore "For you" with quiz answers but nothing that fits yet (QA M4): the
// empty state, on the website and the app. Never the "create your profile" invite.
export const FOR_YOU_EMPTY = 'Nothing in this section fits your answers yet';
