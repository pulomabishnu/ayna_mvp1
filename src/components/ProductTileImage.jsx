import { useState, useEffect } from 'react';
import { ALL_PRODUCTS, getProductById } from '../data/catalog.js';
import { applyCatalogCorrections } from '../data/catalogCorrections';
import { resolveProductImage, isPlaceholderProductImage, safeProductImageSrc } from '../utils/resolveProductImage';
import { handleImageErrorWithRetry } from '../utils/imageRetry';
import { productImageOverride } from '../data/productImageOverrides';

/**
 * The honest "we couldn't find a real photo" state. Previously a literal
 * "Product image not found" label next to a generic broken-image icon
 * accurate, but it read like a raw dev fallback dropped into an otherwise
 * carefully art-directed site (cream, gold accents, serif display type)
 * rather than a deliberate placeholder (found live, 2026-08-24 bug bash).
 * Now a faint watermark of the site's own wordmark, in the same italic
 * serif and navy the real nav logo uses, on the existing warm gold wash
 * quiet and on-brand instead of alarming. The literal "not found" wording
 * still reaches screen readers and hover users via aria-label/title.
 */
const FALLBACK_TINTS = ['#f7badd', '#f6e3a1', '#769ebe'];
export function ProductImageFallback({ compact = false, style, className, product = null }) {
  // With a product: a designed tile (its initial in the logo face on a tint
  // picked from its name, brand under it) instead of a faint wordmark.
  if (product && !compact) {
    // P1-4: a designed no-photo tile, not a letter avatar. It reads like the
    // label on a plain pharmacy box: the brand in the logo face on a tint
    // picked from its name, a hairline rule, then "Photo coming soon".
    const name = String(product.name || '').trim();
    const brand = String(product.brand || '').trim();
    const key = brand || name;
    const tint = FALLBACK_TINTS[[...key].reduce((n, c) => n + c.charCodeAt(0), 0) % FALLBACK_TINTS.length];
    return (
      <div role="img" aria-label={name ? `No photo yet for ${name}` : 'Product image not found'} className={`ay-nophoto ${className || ''}`.trim()}
        style={{ width: '100%', height: '100%', display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 8, padding: 14, boxSizing: 'border-box', background: tint, color: '#3e2723', textAlign: 'center', ...style }}>
        <span aria-hidden="true" style={{ font: "700 19px/1.05 'ayna Display', var(--ay-font-logo), sans-serif", letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '100%' }}>{key || 'ayna'}</span>
        <span aria-hidden="true" style={{ width: 28, height: 1.5, background: '#3e2723' }} />
        <span aria-hidden="true" style={{ font: "500 12.5px/1.2 'Figtree', system-ui, sans-serif" }}>Photo coming soon</span>
      </div>
    );
  }
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
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-secondary-fade)',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          // The faint wordmark placeholder uses the logo face, like the header logo.
          fontFamily: 'var(--ay-font-logo)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          fontSize: compact ? '0.95rem' : '1.6rem',
          color: 'var(--color-primary)',
          opacity: 0.16,
          userSelect: 'none',
        }}
      >
        ayna
      </span>
    </div>
  );
}

// Shared by every place that renders a user-collected product snapshot
// (ecosystem, wishlist, tracked, compared, omitted, recommendations)
// these are frozen copies of a product object taken at add/save/recommend
// time (App.jsx's toggleMyProduct, savedProductsStore, etc.), not live
// references, so a product's `image` field can be stale or ('' for an
// LLM-recommended item whose model wasn't confident of a real photo, see
// enrichProduct in api/llm-recommendations.js). Originally only fixed
// inside MyEcosystem.jsx's own tile grids; promoted here after the same
// class of bug turned up in the Wishlist (SavedForLater.jsx) showing a
// letter avatar for a product whose real photo was already resolved and
// correctly displayed one section above it on the same page.
// Built on first use from whichever catalog is loaded (data/catalog.js loads it after first paint).
let catalogByName = null;
let catalogByNameSource = null;
const catalogProductByName = (name) => {
  if (catalogByNameSource !== ALL_PRODUCTS) {
    catalogByName = new Map(ALL_PRODUCTS.map((p) => [String(p.name || '').trim().toLowerCase(), p]).filter(([n]) => n));
    catalogByNameSource = ALL_PRODUCTS;
  }
  return catalogByName.get(name);
};

/**
 * Synchronous best-effort lookup against the curated static catalog, by id
 * first (exact) then by normalized name (LLM-recommendation ids are always
 * freshly minted, see enrichProduct, so they can never match a catalog id
 * even for a product that's actually in the catalog under the same name).
 * Falls back to the product's own (possibly placeholder) image.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function resolveCatalogProductImage(product) {
  const allowBrandLogo = product?.type === 'digital';
  // Cleaned white-background studio photo wins over any stored/catalog image.
  const override = productImageOverride(product);
  if (override) return override;
  const byId = product?.id ? getProductById(product.id) : null;
  if (byId) return applyCatalogCorrections(byId).image || '';
  const corrected = applyCatalogCorrections(product);
  if (corrected !== product) return corrected.image || '';
  const byName = catalogProductByName(String(product?.name || '').trim().toLowerCase());
  if (byName && productImageOverride(byName)) return productImageOverride(byName);
  if (byName && !isPlaceholderProductImage(byName.image, byName.type === 'digital' || allowBrandLogo)) return byName.image;
  return product?.image;
}

/**
 * Renders a product's real photo, falling back to a live /api/product-image
 * lookup (same resolver Discovery.jsx/ProductModal.jsx use) when the
 * catalog lookup above still comes up empty, e.g. a genuinely novel
 * LLM-recommended product with no catalog entry at all (Brightside, Clue,
 * Thorne Iron Bisglycinate). Renders `letterNode` (an initial-letter
 * avatar) while no real image is available.
 */
// Callers that didn't pass `alt` at all got a blank one by default, some
// product images across the app had real descriptions, others none, a real
// screen-reader barrier (found live, 2026-08-24 bug bash). The product name
// is always a meaningful description for a product photo, so it's the
// default now instead of blank; an explicit alt (including "" for a
// genuinely decorative use) still overrides it.
export default function ProductTileImage({ product, alt, imgStyle, imgClassName, letterNode, loading = 'lazy' }) {
  product = applyCatalogCorrections(product);
  const resolvedAlt = alt !== undefined ? alt : (product?.name || '');
  const allowBrandLogo = product?.type === 'digital';
  const initial = resolveCatalogProductImage(product);
  const identity = JSON.stringify([product?.id, product?.name, product?.brand, product?.url, product?.type, initial]);
  const [resolved, setResolved] = useState(null);
  const [failedSrc, setFailedSrc] = useState('');

  useEffect(() => {
    if (!product?.name || !isPlaceholderProductImage(initial, allowBrandLogo)) return;
    let active = true;
    resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '').then((url) => {
      if (active && url) setResolved({ identity, url });
    });
    return () => { active = false; };
  }, [identity, initial, product?.name, product?.brand, product?.url, product?.type, allowBrandLogo]);

  // Both catalog and dynamically resolved external photos pass through the
  // same same-origin image cache. allowBrandLogo preserves valid app/
  // telehealth artwork that the physical-product placeholder heuristic would
  // otherwise reject.
  const finalSrc = safeProductImageSrc((resolved?.identity === identity ? resolved.url : '') || initial, allowBrandLogo);
  if (finalSrc && failedSrc !== finalSrc) {
    return (
      <img
        key={finalSrc}
        src={finalSrc}
        alt={resolvedAlt}
        loading={loading}
        className={imgClassName}
        style={allowBrandLogo ? imgStyle : { ...imgStyle, objectFit: 'contain' }}
        // A backgrounded tab can abort an in-flight/lazy image load with a
        // genuine `error` event even though the URL is completely fine
        // one retry before actually giving up and hiding it.
        onError={(e) => handleImageErrorWithRetry(e, () => setFailedSrc(finalSrc))}
      />
    );
  }
  return letterNode || <ProductImageFallback style={imgStyle} className={imgClassName} />;
}
