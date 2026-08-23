/**
 * Shared helpers for the dedicated product detail route (/product/:id).
 * Lives outside App.jsx so any component with a product card can build a
 * real, shareable link to that product's page without importing App.jsx
 * itself (which would create an import cycle).
 */

export const PRODUCT_PATH_PREFIX = '/product/';

/** Build the URL for a given product id, e.g. productHref('p-always-infinity') -> '/product/p-always-infinity'. */
export function productHref(id) {
  return `${PRODUCT_PATH_PREFIX}${encodeURIComponent(id)}`;
}

/** Extract the :id segment from a pathname, or null if it isn't a product route. */
export function parseProductIdFromPath(pathname) {
  if (!pathname || !pathname.startsWith(PRODUCT_PATH_PREFIX)) return null;
  const raw = pathname.slice(PRODUCT_PATH_PREFIX.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * True when a click should be handled as an in-app navigation rather than
 * left to the browser's default <a> behavior — i.e. a plain left click with
 * no modifier keys held. Cmd/Ctrl/Shift/middle-click (button 1) should still
 * open the link normally (new tab/window), matching real link semantics.
 */
export function isPlainLeftClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
