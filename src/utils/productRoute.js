/**
 * Shared helpers for dedicated product detail routes.
 *
 * New links use a human-readable product-name slug:
 *   /product/lola-organic-cotton-pads
 *
 * Historical ID links such as /product/p-lola-pad are intentionally still
 * accepted forever so bookmarks and previously shared links do not break.
 */

export const PRODUCT_PATH_PREFIX = '/product/';

/** Convert a product name into a stable, URL-safe public slug. */
export function productSlug(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 100);
}

/**
 * Route key used for a product.
 *
 * Passing a product object creates the new readable URL.
 * Passing a string preserves historical ID-based URLs.
 */
export function productRouteKey(productOrId) {
  if (productOrId && typeof productOrId === 'object') {
    const nameSlug = productSlug(productOrId.name);
    const brandSlug = productSlug(productOrId.brand);

    if (nameSlug) {
      if (!brandSlug || nameSlug === brandSlug || nameSlug.startsWith(`${brandSlug}-`)) {
        return nameSlug;
      }

      return `${brandSlug}-${nameSlug}`.slice(0, 120);
    }

    return String(productOrId.id || '').trim();
  }

  return String(productOrId || '').trim();
}

/** Build the product path from either a product object or historical ID. */
export function productHref(productOrId) {
  const key = productRouteKey(productOrId);
  return key ? `${PRODUCT_PATH_PREFIX}${encodeURIComponent(key)}` : '/';
}

/**
 * Extract the route key from /product/:key.
 *
 * Kept under the historical function name because App.jsx already imports it.
 * The returned value may now be either an old product ID or a public name slug.
 */
export function parseProductIdFromPath(pathname) {
  if (!pathname || !pathname.startsWith(PRODUCT_PATH_PREFIX)) return null;

  const raw = pathname.slice(PRODUCT_PATH_PREFIX.length).split('/')[0];
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** True for a normal unmodified left click. */
export function isPlainLeftClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
