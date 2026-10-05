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

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export async function reencodeImage(file, maxEdge = MAX_EDGE) {
  if (!file || !/^image\//.test(file.type)) throw new Error('Please choose an image.');
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is too large.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error("Couldn't process that image.");
  return blob;
}

/** folder: 'posts' | 'covers' | 'avatars' */
export async function uploadCommunityImage(supabase, file, { folder = 'posts', userId = null } = {}) {
  const blob = await reencodeImage(file, folder === 'avatars' ? 512 : MAX_EDGE);
  const path = folder === 'avatars' ? `avatars/${userId}/${randomId()}.jpg` : `${folder}/${randomId()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error("Photo upload isn't available right now.");
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}
