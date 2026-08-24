import { useState, useRef, useEffect } from 'react';
import { ALL_PRODUCTS, getProductById } from '../data/products';
import { resolveProductImage, isPlaceholderProductImage, safeProductImageSrc } from '../utils/resolveProductImage';
import { handleImageErrorWithRetry } from '../utils/imageRetry';

function ImageOffIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3.5 3.5l17 17M4 20l4.2-4.2M20 15V6.5A2.5 2.5 0 0 0 17.5 4H9.2M4 8.5v10A2.5 2.5 0 0 0 6.5 21H16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </svg>
  );
}

/**
 * The honest "we couldn't find a real photo" state — replaces the old bare
 * initial-letter avatar every call site used to hand-roll, which read as
 * unstyled/broken rather than a deliberate "not found" message. `compact`
 * drops the text label for tiles too small to fit it (~56px and under);
 * the icon + title/aria-label tooltip still communicate the same thing
 * there. Always sized to fill its container — callers control the
 * container's own dimensions the same way they did for the old letterNode.
 */
export function ProductImageFallback({ compact = false, style, className }) {
  return (
    <div
      role="img"
      aria-label="Product image not found"
      title="Product image not found"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        color: 'var(--color-text-muted)',
        background: 'var(--color-secondary-fade)',
        fontFamily: 'var(--font-body)',
        textAlign: 'center',
        padding: compact ? '0.2rem' : '0.5rem',
        ...style,
      }}
    >
      <ImageOffIcon size={compact ? 16 : 22} />
      {!compact && <span style={{ fontSize: '0.68rem', lineHeight: 1.25 }}>Product image<br />not found</span>}
    </div>
  );
}

// Shared by every place that renders a user-collected product snapshot
// (ecosystem, wishlist, tracked, compared, omitted, recommendations) —
// these are frozen copies of a product object taken at add/save/recommend
// time (App.jsx's toggleMyProduct, savedProductsStore, etc.), not live
// references, so a product's `image` field can be stale or ('' for an
// LLM-recommended item whose model wasn't confident of a real photo — see
// enrichProduct in api/llm-recommendations.js). Originally only fixed
// inside MyEcosystem.jsx's own tile grids; promoted here after the same
// class of bug turned up in the Wishlist (SavedForLater.jsx) showing a
// letter avatar for a product whose real photo was already resolved and
// correctly displayed one section above it on the same page.
const CATALOG_BY_NORMALIZED_NAME = new Map(
  ALL_PRODUCTS.map((p) => [String(p.name || '').trim().toLowerCase(), p]).filter(([name]) => name)
);

/**
 * Synchronous best-effort lookup against the curated static catalog, by id
 * first (exact) then by normalized name (LLM-recommendation ids are always
 * freshly minted — see enrichProduct — so they can never match a catalog id
 * even for a product that's actually in the catalog under the same name).
 * Falls back to the product's own (possibly placeholder) image.
 */
export function resolveCatalogProductImage(product) {
  const allowBrandLogo = product?.type === 'digital';
  const byId = product?.id ? getProductById(product.id) : null;
  if (byId && !isPlaceholderProductImage(byId.image, byId.type === 'digital' || allowBrandLogo)) return byId.image;
  const byName = CATALOG_BY_NORMALIZED_NAME.get(String(product?.name || '').trim().toLowerCase());
  if (byName && !isPlaceholderProductImage(byName.image, byName.type === 'digital' || allowBrandLogo)) return byName.image;
  return product?.image;
}

/**
 * Renders a product's real photo, falling back to a live /api/product-image
 * lookup (same resolver Discovery.jsx/ProductModal.jsx use) when the
 * catalog lookup above still comes up empty — e.g. a genuinely novel
 * LLM-recommended product with no catalog entry at all (Brightside, Clue,
 * Thorne Iron Bisglycinate). Renders `letterNode` (an initial-letter
 * avatar) while no real image is available.
 */
export default function ProductTileImage({ product, alt = '', imgStyle, imgClassName, letterNode }) {
  const allowBrandLogo = product?.type === 'digital';
  const initial = resolveCatalogProductImage(product);
  const [resolved, setResolved] = useState('');
  const attemptedRef = useRef(null);

  useEffect(() => {
    setResolved('');
    attemptedRef.current = null;
  }, [product?.id, product?.name]);

  useEffect(() => {
    if (!product?.name) return;
    if (!isPlaceholderProductImage(initial, allowBrandLogo)) return;
    if (attemptedRef.current === product.id) return;
    attemptedRef.current = product.id;
    let active = true;
    resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '').then((url) => {
      if (active && url) setResolved(url);
    });
    return () => { active = false; };
  }, [initial, product?.id, product?.name, product?.brand, product?.url]);

  // `resolved` came back from the server's /api/product-image, which already
  // applied the type-aware (allowBrandLogo) check — re-running it through
  // isPlaceholderProductImage here would reject a legitimate app/telehealth
  // logo again, since that heuristic has no idea the product is 'digital'.
  const finalSrc = resolved || safeProductImageSrc(initial, allowBrandLogo);
  if (finalSrc) {
    return (
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        className={imgClassName}
        style={imgStyle}
        // A backgrounded tab can abort an in-flight/lazy image load with a
        // genuine `error` event even though the URL is completely fine —
        // one retry before actually giving up and hiding it.
        onError={(e) => handleImageErrorWithRetry(e, () => { e.currentTarget.style.display = 'none'; })}
      />
    );
  }
  return letterNode;
}
