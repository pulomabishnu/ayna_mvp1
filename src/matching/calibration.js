// Calibration (P1, Oct 29).
//
// The Match % is "how well this fits what you told us", not a probability
// (MATCH_MEANING). It still has to MEAN something: Strong matches should help
// more often than Good ones, Good more than Partial. Calibration checks that
// against what people report back ("Helped" / "No change" / "Worse"...),
// following the reliability-diagram idea (Guo et al., ICML 2017) applied to
// bands instead of probabilities, with honest uncertainty (Wilson intervals)
// and a minimum sample before anything is claimed.
//
// Data: anonymous rows in public.match_outcome_samples (band, percent bucket,
// outcome, engine). No user id, no product id, no need: nothing that could be
// tied back to her health. Written by recordOutcomeSample() below.
import { getSupabaseClient } from '../utils/supabaseClient.js';

export const BANDS = ['strong', 'good', 'partial'];
export const MIN_SAMPLES = 30;
export const ENGINE_VERSION = 'v2-p0-2026-10-29';
const HELPED = new Set(['helpful']);
const COUNTED = new Set(['helpful', 'no_change', 'worse', 'side_effect', 'stopped']); // 'unsure' is not an answer

/** Band from a shown percent (same thresholds as fitLabel / bandFor). */
export function bandOfPercent(p) {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n >= 80 ? 'strong' : n >= 50 ? 'good' : 'partial';
}

/** Wilson score interval for k successes in n (95% by default). */
export function wilson(k, n, z = 1.96) {
  if (!n) return { low: 0, high: 1 };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { low: Math.max(0, c - h), high: Math.min(1, c + h) };
}

/**
 * @param {{band: string, outcome: string}[]} samples
 * @returns {{ band, n, helped, rate, low, high, enough, harm }[]}
 */
export function reliabilityTable(samples = []) {
  return BANDS.map((band) => {
    const rows = samples.filter((s) => s.band === band && COUNTED.has(s.outcome));
    const n = rows.length;
    const helped = rows.filter((s) => HELPED.has(s.outcome)).length;
    const harm = rows.filter((s) => s.outcome === 'worse' || s.outcome === 'side_effect').length;
    const { low, high } = wilson(helped, n);
    return { band, n, helped, rate: n ? helped / n : null, low, high, enough: n >= MIN_SAMPLES, harm, harmRate: n ? harm / n : null };
  });
}

/**
 * Plain verdict for the team. 'not_enough_data' until every band has
 * MIN_SAMPLES. 'inverted' when a lower band helps clearly more often than a
 * higher one (its interval sits entirely above): the bands are misleading
 * and need work. 'ok' otherwise.
 */
export function calibrationVerdict(table) {
  if (table.some((r) => !r.enough)) return { verdict: 'not_enough_data', detail: table.filter((r) => !r.enough).map((r) => `${r.band}: ${r.n}/${MIN_SAMPLES}`) };
  const by = Object.fromEntries(table.map((r) => [r.band, r]));
  const inverted = [];
  if (by.good.low > by.strong.high) inverted.push('good helps more than strong');
  if (by.partial.low > by.good.high) inverted.push('partial helps more than good');
  if (by.partial.low > by.strong.high) inverted.push('partial helps more than strong');
  return inverted.length ? { verdict: 'inverted', detail: inverted } : { verdict: 'ok', detail: [] };
}

/**
 * One anonymous outcome sample. Fire and forget; never blocks or throws.
 * Only a band she actually saw (scored) is recorded.
 */
export async function recordOutcomeSample({ details, outcome }, { client = getSupabaseClient() } = {}) {
  try {
    if (!client || !COUNTED.has(outcome) || details?.matchStatus !== 'scored') return false;
    const band = bandOfPercent(details.percent);
    if (!band) return false;
    const bucket = Math.min(90, Math.floor(Number(details.percent) / 10) * 10);
    const { error } = await client.from('match_outcome_samples').insert({ band, percent_bucket: bucket, outcome, engine: ENGINE_VERSION });
    return !error;
  } catch { return false; }
}
