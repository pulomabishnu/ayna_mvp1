// What she looked at and searched for recently, kept only in this browser
// (never sent anywhere). Used to rank the Community "For you" feed.
const KEY = 'ayna_recent_activity_v1';
const MAX = 30;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { products: Array.isArray(v?.products) ? v.products : [], searches: Array.isArray(v?.searches) ? v.searches : [] };
  } catch { return { products: [], searches: [] }; }
}
function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } }

export function recordProductView(productId) {
  if (!productId) return;
  const v = read();
  v.products = [String(productId), ...v.products.filter((id) => id !== String(productId))].slice(0, MAX);
  write(v);
}

export function recordSearch(term) {
  const t = String(term || '').trim().toLowerCase().slice(0, 60);
  if (t.length < 3) return;
  const v = read();
  v.searches = [t, ...v.searches.filter((s) => s !== t)].slice(0, MAX);
  write(v);
}

export function getRecentActivity() { return read(); }
