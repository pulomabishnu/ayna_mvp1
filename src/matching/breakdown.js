// "Why 92%?" (PDP audit, Oct 26, move 1): what raised the match, what
// lowered it and what ayna does not know yet, read straight from the engine
// result (src/matching/v2.js scoreV2 -> v2.parts / v2.unknown / v2.reason),
// so the card, product page, Ask and Compare all show the same number and
// the same reasons. Pure: pass the getProductMatchDetailsForProduct() result.
// matchBreakdown(product, profile) in ./matchBreakdown.js calls the engine.
import { shownMatchPercent, fitLabel, PARTIAL_FIT, SAFETY_HOLD, MATCH_UNAVAILABLE, BLEEDING_EVALUATION, SAFETY_HOLD_LINE, SAFETY_HOLD_PRODUCT_LINE, exclusionLines } from '../utils/matchDisplay.js';
import { whyLine } from '../utils/whyLine.js';

export const PARTNER_NOTE = 'Partnerships never change this score.';

/** One label per percent (founder, Oct 24): 80+ Strong fit, 60 to 79 Good fit, under 50 Partial fit. */
export function matchLabel(percent, band = null) {
  const n = Number(percent);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (shownMatchPercent(n) == null) return PARTIAL_FIT;
  return fitLabel(n, band);
}

/**
 * The one match percent every surface reads (website: getProfileMatchPercentForProduct,
 * app: matchPercentFor). Engine percent, rounded, for a scored and eligible match;
 * null for no profile, a safety hold, bleeding evaluation, an exclusion or no fit.
 * This is the ranking value: the printed number goes through shownMatchPercent (cap 97).
 */
export function matchPercentFromDetails(details) {
  if (!details || (details.matchStatus || 'scored') !== 'scored' || details.eligible === false) return null;
  const n = Number(details.percent);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

const item = (p) => ({ factor: p.factor, text: p.text, ...(Number.isFinite(p.delta) ? { delta: p.delta } : {}) });
const empty = (extra) => ({ percent: null, label: '', raised: [], lowered: [], unknown: [], checks: [], evidence: null, reason: '', note: PARTNER_NOTE, ...extra });

/**
 * @param {object|null} product catalog product
 * @param {object|null} details getProductMatchDetailsForProduct() result
 * @returns {{ percent: number|null, label: string, status: string, raised: {factor: string, text: string}[],
 *   lowered: {factor: string, text: string}[], unknown: {factor: string, text: string}[], reason: string, note: string } | null}
 */
export function breakdownFromDetails(product, details) {
  if (!details) return null;
  const status = details.matchStatus || 'scored';
  // Held back for safety: no percent anywhere, the reason and the fix instead.
  if (status === 'safety-hold') {
    const hold = details.safetyHold || {};
    const line = hold.kind === 'product' ? SAFETY_HOLD_PRODUCT_LINE : SAFETY_HOLD_LINE;
    return empty({ status, label: `${SAFETY_HOLD} · ${MATCH_UNAVAILABLE}`, unknown: [{ factor: 'safety', text: hold.reason || line }], reason: line });
  }
  if (status === 'bleeding-evaluation') {
    return empty({ status, label: BLEEDING_EVALUATION, reason: details.bleedingEvaluation?.text || BLEEDING_EVALUATION });
  }
  if (status === 'excluded' || details.eligible === false) {
    return empty({ status: 'excluded', lowered: exclusionLines(details).map((text) => ({ factor: 'excluded', text })) });
  }
  if (status !== 'scored' || !(details.percent > 0)) return empty({ status });

  const v2 = details.v2 || null;
  const parts = Array.isArray(v2?.parts) ? v2.parts : null;
  const byDelta = (a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0);
  const raised = parts ? parts.filter((p) => p.kind === 'raised').sort(byDelta).map(item)
    // v1 engine (?match=v1): no parts, so its reasons are what raised it.
    : (details.reasons || []).map((text) => ({ factor: 'reason', text }));
  const lowered = parts ? parts.filter((p) => p.kind === 'lowered').sort(byDelta).map(item) : [];
  const unknown = (v2?.unknown || []).map((u) => ({ factor: u.factor, text: u.text }));
  return {
    percent: details.percent,
    label: matchLabel(details.percent, details.v2?.band || null),
    status,
    raised,
    lowered,
    unknown,
    // From the decision trace (src/matching/trace.js): safety checks that
    // passed for her, and the evidence grade the score used.
    checks: details.trace?.checks || [],
    evidence: details.trace?.evidence || null,
    reason: whyLine(product, details) || '',
    note: PARTNER_NOTE,
  };
}
