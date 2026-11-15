/**
 * Photo symptom log (UCLA focus group 10/1: "photo symptom tracking (skin, hair)").
 * Photos stay on this device only, in IndexedDB. Nothing here uploads, syncs or sends a photo
 * anywhere, and nothing goes to analytics. Each photo is { id, day, area, blob, at }.
 */
const DB = 'ayna_photo_log';
const STORE = 'photos';
export const PHOTO_AREAS = ['Skin', 'Hair', 'Other'];
export const MAX_PHOTOS_PER_DAY = 4;

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no_indexeddb')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { const s = req.result.createObjectStore(STORE, { keyPath: 'id' }); s.createIndex('day', 'day'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
    t.onerror = () => { db.close(); reject(t.error); };
  }));
}

/** Photos for one day, oldest first. [] when storage is unavailable. */
export async function photosForDay(day) {
  try {
    const rows = await tx('readonly', (s) => s.index('day').getAll(day));
    return (rows || []).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  } catch { return []; }
}

export async function addPhoto(day, file, area = 'Skin', now = new Date()) {
  if (!file || !/^image\//.test(file.type || '')) throw new Error('Pick a photo (JPG, PNG or HEIC).');
  if (file.size > 15 * 1024 * 1024) throw new Error('That photo is over 15 MB.');
  const have = await photosForDay(day);
  if (have.length >= MAX_PHOTOS_PER_DAY) throw new Error(`Up to ${MAX_PHOTOS_PER_DAY} photos a day.`);
  const row = { id: `ph${now.getTime().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, day, area: PHOTO_AREAS.includes(area) ? area : 'Other', blob: file, at: now.toISOString() };
  await tx('readwrite', (s) => s.put(row));
  return row;
}

export async function removePhoto(id) {
  await tx('readwrite', (s) => s.delete(id));
}

/** Every photo, for "Delete all my photos" in settings. */
export async function deleteAllPhotos() {
  try { await tx('readwrite', (s) => s.clear()); } catch { /* nothing stored */ }
}
