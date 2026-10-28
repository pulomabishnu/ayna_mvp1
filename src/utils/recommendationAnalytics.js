import posthog from 'posthog-js';
import { useEffect } from 'react';
import { isPartnerBrandItem } from './partnerBrands.js';
import {
  ALGORITHM_VERSION,
  analyticsId,
  ensureAnalyticsContext,
  matchScoreBucket,
  rememberRecommendationContext,
} from './analyticsEvents.js';

/**
 * Recommendation telemetry for PR88+.
 *
 * We need a real denominator for algorithm and brand reporting, so every
 * rendered recommendation gets an impression event. A recommendation run id
 * ties the set together. Only catalog/decision metadata is sent: never health
 * answers, symptoms, Ask text, wearable values, or profile free text.
 */
const seen = new Set();
const seenRuns = new Set();
const MAX_POSITIONS = 24;

function hash(value) {
  let h = 2166136261;
  const s = String(value || '');
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function scoreFor(p) {
  const candidates = [p?.matchPercent, p?.matchPercentage, p?.match_score, p?.matchScore, p?.score, p?.percent];
  return candidates.find((v) => Number.isFinite(Number(v)));
}

function runContext(products, surface, extra = {}) {
  const list = (Array.isArray(products) ? products : []).slice(0, MAX_POSITIONS);
  const ids = list.map((p) => p?.id).filter(Boolean).join('|');
  const algorithmVersion = analyticsId(extra.algorithm_version || extra.match_engine || ALGORITHM_VERSION, ALGORITHM_VERSION);
  const derivedHealthApplied = list.some((p) => Boolean(p?.healthBacked || p?.healthData || p?.healthShaped));
  return {
    recommendation_run_id: `rec_${hash(`${surface}|${algorithmVersion}|${ids}`)}`,
    algorithm_version: algorithmVersion,
    health_data_enabled: Boolean(extra.health_data_enabled || extra.healthMatchEnabled),
    health_data_applied: Boolean(extra.health_data_applied || extra.health_shaped || derivedHealthApplied),
  };
}

export function recommendationViewEvents(products, surface, extra = {}) {
  const run = runContext(products, surface, extra);
  const out = [];
  (Array.isArray(products) ? products : []).slice(0, MAX_POSITIONS).forEach((p, i) => {
    if (!p?.id) return;
    const score = scoreFor(p);
    out.push({
      // Keep old names so existing dashboards continue to work.
      productId: String(p.id),
      category: p.category ? String(p.category) : 'unknown',
      position: i + 1,
      surface,

      // Canonical PR88+ names for algorithm/brand reporting.
      product_id: String(p.id),
      brand_id: analyticsId(p.brand),
      is_partner: Boolean(isPartnerBrandItem(p)),
      rank: i + 1,
      match_score_bucket: matchScoreBucket(score),
      product_health_backed: Boolean(p?.healthBacked || p?.healthData),
      ...run,
    });
  });
  return out;
}

export function trackRecommendationViews(products, surface, extra = {}) {
  ensureAnalyticsContext();
  const rows = recommendationViewEvents(products, surface, extra);
  if (!rows.length) return;
  const run = rows[0];

  if (!seenRuns.has(run.recommendation_run_id)) {
    seenRuns.add(run.recommendation_run_id);
    try {
      posthog.capture('recommendation_run_completed', {
        recommendation_run_id: run.recommendation_run_id,
        algorithm_version: run.algorithm_version,
        surface,
        recommendation_count: rows.length,
        health_data_enabled: run.health_data_enabled,
        health_data_applied: run.health_data_applied,
        match_engine: extra.match_engine,
      });
    } catch { /* analytics never blocks */ }
  }

  for (const props of rows) {
    const key = `${props.recommendation_run_id}:${props.product_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Keep the recommendation context in memory so a later product open/save/
    // routine add/Buy Now can be attributed back to this exact run and rank.
    rememberRecommendationContext(props.product_id, props);
    try {
      posthog.capture('recommendation_impression', props);
      // Keep the existing event alive for historical dashboards.
      posthog.capture('recommendation_viewed', {
        ...props,
        concernCount: Number.isFinite(Number(extra.concernCount)) ? Number(extra.concernCount) : undefined,
        match_engine: extra.match_engine,
      });
    } catch { /* analytics never blocks */ }
  }
}

/** Hook form: logs when the list (by its ids, in order) changes. */
export function useRecommendationViews(products, surface, { enabled = true, extra } = {}) {
  const key = enabled && Array.isArray(products) ? products.map((p) => p?.id).filter(Boolean).join('|') : '';
  useEffect(() => {
    if (!key) return;
    trackRecommendationViews(products, surface, extra);
    // The id list is the dependency: same products in the same order = same set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, surface]);
}

/** Tests only. */
export function _resetRecommendationViews() { seen.clear(); seenRuns.clear(); }
