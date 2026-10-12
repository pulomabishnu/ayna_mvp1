// Which experience a web URL gets.
//
// The website now runs the app's own screens (MobileApp in "web" mode) so
// every feature and every quiz question is identical across app and site.
// A short list of standalone pages (legal, about, auth handoffs, and a few
// website-only tools) still render through the older desktop shell, App.jsx.

export const LEGACY_WEB_PATHS = [
  '/privacy-policy', '/terms-of-use', '/how-we-make-money', '/how-it-works', '/about', '/contact',
  '/auth/callback', '/auth/confirm', '/confirmed',
  '/startups', '/screenings', '/recalls', '/comparison', '/omitted', '/tracked',
  '/appointment-prep', '/text-ayna', '/campus-resources',
];

export function isLegacyWebPath(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/';
  return LEGACY_WEB_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

// App screen <-> URL. The first path listed for a screen is the one we write.
const SCREEN_PATHS = {
  landing: ['/'],
  browse: ['/shop', '/discovery', '/browse'],
  quiz: ['/quiz'],
  eco: ['/ecosystem'],
  ecointro: ['/ecosystem'],
  library: ['/library'],
  community: ['/community'],
  saved: ['/saved'],
  checkin: ['/check-in'],
};

const PRODUCT_PREFIX = '/product/';
const READ_PREFIX = '/library/';

export function pathForWebState(screen, overlay) {
  if (overlay?.type === 'product' && overlay.item?.id) return `${PRODUCT_PREFIX}${encodeURIComponent(overlay.item.id)}`;
  if (overlay?.type === 'article' && overlay.item?.id) return `${READ_PREFIX}${encodeURIComponent(overlay.item.id)}`;
  if (overlay?.type === 'profile' || overlay?.type === 'profile-auth') return '/you';
  return (SCREEN_PATHS[screen] || ['/'])[0];
}

// -> { screen, productId, articleId, profile }
export function webStateFromPath(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith(PRODUCT_PREFIX)) return { screen: 'browse', productId: decodeURIComponent(path.slice(PRODUCT_PREFIX.length)) };
  if (path.startsWith(READ_PREFIX)) return { screen: 'library', articleId: decodeURIComponent(path.slice(READ_PREFIX.length)) };
  if (path === '/you' || path === '/profile') return { screen: 'landing', profile: true };
  for (const [screen, paths] of Object.entries(SCREEN_PATHS)) {
    if (screen === 'ecointro') continue;
    if (paths.includes(path)) return { screen };
  }
  return { screen: 'landing' };
}
