import { getProductMatchDetailsForProduct } from '../../data/products.js';
import { matchPercent } from '../../matching/matchBreakdown.js';

// The one match score the app shows for a product (walkthrough P0-4: Swipe
// said 95% while the Shop card and product page said 97% for the same product).
// Every surface (Shop card, Ecosystem shelf, Swipe, product page, Why this
// match, Wrapped, Community product chips) reads the same engine call with the
// same inputs: her quiz answers plus the app's matchOpts (saved, "Not for me",
// in her ecosystem, connected health data). Never call the engine without
// matchOpts, and never with a shelf needId, for a number that is shown: that
// produces a second percent for the same product. The engine memoises per
// product and profile, so calling this per render is cheap.

/** Engine details for this product and profile, or null without a profile. */
export function productMatch(product, quizAnswers, matchOpts) {
  if (!product || !quizAnswers) return null;
  return getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts || undefined);
}

/** The percent to show (0..100), or null when there is no scored match to show. */
export function matchPercentFor(product, quizAnswers, matchOpts) {
  // The one engine call (matching/matchBreakdown.js), the same as the website's getProfileMatchPercentForProduct.
  return matchPercent(product, quizAnswers, { matchOpts: matchOpts || undefined });
}
