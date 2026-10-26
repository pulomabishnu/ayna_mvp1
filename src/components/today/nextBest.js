/**
 * "Not helping" on a follow-up for a product (retention checklist d): the
 * next best match for her, from the one match engine (matchBreakdown), with
 * its reason. Same category as what she tried, never the product itself,
 * never one held back for safety, already tried, or marked not for her.
 * Null when nothing scores, so nothing is shown rather than a guess.
 */
import { ALL_PRODUCTS, getProductById, getProductMatchDetailsForProduct } from '../../data/catalog.js';
import { matchBreakdown } from '../../matching/matchBreakdown.js';

export const NOT_HELPING = new Set(['no_change', 'worse', 'side_effect']);

export function nextBestMatch(triedId, intake, { healthProfile = null, matchOpts, exclude = [] } = {}) {
  const tried = getProductById(triedId);
  if (!tried || !intake) return null;
  const skip = new Set([String(triedId), ...exclude.map(String)]);
  let best = null;
  for (const p of ALL_PRODUCTS || []) {
    if (!p?.id || skip.has(String(p.id)) || p.category !== tried.category) continue;
    let d = null;
    try { d = getProductMatchDetailsForProduct(p, intake, healthProfile, matchOpts); } catch { d = null; }
    if (!d || d.matchStatus !== 'scored' || !Number.isFinite(d.percent)) continue;
    if (d.recommendable === false || d.eligibility === 'restricted' || d.restricted === true) continue;
    if (['dismissed', 'tried', 'not_for_me'].includes(d.history)) continue;
    if (!best || d.percent > best.percent) best = { product: p, percent: d.percent };
  }
  if (!best) return null;
  const b = matchBreakdown(best.product, intake, { healthProfile, matchOpts });
  if (!b || !Number.isFinite(b.percent)) return null;
  return { product: best.product, percent: b.percent, label: b.label, reason: b.reason, triedName: tried.name };
}
