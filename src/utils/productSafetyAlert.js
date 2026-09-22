/**
 * Whether `safety.recalls` describes a real, concrete recall/legal/contamination
 * concern rather than a boilerplate "no recalls" or "check the regulator
 * yourself" disclaimer.
 *
 * This used to be gated purely on a manually-added ⚠️ marker in the
 * recalls text (the convention ProductModal.jsx, Discovery.jsx, and
 * Recommendations.jsx each checked independently). As of 2026-09-22, zero
 * products in the catalog carry that marker any more — a data regression that
 * silently turned every consumer of it dark: Discovery's safety scoring, the
 * Recommendations "Safety note" badge, and ProductModal's safety banner all
 * stopped firing for real, already-written concerns (Always Infinity's PFAS
 * coverage, Thinx's PFAS lawsuit, Cora's PFAS finding, a nursing-pillow
 * recall) without anyone noticing, because nothing looked broken.
 *
 * Rather than re-litigate a marker nobody maintains, this detects the concern
 * from the text's own content: an explicit keyword (PFAS, lawsuit, class
 * action, settlement, contamination) or a recall mentioned near a year. It
 * still honors the legacy marker if a curator ever adds one back. It never
 * flags a bare "no recalls" / "check current recall notices"-style disclaimer,
 * since those don't contain any of these signals — only ever adds visibility
 * to a concern that's already written in the catalog, never invents one.
 */
// (?<!zero |no |not |without )pfas(?!-?\s?free) excludes reassurances like
// "Zero PFAS detected" and "PFAS-free" — those are exactly the boilerplate
// this function must NOT flag, and "pfas" alone can't distinguish "found
// PFAS" from "found zero PFAS" without looking at what's next to it.
const RECALL_CONCERN_RE = /(?<!\b(?:zero|no|not|without)\s)pfas(?!-?\s?free)|forever chemical|lawsuit|class[- ]?action|settlement|settled|contaminat|recall(?:ed)?\b[^.]{0,25}\b(?:19|20)\d{2}\b|\b(?:19|20)\d{2}\b[^.]{0,25}\brecall(?:ed)?\b/i;
const LEGACY_MARKER = '⚠️';

export function hasFlaggedRecall(recallsText) {
  const t = String(recallsText || '').trim();
  if (!t) return false;
  return t.includes(LEGACY_MARKER) || RECALL_CONCERN_RE.test(t);
}

/**
 * Surfaces a real, already-on-file safety/opinion concern (e.g. the Always
 * Pads PFAS controversy) regardless of which tab is active. A product with no
 * flagged recall returns null, so this only ever adds visibility to what the
 * catalog already documented.
 */
export function getSafetyAlertText(product) {
  const recalls = product?.safety?.recalls;
  if (!hasFlaggedRecall(recalls)) return null;
  return product?.safety?.opinionAlerts || recalls;
}

/**
 * The sentences behind the default "ayna Summary" card — never a live AI
 * call, so there's no loading state, quota, or paywall to show, and nothing
 * here is longer than what's actually on file.
 *
 * summary + effectiveness are written as marketing/performance copy for
 * every product, so without a third input this card reads as unqualified
 * positive even when the SAME catalog entry already has a well-documented
 * caveat on file in safety.opinionAlerts (split reviews, an irritation
 * pattern, a clinician caution) — found live on Honey Pot Herbal Pads,
 * 2026-09-22, but the field is populated across most of the catalog, so the
 * gap was universal, not one product's. Skipped when a flagged recall is
 * already surfacing this same text via the SafetyAlert banner above the
 * tabs, so it isn't shown twice on the same page.
 */
export function buildSummarySentences(product) {
  if (!product) return [];
  const balance = getSafetyAlertText(product) ? null : product.safety?.opinionAlerts;
  const parts = [product.summary, product.effectiveness, balance]
    .map((s) => (s || '').trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    const already = out.some((o) => o.toLowerCase() === p.toLowerCase() || o.toLowerCase().includes(p.slice(0, 30).toLowerCase()));
    if (!already) out.push(p);
  }
  return out.slice(0, 3);
}
