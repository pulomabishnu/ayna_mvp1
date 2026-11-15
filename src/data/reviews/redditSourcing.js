/**
 * Founder decision (Ameera, Nov 15): "Hide all unsourced Reddit summaries pending exact source URLs
 * and verification. No invented citations or generic Reddit search links."
 *
 * A Reddit link counts as a source only when it points at one thread (/r/<sub>/comments/<id>).
 * A subreddit's front page or a Reddit search is not a source. A "What people say" text that cites
 * Reddit with no thread link behind it is hidden (the team's copy stays in the data, untouched).
 */
const THREAD = /reddit\.com\/r\/[^/]+\/comments\/[a-z0-9]+/i;

export const isRedditUrl = (url) => /(^|\.)reddit\.com/i.test(String(url || '').replace(/^https?:\/\//, '').split('/')[0]);
export const isRedditThread = (url) => THREAD.test(String(url || ''));
/** A generic Reddit link: the subreddit home, a search, or anything that isn't one thread. */
export const isGenericReddit = (url) => isRedditUrl(url) && !isRedditThread(url);

function links(product) {
  const v = product?.verificationLinks || {};
  return [...(v.community?.links || v.community || []), ...(product?.communityLinks || []), ...(product?.communityReviewSourceUrl ? [{ url: product.communityReviewSourceUrl }] : [])]
    .map((l) => (typeof l === 'string' ? l : l?.url)).filter(Boolean);
}

/** True when the product's "What people say" leans on Reddit without one real thread link. */
export function hasUnsourcedRedditSummary(product) {
  const text = String(product?.communityReview || '');
  if (!/reddit|\br\/[a-z]/i.test(text)) return false;
  return !links(product).some(isRedditThread);
}

/** The community review text to show: empty when it is an unsourced Reddit summary. */
export function shownCommunityReview(product) {
  return hasUnsourcedRedditSummary(product) ? '' : (product?.communityReview || '');
}
