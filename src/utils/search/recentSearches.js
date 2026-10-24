/**
 * Recent Explore searches, on this device only (a convenience, like the read
 * progress). Never sent anywhere. Storage can be blocked: then there are none.
 */
const KEY = 'ayna_explore_recent_v1';
const MAX = 6;

export function readRecentSearches() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string' && x.trim()).slice(0, MAX) : [];
  } catch { return []; }
}

export function rememberSearch(query) {
  const q = String(query || '').trim().slice(0, 80);
  if (q.length < 2) return readRecentSearches();
  const next = [q, ...readRecentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  return next;
}

export function clearRecentSearches() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  return [];
}
