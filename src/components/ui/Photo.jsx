import VARIANTS from './photoVariants.json';

// A lifestyle or team photo with AVIF first, WebP (or the original) as the
// fallback, and smaller widths for phones (srcset + sizes), so a 390px phone
// downloads a ~25KB AVIF instead of the full ~85KB WebP. Below-the-fold photos
// stay loading="lazy" (the caller passes loading/fetchPriority for the hero).
// Variants are pre-generated next to the original (photoVariants.json lists
// them); a photo without variants renders as a plain <img>.
// <picture> is display: contents, so the <img> lays out as before.
export default function Photo({ src, sizes = '(max-width: 720px) 92vw, 480px', alt = '', ...img }) {
  const v = VARIANTS[src];
  if (!v) return <img src={src} alt={alt} {...img} />;
  const base = src.replace(/\.(webp|jpe?g|png)$/i, '');
  const fallback = v.webp ? `${base}.webp` : src;
  const set = (ext, full) => [...v.widths.map((w) => `${base}-${w}.${ext} ${w}w`), `${full} ${v.w}w`].join(', ');
  return (
    <picture style={{ display: 'contents' }}>
      <source type="image/avif" srcSet={set('avif', `${base}.avif`)} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp', fallback)} sizes={sizes} />
      <img src={src} alt={alt} width={img.width ?? v.w} height={img.height ?? v.h} decoding="async" {...img} />
    </picture>
  );
}
