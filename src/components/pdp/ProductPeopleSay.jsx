import { RatingStars } from '../community/RatingStars.jsx';
import { useProductMentions } from './useProductMentions.js';
import { ratingBreakdown, topReviews, snippet, authorName, shortDate, kindLabel, plural } from './peopleSay.js';
import '../community/community-shared.css';
import './pdp.css';

/**
 * "What people say": the product page's member reviews where she scrolls,
 * not only inside the Reviews tab (beta feedback, Oct 2026: "like shopping
 * on Amazon"). The average, count and star bars come from the live community
 * reviews passed in; the cards are the most helpful, then newest; "From the
 * community" lists other member posts that tag this product. With no reviews
 * it is one line and a Write a review button. Nothing here is made up.
 */
export default function ProductPeopleSay({
  productId,
  reviews = [],
  mentions: mentionsProp = null,
  onSeeAll = null,
  onWriteReview = null,
  onOpenPost = null,
  hasOnline = false,
  shown = 3,
}) {
  const live = useProductMentions(mentionsProp ? null : productId);
  const mentions = (mentionsProp || live).slice(0, 4);
  const stats = ratingBreakdown(reviews);
  const top = topReviews(reviews, shown);

  const open = (e, id) => {
    if (!onOpenPost || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    onOpenPost(id);
  };
  const seeAll = (e) => { e.preventDefault(); onSeeAll?.(); };
  const write = onWriteReview && <button type="button" className="ayp-wps__btn" onClick={onWriteReview}>Write a review</button>;

  return (
    <section id="ayp-wps" className="ay-section ayp-wps" aria-labelledby="ayp-wps-h">
      <div className="ayp-wps__head">
        <h2 id="ayp-wps-h" className="ay-h2">What people say</h2>
        {stats.count > 0 && onSeeAll && (
          <a className="ayp-wps__all" href="#reviews" onClick={seeAll}>
            {stats.count > top.length ? `See all ${plural(stats.count, 'review')}` : 'Go to Reviews'}
          </a>
        )}
      </div>

      {stats.count > 0 ? (
        <div className="ayp-wps__grid">
          <div className="ayp-wps__summary">
            <p className="ayp-wps__avg">
              <b>{stats.average.toFixed(1)}</b>
              <span className="ayp-wps__avgstars" aria-hidden="true"><RatingStars value={stats.average} size={18} /></span>
              <span className="sr-only"> out of 5</span>
            </p>
            <p className="ayp-wps__count">From {plural(stats.count, 'ayna member review')}</p>
            <ul className="ayp-wps__bars" aria-label="Ratings from ayna members">
              {stats.bars.map((b) => (
                <li key={b.stars}>
                  <span className="ayp-wps__barlabel">{b.stars} <span aria-hidden="true">★</span><span className="sr-only">{b.stars === 1 ? 'star' : 'stars'}:</span></span>
                  <i aria-hidden="true"><s style={{ width: `${b.pct}%` }} /></i>
                  <span className="ayp-wps__barnum">{b.count}<span className="sr-only"> {b.count === 1 ? 'review' : 'reviews'}</span></span>
                </li>
              ))}
            </ul>
            {write && <div className="ayp-wps__cta">{write}</div>}
          </div>

          <ul className="ayp-wps__cards" aria-label="Most helpful member reviews">
            {top.map((r) => {
              const helpful = Number(r.helpful_count) || 0;
              const date = shortDate(r.created_at);
              return (
                <li key={r.id}>
                  <a className="ayp-wps__card" href={`/community/p/${r.id}`} onClick={(e) => open(e, r.id)}>
                    <span className="ayp-wps__cardtop">
                      <RatingStars value={r.rating} size={15} />
                      {helpful > 0 && <span className="ayp-wps__helpful">{helpful} found this helpful</span>}
                    </span>
                    {r.body && <span className="ayp-wps__body">{snippet(r.body, 260)}</span>}
                    <span className="ayp-wps__meta">{authorName(r)}{date ? `, ${date}` : ''}{r.edited_at ? ' (edited)' : ''}</span>
                    <span className="ayp-wps__go">Read in Community<span aria-hidden="true"> ›</span></span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="ayp-wps__empty">
          <p>No ayna member reviews yet. Tried it? Share how it went.</p>
          <div className="ayp-wps__emptyactions">
            {write}
            {hasOnline && onSeeAll && <a className="ayp-wps__all" href="#reviews" onClick={seeAll}>See online reviews</a>}
          </div>
        </div>
      )}

      {mentions.length > 0 && (
        <div className="ayp-wps__mentions">
          <h3 className="ayp-subh">From the community</h3>
          <p className="ayp-wps__note">Posts by ayna members that tag this product. Their experiences, not evidence.</p>
          <ul className="ayp-wps__posts">
            {mentions.map((m) => {
              const date = shortDate(m.created_at);
              const replies = Number(m.comment_count) || 0;
              return (
                <li key={m.id}>
                  <a className="ayp-wps__post" href={`/community/p/${m.id}`} onClick={(e) => open(e, m.id)}>
                    <span className="ayp-wps__kind">Member {kindLabel(m.kind).toLowerCase()}</span>
                    <span className="ayp-wps__body is-short">{snippet(m.body, 160)}</span>
                    <span className="ayp-wps__meta">{authorName(m)}{date ? `, ${date}` : ''}{replies ? `. ${plural(replies, 'reply', 'replies')}` : ''}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
