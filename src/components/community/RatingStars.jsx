import { normalizeRating, ratingLabel } from '../../utils/community/reviewRatings.js';

const STAR = 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z';

/**
 * Five stars, the first `value` filled, read out as "Rated 4 out of 5".
 * Filled stars use the ink colour (espresso, or white in dark mode) so they
 * never disappear into a light card.
 */
export function RatingStars({ value, size = 15, className = '' }) {
  const n = normalizeRating(value);
  return <span className={`cr-stars ${className}`.trim()} role="img" aria-label={ratingLabel(n)} data-rating={n}>
    {[1, 2, 3, 4, 5].map((i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={i <= n ? 'is-on' : undefined}><path d={STAR} fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>)}
  </span>;
}

/** Tap-to-pick 1 to 5 stars (a radio group). */
export function RatingPicker({ value, onChange, label = 'Your rating', size = 28, className = '' }) {
  const n = normalizeRating(value);
  return <div className={`cr-rating-picker ${className}`.trim()} role="radiogroup" aria-label={label}>
    {[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} role="radio" aria-checked={n === i} aria-label={`${i} out of 5`} className={i <= n ? 'is-on' : undefined} onClick={() => onChange?.(i)}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    </button>)}
  </div>;
}
