// The bell at the top of the app and the website (founder, Nov 10: "a bell
// with notifs, like how the ecosystem has updated"). One list of what changed
// for her, built only from things ayna already knows. Nothing is invented: an
// item shows only when its source has something.
//
//   For you     answers that are old enough to check ("Is this still right?"),
//               and this month's check-in while it isn't done
//   Community   likes, replies and follows (community_notifications)
//   From ayna   the latest ayna news post
//
// The dot on the bell lights for any item she hasn't seen. Opening the list
// marks them seen (a local list of item keys, and read_at for community rows).

export const SEEN_KEY = 'ayna_updates_seen_v1';
const MAX_SEEN = 200;

export function readSeen(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(SEEN_KEY) || '[]'); return new Set(Array.isArray(v) ? v : []); } catch { return new Set(); }
}

export function writeSeen(keys, storage = globalThis.localStorage) {
  try { storage?.setItem(SEEN_KEY, JSON.stringify([...keys].slice(-MAX_SEEN))); } catch { /* private mode */ }
}

const typeText = {
  like: 'Someone liked your post.',
  post_like: 'Someone liked your post.',
  comment: 'Someone replied to your post.',
  reply: 'Someone replied to you.',
  follow: 'Someone followed you.',
  friend_request: 'You have a friend request.',
  friend_accept: 'Your friend request was accepted.',
  helpful: 'Someone found your answer helpful.',
  recommendation: 'A friend recommended a product to you.',
};

/** The words for a community notification row. */
export function communityText(row) {
  const t = String(row?.message || row?.body || '').trim();
  if (t) return t;
  const type = String(row?.type || '');
  return typeText[type] || (type ? `${type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}.` : 'New activity on your posts.');
}

/**
 * @param {{ facts?: object[], checkinDue?: boolean, checkinMonth?: string, community?: object[], news?: {title:string, body?:string}|null }} src
 * @returns {{ key: string, group: 'you'|'community'|'ayna', title: string, body?: string, when?: string, action?: string, go?: string, unread?: boolean }[]}
 */
export function buildUpdates({ facts = [], checkinDue = false, checkinMonth = '', community = [], news = null } = {}) {
  const out = [];
  for (const f of facts) {
    out.push({ key: `fact:${f.key}`, group: 'you', title: f.title, body: [f.said, f.when ? `You told us ${f.when}.` : ''].filter(Boolean).join(' '), action: 'Check it', go: 'home' });
  }
  if (checkinDue) {
    out.push({ key: `checkin:${checkinMonth}`, group: 'you', title: "This month's check-in", body: 'A few quick questions so your picks keep up with you.', action: 'Start', go: 'checkin' });
  }
  for (const row of community) {
    if (!row?.id) continue;
    out.push({ key: `c:${row.id}`, group: 'community', title: communityText(row), whenIso: row.created_at || null, go: 'community', unread: !row.read_at });
  }
  if (news?.title) {
    out.push({ key: `news:${news.title}`, group: 'ayna', title: news.title, body: news.body || '', action: 'Read', go: 'news' });
  }
  return out;
}

/** True when the bell should show its dot. */
export function hasUnseen(items, seen, unreadCommunity = 0) {
  if (unreadCommunity > 0) return true;
  // A reply counts until she has opened the list once (read_at is set on the server then).
  return items.some((i) => (i.group === 'community' ? i.unread && !seen.has(i.key) : !seen.has(i.key)));
}

export const GROUP_LABEL = { you: 'For you', community: 'Community', ayna: 'From ayna' };
