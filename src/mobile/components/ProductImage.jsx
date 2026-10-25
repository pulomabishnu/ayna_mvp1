import { useEffect, useState } from 'react';
import { safeProductImageSrc, resolveProductImage } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';

// No photo yet: the same designed tile as the website (ProductTileImage.jsx):
// the brand in the display face on a tint picked from its name, a hairline,
// then "Photo coming soon". Not a letter avatar (review, Oct 24).
const TINTS = ['pink', 'butter', 'sky'];
function PhotoPlaceholder({ style, product }) {
  const name = String(product?.name || '').trim();
  const brand = String(product?.brand || '').trim();
  const key = brand || name || 'ayna';
  const tint = TINTS[[...key].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <div className={`ayna-fresh-photo-placeholder ay-ph is-${tint}`} role="img" aria-label={name ? `No photo yet for ${name}` : 'Product photo unavailable'} style={{ position: 'absolute', inset: 0, ...style }}>
      <span aria-hidden="true" className="ay-ph-name">{key}</span>
      <span aria-hidden="true" className="ay-ph-rule" />
      {/* Services (apps, telehealth, programs) have no product photo to come: say what they are. */}
      <span aria-hidden="true" className="ay-ph-soon">{product?.type === 'digital' ? String(product.category || 'Service').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Photo coming soon'}</span>
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
