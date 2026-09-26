import { useState, useEffect } from 'react';
import { ALL_PRODUCTS, getProductById } from '../data/products';
import { applyCatalogCorrections } from '../data/catalogCorrections';
import { resolveProductImage, isPlaceholderProductImage, safeProductImageSrc } from '../utils/resolveProductImage';
import { handleImageErrorWithRetry } from '../utils/imageRetry';

/**
 * The honest "we couldn't find a real photo" state. Previously a literal
 * "Product image not found" label next to a generic broken-image icon —
 * accurate, but it read like a raw dev fallback dropped into an otherwise
 * carefully art-directed site (cream, gold accents, serif display type)
 * rather than a deliberate placeholder (found live, 2026-08-24 bug bash).
 * Now a faint watermark of the site's own wordmark, in the same italic
 * serif and navy the real nav logo uses, on the existing warm gold wash —
 * quiet and on-brand instead of alarming. The literal "not found" wording
 * still reaches screen readers and hover users via aria-label/title.
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
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-secondary-fade)',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: compact ? '0.95rem' : '1.6rem',
          color: '#242A52',
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
// eslint-disable-next-line react-refresh/only-export-components
export function resolveCatalogProductImage(product) {
  const byId = product?.id ? getProductById(product.id) : null;
  if (byId) return applyCatalogCorrections(byId).image || '';
  const corrected = applyCatalogCorrections(product);
  if (corrected !== product) return corrected.image || '';
  const byName = CATALOG_BY_NORMALIZED_NAME.get(String(product?.name || '').trim().toLowerCase());
  if (byName) return byName.image || '';
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
// Callers that didn't pass `alt` at all got a blank one by default — some
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
        style={imgStyle}
        // A backgrounded tab can abort an in-flight/lazy image load with a
        // genuine `error` event even though the URL is completely fine —
        // one retry before actually giving up and hiding it.
        onError={(e) => handleImageErrorWithRetry(e, () => setFailedSrc(finalSrc))}
      />
    );
  }
  return letterNode || <ProductImageFallback style={imgStyle} className={imgClassName} />;
}
