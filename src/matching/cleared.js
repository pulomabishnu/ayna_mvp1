// The one test every surface that puts a product forward must pass (P0, Nov 2).
//
// `eligible`, `eligibility`, `matchStatus` and `recommendable` overlap, and the
// AI ecosystem builder once read only `eligible`, so a product on a safety
// hold (eligible: true, eligibility: 'restricted', matchStatus: 'safety-hold',
// percent: null) could still reach the model. A product is cleared only when
// the deterministic engine scored it, found nothing restricting it for her,
// the listing itself may be recommended, and the fit is a real positive number.
// Anything else (hold, exclusion, bleeding evaluation, no relevance, unknown)
// is not cleared. Unknown is not safe.

/** @param {object|null|undefined} details result of getProductMatchDetailsForProduct */
export function clearedForRecommendation(details) {
  if (!details || typeof details !== 'object') return false;
  if (details.matchStatus !== 'scored') return false;
  if (details.eligibility !== 'eligible') return false;
  if (details.eligible !== true) return false;
  if (details.recommendable !== true) return false;
  if ((details.missingProductInfo || []).length > 0) return false;
  const pct = details.percent;
  return typeof pct === 'number' && Number.isFinite(pct) && pct > 0;
}
