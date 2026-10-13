/**
 * Community posts reference products by id (community_posts.product_id,
 * tagged product ids, playlist items). A member can also tag a product that
 * isn't in the ayna catalog, the same "+ Add '<name>'" idea as the quiz's
 * product search. Such a product gets a reversible id made only of
 * [A-Za-z0-9_-] (so it survives communityStore's id sanitising):
 *   "Diva Cup" -> "custom-Diva_20Cup"
 * Every "_" in the encoded part starts a byte escape, so decoding is exact.
 */
export const CUSTOM_PRODUCT_PREFIX = 'custom-';
const MAX_NAME = 80;

export function customProductId(name) {
  const clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
  if (!clean) return null;
  const encoded = encodeURIComponent(clean)
    .replace(/[!'()*._~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%/g, '_');
  return `${CUSTOM_PRODUCT_PREFIX}${encoded}`;
}

export function isCustomProductId(id) {
  return typeof id === 'string' && id.startsWith(CUSTOM_PRODUCT_PREFIX) && id.length > CUSTOM_PRODUCT_PREFIX.length;
}

export function customProductName(id) {
  if (!isCustomProductId(id)) return '';
  try {
    return decodeURIComponent(id.slice(CUSTOM_PRODUCT_PREFIX.length).replace(/_/g, '%'));
  } catch {
    return '';
  }
}
