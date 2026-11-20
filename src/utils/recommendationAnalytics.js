import posthog from 'posthog-js';
import { useEffect } from 'react';
import { isPartnerBrandItem } from './partnerBrands.js';

/**
 * recommendation_viewed: one event per recommended product shown, with
 * productId, category, position (1-based) and surface. It had been a single
 * event fired from MyEcosystem's auto-build step (with only a count), which
 * stopped running once that step began vetting picks (Sept), so views went
 * unlogged while ai_recommendations_completed kept firing.
 *
 * Each product is logged once per surface per page load, so re-renders,
 * toggles and swaps don't inflate the count. No concern or health text is
 * sent, only catalog fields.
 */
const seen = new Set();
const MAX_POSITIONS = 24;

/**
 * Match % as a coarse band (never the exact score), so "do higher matches
 * work better?" can be answered without sending anything health-derived.
 * 'none' = the surface didn't attach a match % to this product.
 */
export function matchScoreBucket(p) {
  const raw = [p?.matchPercent, p?.matchPercentage, p?._match].find((v) => Number.isFinite(Number(v)) && v !== null && v !== '');
  const n = Number(raw);
  if (raw === undefined || !Number.isFinite(n) || n <= 0) return 'none';
  if (n >= 90) return '90+';
  if (n >= 75) return '75-89';
  if (n >= 50) return '50-74';
  return 'under_50';
}

export function recommendationViewEvents(products, surface) {
  const out = [];
  (Array.isArray(products) ? products : []).slice(0, MAX_POSITIONS).forEach((p, i) => {
    if (!p?.id) return;
    out.push({
      productId: String(p.id),
      product_id: String(p.id),
      category: p.category ? String(p.category) : 'unknown',
      position: i + 1,
      rank: i + 1,
      brand_id: p.brand ? String(p.brand).slice(0, 64) : undefined,
      is_partner: isPartnerBrandItem(p),
      match_score_bucket: matchScoreBucket(p),
      surface,
    });
  });
  return out;
}

export function trackRecommendationViews(products, surface, extra = {}) {
  for (const props of recommendationViewEvents(products, surface)) {
    const key = `${surface}:${props.productId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try { posthog.capture('recommendation_viewed', { ...props, ...extra }); } catch { /* analytics never blocks */ }
  }
}

/** Hook form: logs when the list (by its ids, in order) changes. */
export function useRecommendationViews(products, surface, { enabled = true, extra } = {}) {
  const key = enabled && Array.isArray(products) ? products.map((p) => p?.id).filter(Boolean).join('|') : '';
  useEffect(() => {
    if (!key) return;
    trackRecommendationViews(products, surface, extra);
    // The id list is the dependency: same products in the same order = same views.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, surface]);
}

/** Tests only. */
export function _resetRecommendationViews() { seen.clear(); }

/**
 * Match quality (Nov 19, analytics gap report P0): one summary per results page.
 * Counts only, never which need or anything about her health:
 *   recommendation_shelves_shown { shelves_count, picks_count, full_count, short_count,
 *     empty_count, held_count, care_first_count, empty_reasons, surface, where }
 * "full" = 3+ picks, "short" = 1-2, "empty" = none. empty_reasons is a sorted list of the
 * engine's own reason codes (care_first, needs_safety_details, ...), so "why are shelves empty?"
 * can be answered without a person's details.
 */
const EMPTY_REASONS = new Set(['care_first', 'needs_safety_details', 'clinician_first_for_stage', 'no_product_meets_quality_bar', 'no_matching_products']);
export function shelfQualitySummary(shelves = [], rows = []) {
  const list = Array.isArray(shelves) ? shelves : [];
  const counts = (Array.isArray(rows) && rows.length === list.length ? rows : list).map((r, i) => {
    const n = Array.isArray(r.products) || Array.isArray(r.services)
      ? (r.products || []).length + (r.services || []).length
      : (list[i]?.productIds || list[i]?.picks || []).length;
    return { n, held: Boolean(r.held), care: Boolean(r.careFirst) || list[i]?.emptyReason === 'care_first' };
  });
  const reasons = [...new Set(list.map((s) => s?.emptyReason).filter((r) => EMPTY_REASONS.has(r)))].sort();
  return {
    shelves_count: counts.length,
    picks_count: counts.reduce((a, c) => a + c.n, 0),
    full_count: counts.filter((c) => c.n >= 3).length,
    short_count: counts.filter((c) => c.n > 0 && c.n < 3).length,
    empty_count: counts.filter((c) => c.n === 0).length,
    held_count: counts.filter((c) => c.held).length,
    care_first_count: counts.filter((c) => c.care).length,
    empty_reasons: reasons.join(',') || 'none',
  };
}

const shelfSeen = new Set();
export function trackShelfQuality(summary, { surface = 'web', where = 'reveal' } = {}, capture = (e, p) => posthog.capture(e, p)) {
  if (!summary || !summary.shelves_count) return;
  const key = `${surface}:${where}:${JSON.stringify(summary)}`;
  if (shelfSeen.has(key)) return;
  shelfSeen.add(key);
  try { capture('recommendation_shelves_shown', { ...summary, surface, where }); } catch { /* analytics never blocks */ }
}
/** Tests only. */
export function _resetShelfQuality() { shelfSeen.clear(); }
