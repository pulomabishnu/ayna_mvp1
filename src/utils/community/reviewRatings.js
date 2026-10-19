/**
 * Community review ratings: one place for "how many stars" and for the
 * per-product averages that product cards and pages show.
 *
 * Aggregates are always computed at read time from the reviews that are live
 * right now (status = 'visible' in community_posts). Nothing is stored per
 * product, so an edited rating or a deleted review changes the average the
 * next time it is read. Reads try the community_product_review_stats view
 * (supabase/community_review_ratings_2026-10-19.sql) and fall back to adding
 * up the rows of community_feed_posts when that view has not been created yet.
 */

export const REVIEWS_CHANGED_EVENT = 'ayna:community-reviews-changed';

/** A whole number of stars from 1 to 5, or 0 when there is no usable rating. */
export function normalizeRating(value) {
  if (value == null || value === '') return 0;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 0;
}

/** Accessible name for a row of stars: "Rated 4 out of 5". */
export function ratingLabel(value) {
  const n = normalizeRating(value);
  return n ? `Rated ${n} out of 5` : 'No rating';
}

/** "4.5" (one decimal) for averages. */
export function formatAverage(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : '';
}

function emptyStats() {
  return { count: 0, sum: 0, average: null, histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

/**
 * Add up review rows ({ product_id, rating }) into
 * { [productId]: { count, average, histogram } }. Rows without a product or
 * a 1 to 5 rating are skipped, so a half-written row never drags an average.
 */
export function summarizeReviewRows(rows) {
  const out = {};
  for (const row of rows || []) {
    const id = row?.product_id;
    const rating = normalizeRating(row?.rating);
    if (!id || !rating) continue;
    const s = out[id] || (out[id] = emptyStats());
    s.count += 1;
    s.sum += rating;
    s.histogram[rating] += 1;
  }
  for (const s of Object.values(out)) {
    s.average = s.count ? s.sum / s.count : null;
    delete s.sum;
  }
  return out;
}

/** Rows from community_product_review_stats into the same shape. */
export function statsFromViewRows(rows) {
  const out = {};
  for (const row of rows || []) {
    const count = Number(row?.review_count) || 0;
    if (!row?.product_id || count <= 0) continue;
    out[row.product_id] = {
      count,
      average: Number(row.average_rating),
      histogram: { 1: Number(row.rating_1) || 0, 2: Number(row.rating_2) || 0, 3: Number(row.rating_3) || 0, 4: Number(row.rating_4) || 0, 5: Number(row.rating_5) || 0 },
    };
  }
  return out;
}

function isMissingRelation(error) {
  const code = String(error?.code || '');
  return code === '42P01' || code === 'PGRST205' || code === 'PGRST200' || /does not exist|schema cache/i.test(String(error?.message || ''));
}

const FALLBACK_LIMIT = 2000;

/**
 * Live per-product averages from current, visible community reviews.
 * Returns {} when Supabase is not configured or the read fails, so the page
 * shows "no reviews yet" instead of an old number.
 */
export async function loadProductReviewStats(supabase) {
  if (!supabase) return {};
  const viaView = await supabase.from('community_product_review_stats')
    .select('product_id, review_count, average_rating, rating_1, rating_2, rating_3, rating_4, rating_5')
    .limit(FALLBACK_LIMIT);
  if (!viaView.error) return statsFromViewRows(viaView.data);
  if (!isMissingRelation(viaView.error)) throw viaView.error;
  const rows = await supabase.from('community_feed_posts').select('product_id, rating')
    .eq('kind', 'review').limit(FALLBACK_LIMIT);
  if (rows.error) throw rows.error;
  return summarizeReviewRows(rows.data);
}

/**
 * Merge live community stats into the { ratings, reviews } buckets the product
 * card and page read. The ratings from the old per-user user_reviews copy are
 * dropped on purpose: they never followed edits or deletes. The viewer's own
 * short text notes (reviews) are kept as they were.
 */
export function mergeReviewBuckets(ownBuckets, stats) {
  const out = {};
  for (const [id, bucket] of Object.entries(ownBuckets || {})) {
    out[id] = { ratings: [], reviews: Array.isArray(bucket?.reviews) ? bucket.reviews : [] };
  }
  for (const [id, s] of Object.entries(stats || {})) {
    out[id] = { ...(out[id] || { ratings: [], reviews: [] }), count: s.count, average: s.average, histogram: s.histogram };
  }
  return out;
}

/** Tell open product cards and pages to re-read the averages. */
export function announceReviewsChanged(detail = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent(REVIEWS_CHANGED_EVENT, { detail }));
    }
  } catch { /* ignore */ }
}

// The product page opens on its Reviews tab when a card's star line was the
// link that brought her there (a one-shot hand-off, cleared once read).
let pendingProductTab = null;
export function requestProductTab(tab, now = Date.now()) { pendingProductTab = tab ? { tab, at: now } : null; }
export function takeProductTab(now = Date.now()) {
  const pending = pendingProductTab;
  pendingProductTab = null;
  // A hand-off nobody picked up within a few seconds is stale.
  if (pending && now - pending.at < 5000) return pending.tab;
  try {
    if (typeof window !== 'undefined' && window.location?.hash === '#reviews') return 'reviews';
  } catch { /* ignore */ }
  return null;
}
