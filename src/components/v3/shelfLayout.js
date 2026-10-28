/* Her shelf layout (names, colours, order, moved products), kept in this
   browser per account. Shared by ShelfRows and the side rail's shelf list. */
// Kept per account (shelf names can be personal). The old browser-wide layout
// moves to the first account that opens its shelves, so nobody loses theirs.
const STORE = 'ayna.drawers.v1';
const keyFor = (userId) => (userId ? `${STORE}:${userId}` : STORE);
export function loadCustom(userId) {
  try {
    const own = window.localStorage.getItem(keyFor(userId));
    let raw = own;
    if (!own && userId) {
      raw = window.localStorage.getItem(STORE);
      if (raw) { window.localStorage.setItem(keyFor(userId), raw); window.localStorage.removeItem(STORE); }
    }
    const v = JSON.parse(raw || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}
export function saveCustom(userId, v) {
  try { window.localStorage.setItem(keyFor(userId), JSON.stringify(v)); } catch { /* private mode: this visit only */ }
}

/* The shelves in the order and with the names she sees (for the "Your shelves" list). */
export function shelfIndex(groups, userId = '') {
  const custom = loadCustom(userId);
  const keys = new Set(groups.map((g) => g.key));
  const moves = custom.moves || {};
  const counts = new Map(groups.map((g) => [g.key, 0]));
  groups.forEach((g) => g.products.forEach((p) => { const to = moves[p.id] && keys.has(moves[p.id]) ? moves[p.id] : g.key; counts.set(to, counts.get(to) + 1); }));
  const order = (custom.order || []).filter((k) => keys.has(k));
  const all = [...order, ...groups.map((g) => g.key).filter((k) => !order.includes(k))]
    .map((k) => { const g = groups.find((x) => x.key === k); return { key: k, label: (custom.names && custom.names[k]) || g.label, count: counts.get(k) }; })
    .filter((x) => x.count > 0);
  return [...all.filter((x) => x.count > 2), ...all.filter((x) => x.count <= 2)];
}
