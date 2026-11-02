// The one decision every surface that puts a product forward must use (P0, Nov 2).
//
// `eligible`, `eligibility`, `matchStatus` and `recommendable` overlap, and the
// AI ecosystem builder once read only `eligible`, so a product on a safety
// hold (eligible: true, eligibility: 'restricted', matchStatus: 'safety-hold',
// percent: null) could still reach the model. decideProduct turns those fields
// into ONE result with three shapes:
//
//   { status: 'cleared',  percent, band, reasons }   may be recommended
//   { status: 'hold',     reason, next }              no number, ever
//   { status: 'excluded', reason }                    not for her
//
// A hold has no percent or score field at all, so no screen can show one by
// mistake. Unknown is not safe: anything not clearly cleared is a hold.

const HOLD_STATUSES = new Set(['safety-hold', 'bleeding-evaluation']);

/** @param {object|null|undefined} details result of getProductMatchDetailsForProduct */
export function decideProduct(details) {
  if (!details || typeof details !== 'object') return { status: 'hold', reason: 'unknown', next: null };
  const status = details.matchStatus;
  if (status === 'excluded' || details.eligible === false || details.eligibility === 'excluded') {
    return { status: 'excluded', reason: (details.reasons || [])[0] || 'excluded' };
  }
  if (HOLD_STATUSES.has(status) || details.eligibility === 'restricted' || (details.missingProductInfo || []).length > 0) {
    const h = details.safetyHold || null;
    return {
      status: 'hold',
      reason: h?.reason || details.bleedingEvaluation?.text || (status === 'bleeding-evaluation' ? 'evaluation' : 'needs information'),
      state: h?.state || (status === 'bleeding-evaluation' ? 'evaluation' : 'needs_info'),
      next: h?.fix || null,
    };
  }
  if (status !== 'scored') return { status: 'hold', reason: status || 'unknown', state: 'not_scored', next: null };
  if (details.eligibility !== 'eligible' || details.eligible !== true) return { status: 'hold', reason: 'not cleared', state: 'not_scored', next: null };
  if (details.recommendable !== true) return { status: 'excluded', reason: 'listing not recommendable' };
  const pct = details.percent;
  if (!(typeof pct === 'number' && Number.isFinite(pct) && pct > 0)) return { status: 'hold', reason: 'no fit', state: 'not_scored', next: null };
  return { status: 'cleared', percent: pct, band: details.v2?.band || null, reasons: details.reasons || [] };
}

/** True only when decideProduct says cleared. Use this to gate any recommendation. */
export function clearedForRecommendation(details) {
  return decideProduct(details).status === 'cleared';
}
