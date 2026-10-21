import posthog from 'posthog-js';
import { useEffect } from 'react';

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

export function recommendationViewEvents(products, surface) {
  const out = [];
  (Array.isArray(products) ? products : []).slice(0, MAX_POSITIONS).forEach((p, i) => {
    if (!p?.id) return;
    out.push({
      productId: String(p.id),
      category: p.category ? String(p.category) : 'unknown',
      position: i + 1,
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
