/**
 * The one main tab set for the app (bottom tab bar) and the website (top nav
 * and the phone tab bar): Shop · Services · Home · Community · Library (Home in the
 * middle, founder Oct 26 19:49; "Today" renamed Home, founder Oct 26 21:45: "can today
 * just be home page and make it stand out"; key 'today' and /today stay)
 * (founder, Oct 26 2026: "CAN WE HAVE SHOP services community and library and
 * keep the ask ayna at the top"). Ask ayna is the button at the top of every
 * page; You is the round profile button beside it. Keys stay stable for
 * analytics and CSS: Shop keeps the 'explore' key (it is the old Explore page).
 * Shop is /explore (Products), Services /explore/services, Library
 * /explore/resources. The /ask and /you addresses still work.
 */
export const MAIN_TABS = [
  { key: 'explore', label: 'Shop', href: '/explore', icon: 'shop' },
  { key: 'services', label: 'Services', href: '/explore/services', icon: 'services' },
  { key: 'today', label: 'Home', href: '/today', icon: 'home', center: true },
  { key: 'community', label: 'Community', href: '/community' },
  { key: 'library', label: 'Library', href: '/explore/resources', icon: 'library' },
];

// Desktop reading order starts with Home; the mobile centre button keeps its place.
export const WEB_TOP_TABS = ['today', 'explore', 'services', 'library', 'community']
  .map((key) => MAIN_TABS.find((tab) => tab.key === key));

/**
 * The app's tab bar: the same five as the website. Home (was Today) is the dashboard
 * (AynaHomeScreen, the 'ayna' screen); its key stays 'home' so analytics and
 * CSS keep working. Home is the raised centre button (center: true). Shop is the 'explore' screen, Services the same screen
 * with Services picked, Library the 'library' screen. Ask ayna opens from the
 * header pill (and the suggestion pills under it); You from the round profile
 * button. The old `today`, `ask` and `ayna` screens still route (navTab.js aynaRoute).
 */
export const APP_TABS = [
  { key: 'explore', label: 'Shop', icon: 'shop' },
  { key: 'services', label: 'Services', icon: 'services' },
  { key: 'home', label: 'Home', icon: 'home', center: true },
  { key: 'community', label: 'Community' },
  { key: 'library', label: 'Library', icon: 'library' },
];

/**
 * The chat-first Home kept for the focus group (?home=chat): the first tab
 * is "ayna", the chat is home, and a small switch flips to Products and My
 * dashboard (founder, Oct 24 20:12). The chat is that tab, so no Ask tab.
 */
export const APP_TABS_CHAT_FIRST = APP_TABS
  .map((t) => (t.key === 'home' ? { ...t, label: 'ayna', icon: 'ask' } : t));
export const AYNA_HOME_VIEWS = [
  { key: 'chat', label: 'Chat' },
  { key: 'products', label: 'Products' },
  { key: 'dashboard', label: 'My dashboard' },
];

/**
 * Explore's five sections, the same on web and app (Explore audit, Oct 25:
 * "5 short tabs on both", pill tabs that never scroll on a phone): For you ·
 * Needs · Products · Services · Reads. Keys and addresses stay the same so
 * links, analytics and CSS keep working. `href` is the website address.
 */
export const EXPLORE_SECTIONS = [
  { key: 'overview', label: 'For you', href: '/explore' },
  { key: 'topics', label: 'Needs', href: '/explore/topics' },
  { key: 'products', label: 'Products', href: '/explore/products' },
  { key: 'services', label: 'Services', href: '/explore/services' },
  { key: 'resources', label: 'Reads', href: '/explore/resources' },
];

/** The app has the same five, Reads included (the Library's reads live there now). */
export const APP_EXPLORE_SECTIONS = EXPLORE_SECTIONS;

/** You's five sections, in order (You audit, Oct 25: one hub on web and app). `href` is the website address. */
export const YOU_SECTIONS = [
  { key: 'ecosystem', label: 'My ecosystem', href: '/you/ecosystem' },
  { key: 'saved', label: 'Saved', href: '/you/saved' },
  { key: 'health', label: 'My health', href: '/you/health' },
  { key: 'activity', label: 'Activity', href: '/you/activity' },
  { key: 'settings', label: 'Settings & privacy', href: '/you/settings' },
];

/** Old You section addresses (before the You audit merged 8 tabs into 5): Tracking and Connected data are inside My health now. */
export const YOU_SECTION_ALIASES = { tracking: 'health', connected: 'health' };

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
