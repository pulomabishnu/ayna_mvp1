import React from 'react';
import './pdp.css';

/**
 * Thumbnail strip under the main product photo (website + app). Cover is
 * always first. Renders nothing for a single photo.
 */
export default function GalleryThumbs({ images = [], index = 0, onSelect, name = 'Product' }) {
  if (images.length < 2) return null;
  return (
    <ul className="ay-thumbs" aria-label={`${name} photos`}>
      {images.map((src, i) => (
        <li key={src}>
          <button
            type="button"
            className={i === index ? 'is-on' : undefined}
            aria-label={`Photo ${i + 1} of ${images.length}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => onSelect(i)}
          >
            <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.closest('li').style.display = 'none'; }} />
          </button>
        </li>
      ))}
    </ul>
  );
}
