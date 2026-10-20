import { useState } from 'react';
import { useProductReviews } from './useProductReviews.js';
import { RatingStars } from '../community/RatingStars.jsx';
import '../community/community-shared.css';

const SHOWN = 5;

function excerpt(text, max = 220) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function when(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/**
 * The product page's community reviews: stars, a short excerpt and a link to
 * the full review (and its replies) in Community.
 */
export default function ProductCommunityReviews({ productId, rows = null, onOpenReview = null, heading = 'Reviews in Community', initial = SHOWN }) {
  const live = useProductReviews(rows ? null : productId);
  const reviews = rows || live;
  const [all, setAll] = useState(false);
  if (!reviews.length) return null;
  const shown = all ? reviews : reviews.slice(0, initial);
  const open = (e, id) => {
    if (!onOpenReview || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    onOpenReview(id);
  };
  return <section className="cr-product-reviews-wrap" aria-label={heading} id="reviews">
    <h3 className="ay-part__h">{heading}</h3>
    <ul className="cr-product-reviews">
      {shown.map((r) => {
        const who = r.is_anonymous || !r.author_id ? 'Anonymous' : (r.author_display_name || r.author_username || 'Community member');
        return <li key={r.id}>
          <a href={`/community/p/${r.id}`} onClick={(e) => open(e, r.id)}>
            <RatingStars value={r.rating} size={15} />
            {r.body && <p>{excerpt(r.body)}</p>}
            <small>{who}{when(r.created_at) ? `, ${when(r.created_at)}` : ''}{r.edited_at ? ' (edited)' : ''}. Read in Community</small>
          </a>
        </li>;
      })}
    </ul>
    {reviews.length > initial && <button type="button" className="cr-review-link" aria-expanded={all} onClick={() => setAll((v) => !v)}>{all ? 'Show fewer reviews' : `See all ${reviews.length} reviews`}</button>}
  </section>;
}
