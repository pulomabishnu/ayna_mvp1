/**
 * Photo uploads for posts, reviews, avatars and playlist covers.
 *
 * Every image is decoded and re-encoded through a canvas before it leaves the
 * device. That strips EXIF metadata — including GPS location, which phones
 * embed by default — and caps the dimensions/size.
 *
 * Post photos go to posts/<random uuid>.jpg, never under a user-id folder, so
 * an anonymous post's photo URL can't identify its author. See
 * supabase/community_storage.sql.
 */
const BUCKET = 'community-media';
const MAX_EDGE = 1600;
export const MAX_POST_PHOTOS = 4;

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  // RFC 4122 v4 fallback (paths must be uuid-shaped for the storage policy).
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Public URL for a stored path (or pass-through for a legacy full URL). */
export function publicMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl) || pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${pathOrUrl.split('/').map(encodeURIComponent).join('/')}`;
}

export function checkImageFile(file) {
  if (!file || !/^image\/(jpeg|png|webp|heic|heif|gif)$/i.test(file.type)) throw new Error('Please choose a photo (JPEG, PNG or WebP).');
  if (file.size > 20 * 1024 * 1024) throw new Error('That photo is too large (max 20 MB).');
}

/**
 * Decode → optional square crop → resize → JPEG.
 * crop: { x, y, size } in source pixels (square), for avatars.
 */
export async function reencodeImage(file, maxEdge = MAX_EDGE, crop = null) {
  checkImageFile(file);
  const bitmap = await createImageBitmap(file);
  const sx = crop ? crop.x : 0;
  const sy = crop ? crop.y : 0;
  const sw = crop ? crop.size : bitmap.width;
  const sh = crop ? crop.size : bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  if (!blob) throw new Error("Couldn't process that photo.");
  return { blob, width: w, height: h };
}

/**
 * folder: 'posts' | 'covers' | 'avatars'. Returns { path, url, width, height }.
 * Store `path` (posts → community_post_media.storage_path, avatars →
 * community_profiles.avatar_url); `url` is for immediate display.
 */
export async function uploadCommunityImage(supabase, file, { folder = 'posts', userId = null, crop = null } = {}) {
  const { blob, width, height } = await reencodeImage(file, folder === 'avatars' ? 512 : MAX_EDGE, crop);
  const path = folder === 'avatars' ? `avatars/${userId}/${randomId()}.jpg` : `${folder}/${randomId()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error("Photo upload isn't available right now.");
  return { path, url: publicMediaUrl(path), width, height };
}

export async function deleteCommunityImage(supabase, path) {
  if (!path || /^https?:/.test(path)) return;
  try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* best effort; RLS limits this to your own files */ }
}
