import React, { useEffect, useRef } from 'react';
import ImageZoomViewer from '../../mobile/components/ImageZoomViewer.jsx';
import GalleryThumbs from './GalleryThumbs.jsx';
import './pdp-gallery.css';

const reduceMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/**
 * Product photos (website and app, focus group Oct 19 + team direction 7):
 * swipe between photos on phones (scroll snap), a clear "2 of 4" and dots
 * for the photo on screen, arrows and thumbnails on wide screens, and a tap
 * on the photo (or the zoom button) opens the full-screen viewer with pinch,
 * double tap and drag to zoom.
 *
 * `renderImage(src, i)` lets the app draw its own image component; the
 * website gets a plain <img>. `fallback` shows when there is no photo.
 */
export default function ProductGallery({
  images = [],
  index = 0,
  onIndex,
  name = 'Product',
  product = null,
  alt = (i) => (images.length > 1 ? `${name}, photo ${i + 1} of ${images.length}` : name),
  renderImage = null,
  fallback = null,
  onImageError = null,
  zoomOpen = false,
  onZoom,
  thumbs = true,
  className = '',
}) {
  const trackRef = useRef(null);
  const count = images.length;
  const at = Math.min(Math.max(index, 0), Math.max(count - 1, 0));

  // Keep the strip on the chosen photo when it changes from a thumbnail or arrow.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const want = at * el.clientWidth;
    if (Math.abs(el.scrollLeft - want) > 4) el.scrollTo({ left: want, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }, [at]);

  // A swipe settles on a photo: that photo becomes the chosen one.
  const settle = useRef(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const i = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
      if (i !== at && i >= 0 && i < count) onIndex?.(i);
    }, 90);
  };
  useEffect(() => () => window.clearTimeout(settle.current), []);

  if (!count) return <div className={`ay-gal is-empty ${className}`.trim()}>{fallback}</div>;

  const go = (d) => onIndex?.((at + d + count) % count);
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  return (
    <div className={`ay-gal${count > 1 ? ' is-multi' : ''} ${className}`.trim()}>
      <div className="ay-gal__stage">
        <div
          ref={trackRef}
          className="ay-gal__track"
          onScroll={onScroll}
          onKeyDown={count > 1 ? onKeyDown : undefined}
          role={count > 1 ? 'region' : undefined}
          aria-roledescription={count > 1 ? 'carousel' : undefined}
          aria-label={count > 1 ? `${name} photos` : undefined}
          tabIndex={count > 1 ? 0 : undefined}
        >
          {images.map((src, i) => (
            <div key={src} className="ay-gal__slide" role={count > 1 ? 'group' : undefined} aria-roledescription={count > 1 ? 'slide' : undefined} aria-label={count > 1 ? `Photo ${i + 1} of ${count}` : undefined} aria-hidden={count > 1 && i !== at ? true : undefined}>
              <button type="button" className="ay-gal__open" tabIndex={i === at ? 0 : -1} onClick={() => { onIndex?.(i); onZoom?.(true); }} aria-label={`Zoom in on ${count > 1 ? `photo ${i + 1} of ${name}` : `the photo of ${name}`}`}>
                {renderImage ? renderImage(src, i) : <img src={src} alt={alt(i)} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} onError={onImageError ? (e) => onImageError(e, src) : undefined} />}
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="ay-gal__zoom" onClick={() => onZoom?.(true)} aria-label={`View ${name} photo full screen`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5" /></svg>
        </button>
        {count > 1 && (
          <>
            <button type="button" className="ay-gal__arrow is-prev" onClick={() => go(-1)} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" className="ay-gal__arrow is-next" onClick={() => go(1)} aria-label="Next photo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <div className="ay-gal__count" aria-live="polite">{at + 1} of {count}</div>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="ay-gal__dots" aria-hidden="true">
          {images.map((src, i) => <i key={src} className={i === at ? 'is-on' : undefined} />)}
        </div>
      )}
      {thumbs && <div className="ay-gal__thumbs"><GalleryThumbs images={images} index={at} onSelect={(i) => onIndex?.(i)} name={name} product={product} /></div>}
      {zoomOpen && <ImageZoomViewer images={images} startIndex={at} name={name} onClose={() => onZoom?.(false)} />}
    </div>
  );
}
