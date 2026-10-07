import { topicsForTags, isCycleTopic } from './topics.js';

/**
 * "For you" ranking for the Community feed.
 *
 * V1 runs in the viewer's browser over each page of recent posts the server
 * returns (newest first, keyset-paginated). Keeping it client-side means the
 * viewer's health signals never leave their device to rank a feed — the
 * server only ever sees "give me the next page".
 *
 * Signals, all optional:
 *   interest     — the viewer's own profile tags (getProfileInterestSignals)
 *   lifeStage    — flags from the same helper; pushes period-only topics down
 *                  for people who don't get periods
 *   matchFor     — (productId) => viewer's % match from the existing engine
 *   followingIds / friendIds — social graph
 *   ownedProductIds — ecosystem + wishlist, so posts about products the
 *                  viewer already uses surface
 *
 * The weights are deliberately simple and live in one object so they can be
 * tuned (or replaced by a server-side ranker) without touching the UI.
 */
export const FOR_YOU_WEIGHTS = {
  topic: 3,
  productMatch: 3,
  ownedProduct: 1.5,
  following: 2,
  friend: 2.5,
  helpful: 0.8,
  comments: 0.4,
  cycleMismatch: -4,
  recencyHalfLifeHours: 72,
};

export function postProductIds(post) {
  const ids = [];
  if (post?.product_id) ids.push(post.product_id);
  (post?.tagged_product_ids || []).forEach((id) => { if (!ids.includes(id)) ids.push(id); });
  return ids;
}

export function scorePostForViewer(post, signals = {}, now = Date.now(), weights = FOR_YOU_WEIGHTS) {
  const {
    interest = null,
    lifeStage = null,
    matchFor = null,
    followingIds = new Set(),
    friendIds = new Set(),
    ownedProductIds = new Set(),
  } = signals;

  let score = 0;
  const topics = post?.topics || [];

  if (interest && interest.length) {
    const viewerTopics = new Set(topicsForTags(interest));
    const overlap = topics.filter((t) => viewerTopics.has(t)).length;
    if (overlap) score += weights.topic * Math.min(overlap, 2);
  }

  const noCycle = lifeStage && (lifeStage.postMenopause || lifeStage.menopause || lifeStage.pregnant || lifeStage.noPeriods);
  if (noCycle && topics.length && topics.every(isCycleTopic)) score += weights.cycleMismatch;

  const productIds = postProductIds(post);
  if (matchFor && productIds.length) {
    const best = productIds.reduce((max, id) => {
      const pct = matchFor(id);
      return Number.isFinite(pct) ? Math.max(max, pct) : max;
    }, -1);
    if (best >= 0) score += weights.productMatch * ((best - 50) / 50);
  }
  if (productIds.some((id) => ownedProductIds.has(id))) score += weights.ownedProduct;

  if (post?.author_id && followingIds.has(post.author_id)) score += weights.following;
  if (post?.author_id && friendIds.has(post.author_id)) score += weights.friend;

  score += weights.helpful * Math.log1p(Math.max(0, post?.helpful_count || 0));
  score += weights.comments * Math.log1p(Math.max(0, post?.comment_count || 0));

  const ageHours = Math.max(0, (now - Date.parse(post?.created_at || now)) / 36e5);
  score += 2 * Math.pow(0.5, ageHours / weights.recencyHalfLifeHours);

  return score;
}

/** Average of the viewer's own match % across a playlist's products (null if none known). */
export function averageMatch(productIds, matchFor) {
  const vals = (productIds || []).map((id) => matchFor(id)).filter((v) => Number.isFinite(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Stable sort: equal scores keep the server's newest-first order. */
export function rankForYou(posts, signals, now = Date.now()) {
  return posts
    .map((post, index) => ({ post, index, score: scorePostForViewer(post, signals, now) }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((x) => x.post);
}
