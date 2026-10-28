/**
 * Small per-owner localStorage store shared by the daily log (dailyLog.js)
 * and tries (outcomes.js).
 *
 * Shape under one key:
 *   { v: 1, owner: 'device' | <user id>, buckets: { [owner]: { items: { [id]: item }, dirty: [id] } }, meta: {} }
 *
 * - Signed out, everything lives in the 'device' bucket, so it works offline.
 * - When she signs in, the device bucket is folded into her own bucket and
 *   marked dirty so it uploads; the device bucket is then emptied. Another
 *   person signing in on the same phone never sees her bucket.
 * - `dirty` lists ids changed since the last successful upload.
 *
 * Every read and write is wrapped: blocked storage (private mode) still
 * works for the session, it just isn't kept.
 */

export const DEVICE_OWNER = 'device';

// Fallback when storage is missing or throws (private mode): kept for this
// session only, per storage object so two stores never share it.
const memories = new WeakMap();
const noStorage = {};
function memoryFor(storage) {
  const k = storage && typeof storage === 'object' ? storage : noStorage;
  if (!memories.has(k)) memories.set(k, new Map());
  return memories.get(k);
}

function emptyState() {
  return { v: 1, owner: DEVICE_OWNER, buckets: {}, meta: {} };
}

export function loadState(key, storage = globalThis.localStorage) {
  let raw = null;
  let blocked = !storage;
  try { raw = storage?.getItem(key) ?? null; } catch { blocked = true; }
  const memory = memoryFor(storage);
  if (blocked) return memory.has(key) ? structuredCloneSafe(memory.get(key)) : emptyState();
  if (raw == null) return emptyState();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyState();
    return {
      v: 1,
      owner: typeof parsed.owner === 'string' && parsed.owner ? parsed.owner : DEVICE_OWNER,
      buckets: parsed.buckets && typeof parsed.buckets === 'object' && !Array.isArray(parsed.buckets) ? parsed.buckets : {},
      meta: parsed.meta && typeof parsed.meta === 'object' && !Array.isArray(parsed.meta) ? parsed.meta : {},
    };
  } catch {
    return emptyState();
  }
}

export function saveState(key, state, storage = globalThis.localStorage) {
  memoryFor(storage).set(key, structuredCloneSafe(state));
  try { storage?.setItem(key, JSON.stringify(state)); return true; } catch { return false; }
}

function structuredCloneSafe(v) {
  return JSON.parse(JSON.stringify(v));
}

export function bucketOf(state, owner = state.owner) {
  const b = state.buckets[owner];
  return {
    items: b?.items && typeof b.items === 'object' && !Array.isArray(b.items) ? b.items : {},
    dirty: Array.isArray(b?.dirty) ? b.dirty.filter((id) => typeof id === 'string') : [],
  };
}

export function putBucket(state, bucket, owner = state.owner) {
  return { ...state, buckets: { ...state.buckets, [owner]: { items: bucket.items, dirty: [...new Set(bucket.dirty)] } } };
}

/**
 * Switch the active owner. Signing in folds signed-out (device) items into
 * her bucket with `merge(userItems, deviceItems)` and marks them to upload.
 * Signing out switches to the (now empty) device bucket.
 */
export function switchOwner(state, userId, merge) {
  const next = userId ? String(userId) : DEVICE_OWNER;
  if (next === DEVICE_OWNER) return { ...state, owner: DEVICE_OWNER };
  const device = bucketOf(state, DEVICE_OWNER);
  let out = { ...state, owner: next };
  const deviceIds = Object.keys(device.items);
  if (deviceIds.length) {
    const mine = bucketOf(out, next);
    out = putBucket(out, { items: merge(mine.items, device.items), dirty: [...mine.dirty, ...deviceIds] }, next);
    out = putBucket(out, { items: {}, dirty: [] }, DEVICE_OWNER);
  }
  return out;
}

/** Keep the newest `max` ids (sorted by `sortKey`), dropping older ones. */
export function trimItems(items, max, sortKey = (id) => id) {
  const ids = Object.keys(items);
  if (ids.length <= max) return items;
  const keep = ids.sort((a, b) => String(sortKey(a)).localeCompare(String(sortKey(b)))).slice(-max);
  return Object.fromEntries(keep.map((id) => [id, items[id]]));
}
