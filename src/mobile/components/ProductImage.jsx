import { useEffect, useState } from 'react';
import { safeProductImageSrc, resolveProductImage } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';

// No photo yet: a designed tile (the product's initial in the logo face on a
// tint picked from its name, with the brand under it), never a blank logo.
const TINTS = ['pink', 'butter', 'sky'];
function PhotoPlaceholder({ style, product }) {
  const name = String(product?.name || '').trim();
  const brand = String(product?.brand || '').trim();
  const initial = (brand || name).charAt(0).toUpperCase() || 'a';
  const tint = TINTS[[...(brand || name)].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <div className={`ayna-fresh-photo-placeholder ay-ph is-${tint}`} role="img" aria-label={name ? `No photo yet for ${name}` : 'Product photo unavailable'} style={{ position: 'absolute', inset: 0, ...style }}>
      <span aria-hidden="true" className="ay-ph-initial">{initial}</span>
      {brand && <span aria-hidden="true" className="ay-ph-brand">{brand}</span>}
    </div>
  );
}

/**
 * Fills its (position: relative) parent with either the product's real
 * photo or the shared "ayna" watermark placeholder, used instead of a bare
 * CSS backgroundImage everywhere a product image renders in the mobile app.
 * backgroundImage has no onError, so a dead external hotlink (a brand's CDN
 * asset that starts 403ing/404ing after the catalog entry was written)
 * rendered as a blank box forever instead of falling back to anything.
 *
 * Tracks the src that errored (rather than a plain boolean + a reset effect)
 * so a prop change to a different src is automatically treated as
 * untried/not-errored during render, with no effect needed to clear it.
 */
export default function ProductImage({ src, alt, allowBrandLogo = false, style, product }) {
  // Cleaned white-background studio photo (by catalog id) wins over `src`.
  const directSrc = productImageOverride(product) || safeProductImageSrc(src, allowBrandLogo);
  // Same live photo lookup the website always used (/api/product-image via
  // resolveProductImage) when the catalog has no usable photo, so cards
  // stop showing the placeholder for products that do have a real image.
  const [looked, setLooked] = useState({ key: '', url: '' });
  const lookupKey = product?.name ? `${product.brand || ''}|${product.name}` : '';
  const needsLookup = !!lookupKey && !directSrc;
  useEffect(() => {
    if (!needsLookup) return undefined;
    let active = true;
    resolveProductImage(product.name, product.brand || '', product.url || '', product.type || '')
      .then((url) => { if (active && url) setLooked({ key: lookupKey, url }); })
      .catch(() => {});
    return () => { active = false; };
  }, [needsLookup, lookupKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const safeSrc = directSrc || (looked.key === lookupKey ? looked.url : '');
  const [erroredSrc, setErroredSrc] = useState(null);

  if (!safeSrc || erroredSrc === safeSrc) {
    return <PhotoPlaceholder style={style} product={product} />;
  }
  return (
    <img
      src={safeSrc}
      alt={alt || ''}
      loading="lazy"
      onError={() => setErroredSrc(safeSrc)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
}
