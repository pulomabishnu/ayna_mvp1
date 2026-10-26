// matchBreakdown(product, profile): the "Why NN%?" breakdown from the one
// engine call every surface uses (getProductMatchDetailsForProduct), so the
// percent here is always the card's and the product page's percent.
import { getProductMatchDetailsForProduct } from '../data/products.js';
import { breakdownFromDetails, matchPercentFromDetails } from './breakdown.js';

/**
 * @param {object} product catalog product
 * @param {object} profile her quiz answers (the same object the cards pass)
 * @param {{ healthProfile?: object|null, matchOpts?: object }} [opts] same matchOpts as the card (saved, Not for me, health data)
 */
export function matchBreakdown(product, profile, { healthProfile = null, matchOpts } = {}) {
  if (!product || !profile) return null;
  return breakdownFromDetails(product, getProductMatchDetailsForProduct(product, profile, healthProfile, matchOpts));
}

/** The match percent for this product and profile: the same number on the website and in the app. */
export function matchPercent(product, profile, { healthProfile = null, matchOpts } = {}) {
  if (!product || !profile) return null;
  return matchPercentFromDetails(getProductMatchDetailsForProduct(product, profile, healthProfile, matchOpts));
}

export { breakdownFromDetails, matchPercentFromDetails, matchLabel, PARTNER_NOTE } from './breakdown.js';
