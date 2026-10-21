// Community composer drafts.
//
// A draft lives in localStorage so an accidental close, a reload, an auth
// refresh that remounts the screen, or a failed post never loses what she
// wrote. Every storage call is wrapped: private mode, a full quota or blocked
// site data just means no draft, never a crash. The draft is cleared only
// after the post has saved.

const PREFIX = 'ayna_community_draft_v1';
// Photos are kept as data URLs only while they fit comfortably in storage.
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;

export function draftKey(surface, userId, scope = '') {
  return [PREFIX, surface || 'web', userId || 'guest', scope].filter(Boolean).join(':');
}

const text = (v) => (typeof v === 'string' ? v : '');

/** Only the fields a composer can restore; anything else is dropped. */
export function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const draft = {
    kind: text(raw.kind) || 'post',
    body: text(raw.body),
    productId: raw.productId == null || raw.productId === '' ? null : String(raw.productId),
    rating: Number.isFinite(Number(raw.rating)) && Number(raw.rating) > 0 ? Number(raw.rating) : null,
    anonymous: raw.anonymous === true,
    playlistTitle: text(raw.playlistTitle),
    friendIds: Array.isArray(raw.friendIds) ? raw.friendIds.filter((id) => typeof id === 'string') : [],
    photos: Array.isArray(raw.photos) ? raw.photos.filter((p) => p && typeof p.dataUrl === 'string' && p.dataUrl.startsWith('data:image/')).map((p) => ({ name: text(p.name) || 'photo', type: text(p.type) || 'image/jpeg', dataUrl: p.dataUrl })) : [],
    savedAt: Number(raw.savedAt) || 0,
  };
  return draft;
}

/** True when there is nothing worth keeping (or asking about). */
export function isDraftEmpty(draft) {
  if (!draft) return true;
  return !String(draft.body || '').trim()
    && !String(draft.playlistTitle || '').trim()
    && !draft.productId
    && !(draft.photos && draft.photos.length)
    && !(draft.friendIds && draft.friendIds.length);
}

function storage(store) {
  if (store) return store;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function loadDraft(key, store) {
  try {
    const raw = storage(store)?.getItem(key);
    if (!raw) return null;
    const draft = normalizeDraft(JSON.parse(raw));
    return isDraftEmpty(draft) ? null : draft;
  } catch { return null; }
}

/**
 * Saves the draft, or removes it when empty. If the photos don't fit, the
 * text, product and settings are still saved without them.
 */
export function saveDraft(key, draft, store) {
  const s = storage(store);
  if (!s) return false;
  const clean = normalizeDraft({ ...draft, savedAt: Date.now() });
  try {
    if (isDraftEmpty(clean)) { s.removeItem(key); return true; }
    const photoBytes = clean.photos.reduce((n, p) => n + p.dataUrl.length, 0);
    const full = photoBytes <= MAX_PHOTO_BYTES ? clean : { ...clean, photos: [] };
    try { s.setItem(key, JSON.stringify(full)); return true; }
    catch { s.setItem(key, JSON.stringify({ ...clean, photos: [] })); return true; }
  } catch { return false; }
}

export function clearDraft(key, store) {
  try { storage(store)?.removeItem(key); } catch { /* storage blocked */ }
}

/**
 * Runs the save step of a post. The draft is cleared only when `save`
 * resolves; on a failure it stays (in memory and in storage) and the error is
 * returned for an inline message. Work after the save (refreshing the feed,
 * loading the new post) must not run in here: a hiccup there is not a failed
 * post.
 */
export async function submitDraft({ key, save, store }) {
  try {
    const result = await save();
    clearDraft(key, store);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
}

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result || ''));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

/** Photos (File objects) to storable data URLs. Skips anything unreadable. */
export async function photosToDraft(files = []) {
  const out = [];
  for (const f of files) {
    try { out.push({ name: f.name, type: f.type, dataUrl: await readAsDataUrl(f) }); } catch { /* skip */ }
  }
  return out;
}

/** Stored photos back to File objects for upload. */
export function photosFromDraft(photos = []) {
  const out = [];
  for (const p of photos) {
    try {
      const [head, b64] = p.dataUrl.split(',');
      const type = (head.match(/data:([^;]+)/) || [])[1] || p.type || 'image/jpeg';
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      out.push(new File([bytes], p.name || 'photo', { type }));
    } catch { /* skip a damaged photo */ }
  }
  return out;
}
