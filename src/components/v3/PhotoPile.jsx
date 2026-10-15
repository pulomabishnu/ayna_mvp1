import React, { useState } from 'react';
import { PHOTOS } from './photos.js';

/* A pile of three tilted photos for page headers. Hover fans them out;
   clicking (or Enter) shuffles the next photo to the front. Decorative
   framing only: every photo still carries alt text. Light theme only
   (hidden in the dark theme by theme-v3.css). */

export default function PhotoPile({ photos = [], label = 'Photos', className = '' }) {
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  if (photos.length === 0) return null;
  const next = () => setOrder((o) => [...o.slice(1), o[0]]);
  return (
    <button type="button" className={`ay3-pile${className ? ` ${className}` : ''}`} onClick={next} aria-label={`${label}: show the next photo`}>
      {order.map((idx, pos) => {
        const key = photos[idx];
        return (
          <img
            key={key}
            className={`ay3-pile__p ay3-pile__p--${pos}`}
            src={`/landing/${key}.webp`}
            alt={pos === 0 ? (PHOTOS[key] || '') : ''}
            loading="lazy"
          />
        );
      })}
      <span className="ay3-pile__hint" aria-hidden="true">shuffle</span>
    </button>
  );
}

/* Film-negative strip of photos that drifts sideways; pauses on hover. */
export function FilmStrip({ photos = [] }) {
  if (photos.length === 0) return null;
  const row = (hidden) => (
    <ul className="ay3-film__row" aria-hidden={hidden || undefined}>
      {photos.map((k) => <li key={k}><img src={`/landing/${k}.webp`} alt={hidden ? '' : (PHOTOS[k] || '')} loading="lazy" /></li>)}
    </ul>
  );
  return <div className="ay3-film"><div className="ay3-film__track">{row(false)}{row(true)}</div></div>;
}
