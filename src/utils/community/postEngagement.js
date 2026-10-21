/**
 * Post views and the "found this helpful" list.
 * Database side: supabase/community_views_likes_2026-10-21.sql.
 *
 * Privacy: views are only ever counts. Nothing here can list who viewed a
 * post. Likers are masked by the database (anonymous votes, guests, people
 * without a profile, blocks); maskLiker repeats that rule in the browser so
 * an anonymous row can never render a name even if a field slipped through.
 *
 * Every function reports { available: false } before the migration runs, so
 * the screens hide counts instead of showing errors.
 */

import { isMissingSchemaError } from './communityStore.js';

const DEVICE_KEY = 'ayna_view_device_v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEVICE_RE = /^[A-Za-z0-9-]{16,64}$/;

let memoryDeviceId = null;
function randomId() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); } catch { /* old browser */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** A random id for this browser, used only to count a signed-out view once a day. */
export function getViewDeviceId(storage) {
  let store = storage;
  try { if (store === undefined) store = typeof localStorage !== 'undefined' ? localStorage : null; } catch { store = null; }
  try {
    const saved = store?.getItem(DEVICE_KEY);
    if (saved && DEVICE_RE.test(saved)) return saved;
  } catch { /* storage blocked */ }
  const id = memoryDeviceId && DEVICE_RE.test(memoryDeviceId) ? memoryDeviceId : randomId();
  memoryDeviceId = id;
  try { store?.setItem(DEVICE_KEY, id); } catch { /* private mode: keep it for this visit */ }
  return id;
}

export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);

const cleanIds = (ids, max) => [...new Set((ids || []).filter((id) => typeof id === 'string' && UUID_RE.test(id)))].slice(0, max);

// Views already sent this visit ("day:viewer:post"), so scrolling past the
// same post again doesn't call the database. The database dedupes too.
const sentViews = new Set();
export function resetSentViews() { sentViews.clear(); }

/**
 * Count one view. Signed in, the database uses her account (the device id is
 * ignored); signed out, it uses the device id. Returns { available, count }.
 */
export async function recordPostView(supabase, postId, { userId = null, deviceId = null, now = new Date() } = {}) {
  if (!supabase || !cleanIds([postId], 1).length) return { available: true, count: null, skipped: true };
  const device = userId ? null : deviceId || getViewDeviceId();
  const key = `${utcDay(now)}:${userId || device}:${postId}`;
  if (sentViews.has(key)) return { available: true, count: null, skipped: true };
  sentViews.add(key);
  const { data, error } = await supabase.rpc('community_record_post_view', { p_post_id: postId, p_device_key: device });
  if (error) {
    sentViews.delete(key);
    if (isMissingSchemaError(error)) return { available: false, count: null };
    throw error;
  }
  return { available: true, count: Number.isFinite(Number(data)) && data !== null ? Number(data) : null };
}

/** { available, counts: Map(postId -> { views, today }) }. today is null unless she wrote the post. */
export async function getPostViewCounts(supabase, postIds) {
  const ids = cleanIds(postIds, 100);
  if (!supabase || !ids.length) return { available: true, counts: new Map() };
  const { data, error } = await supabase.rpc('community_post_view_counts', { p_post_ids: ids });
  if (error) {
    if (isMissingSchemaError(error)) return { available: false, counts: new Map() };
    throw error;
  }
  const counts = new Map();
  for (const row of data || []) {
    if (!row?.post_id) continue;
    const today = row.views_today === null || row.views_today === undefined ? null : Math.max(0, Number(row.views_today) || 0);
    counts.set(row.post_id, { views: Math.max(0, Number(row.view_count) || 0), today });
  }
  return { available: true, counts };
}

/**
 * One liker row as the screens use it. Anonymous rows carry no identity at
 * all; her own row is labelled "You".
 */
export function maskLiker(row) {
  const me = Boolean(row?.is_me);
  const anonymous = !me && Boolean(row?.is_anonymous || !row?.user_id);
  if (anonymous) return { key: null, userId: null, username: null, name: 'Anonymous', avatarPath: null, isAnonymous: true, isMe: false };
  const name = me ? 'You' : String(row.display_name || '').trim() || (row.username ? `@${row.username}` : 'Community member');
  return {
    key: row.user_id,
    userId: row.user_id,
    username: row.username || null,
    name,
    avatarPath: row.avatar_url || null,
    isAnonymous: false,
    isMe: me,
  };
}

const withKeys = (rows) => rows.map((r, i) => ({ ...r, key: r.key || `anon-${i}` }));

/** Latest few likers for many posts: { available, likers: Map(postId -> { total, rows }) }. */
export async function getLikerPreviews(supabase, postIds, perPost = 5) {
  const ids = cleanIds(postIds, 60);
  if (!supabase || !ids.length) return { available: true, likers: new Map() };
  const { data, error } = await supabase.rpc('community_post_likers_preview', { p_post_ids: ids, p_per_post: perPost });
  if (error) {
    if (isMissingSchemaError(error)) return { available: false, likers: new Map() };
    throw error;
  }
  const grouped = new Map();
  for (const row of data || []) {
    if (!row?.post_id) continue;
    const entry = grouped.get(row.post_id) || { total: 0, rows: [] };
    entry.total = Math.max(entry.total, Number(row.total_count) || 0);
    entry.rows.push(maskLiker(row));
    grouped.set(row.post_id, entry);
  }
  for (const entry of grouped.values()) entry.rows = withKeys(entry.rows);
  return { available: true, likers: grouped };
}

/** Everyone who found a post helpful: { available, total, rows }. */
export async function listPostLikers(supabase, postId, { limit = 100, offset = 0 } = {}) {
  if (!supabase || !cleanIds([postId], 1).length) return { available: true, total: 0, rows: [] };
  const { data, error } = await supabase.rpc('community_post_likers', { p_post_id: postId, p_limit: limit, p_offset: offset });
  if (error) {
    if (isMissingSchemaError(error)) return { available: false, total: 0, rows: [] };
    throw error;
  }
  const list = data || [];
  return { available: true, total: list.length ? Number(list[0].total_count) || list.length : 0, rows: withKeys(list.map(maskLiker)) };
}

/** "1 view" / "128 views" / "1.2k views". */
export function viewsLabel(n) {
  const v = Math.max(0, Number(n) || 0);
  const short = v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(Math.floor(v / 100) / 10).toString()}k` : String(v);
  return `${short} ${v === 1 ? 'view' : 'views'}`;
}

/** "+N more" after the avatars, or '' when everyone is shown. */
export function moreLabel(total, shown) {
  const extra = Math.max(0, (Number(total) || 0) - (Number(shown) || 0));
  return extra ? `+${extra} more` : '';
}
