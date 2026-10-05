/**
 * Community sub-routes. App.jsx treats every /community… path as the single
 * 'community' view; Community.jsx reads the rest of the path itself so the
 * static VIEW_TO_PATH map in App.jsx stays unchanged for every other route.
 */
export const COMMUNITY_BASE = '/community';

export const FEED_TABS = ['for-you', 'following', 'questions', 'reviews', 'playlists'];

export function isCommunityPath(pathname) {
  const p = String(pathname || '');
  return p === COMMUNITY_BASE || p.startsWith(`${COMMUNITY_BASE}/`);
}

export function parseCommunityRoute(pathname, search = '') {
  const rest = String(pathname || '').replace(/\/+$/, '').slice(COMMUNITY_BASE.length).split('/').filter(Boolean);
  const params = new URLSearchParams(search || '');
  const [section, id] = rest;
  if (section === 'post' && id) return { name: 'post', id };
  if (section === 'u' && id) return { name: 'profile', username: decodeURIComponent(id).toLowerCase() };
  if (section === 'playlist' && id) return { name: 'playlist', id };
  if (section === 'rec' && id) return { name: 'recommendation', id };
  if (section === 'notifications') return { name: 'notifications' };
  if (section === 'search') return { name: 'search', q: params.get('q') || '' };
  if (section === 'me') return { name: 'me' };
  const tab = FEED_TABS.includes(params.get('tab')) ? params.get('tab') : 'for-you';
  const product = params.get('product');
  return product ? { name: 'feed', tab, product } : { name: 'feed', tab };
}

export function communityHref(route) {
  switch (route?.name) {
    case 'post': return `${COMMUNITY_BASE}/post/${route.id}`;
    case 'profile': return `${COMMUNITY_BASE}/u/${encodeURIComponent(route.username)}`;
    case 'playlist': return `${COMMUNITY_BASE}/playlist/${route.id}`;
    case 'recommendation': return `${COMMUNITY_BASE}/rec/${route.id}`;
    case 'notifications': return `${COMMUNITY_BASE}/notifications`;
    case 'search': return `${COMMUNITY_BASE}/search${route.q ? `?q=${encodeURIComponent(route.q)}` : ''}`;
    case 'me': return `${COMMUNITY_BASE}/me`;
    case 'feed':
    default:
    {
      const params = new URLSearchParams();
      if (route?.tab && route.tab !== 'for-you') params.set('tab', route.tab);
      if (route?.product) params.set('product', route.product);
      const qs = params.toString();
      return qs ? `${COMMUNITY_BASE}?${qs}` : COMMUNITY_BASE;
    }
  }
}
