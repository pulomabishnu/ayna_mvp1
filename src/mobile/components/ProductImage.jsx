import { useState } from 'react';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { ProductImageFallback } from '../../components/ProductTileImage.jsx';

/**
 * Fills its (position: relative) parent with either the product's real
 * photo or the shared "ayna" watermark placeholder — used instead of a bare
 * CSS backgroundImage everywhere a product image renders in the mobile app.
 * backgroundImage has no onError, so a dead external hotlink (a brand's CDN
 * asset that starts 403ing/404ing after the catalog entry was written)
 * rendered as a blank box forever instead of falling back to anything.
 *
 * Tracks the src that errored (rather than a plain boolean + a reset effect)
 * so a prop change to a different src is automatically treated as
 * untried/not-errored during render, with no effect needed to clear it.
 */
export default function ProductImage({ src, alt, allowBrandLogo = false, compact = false, style }) {
  const safeSrc = safeProductImageSrc(src, allowBrandLogo);
  const [erroredSrc, setErroredSrc] = useState(null);

  if (!safeSrc || erroredSrc === safeSrc) {
    return <ProductImageFallback compact={compact} style={{ position: 'absolute', inset: 0, ...style }} />;
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
