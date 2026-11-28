/**
 * Recommendation Share and Lost Recommendation metrics (Phase 1 plan, pp.8-11).
 * Pure functions over benchmark results. Every rate keeps its numerator and
 * denominator; a rate with a zero denominator is null ("N/A"), never 0.
 *
 * Result shape, one per scenario:
 *   { scenarioId, weight, placements: [{ sku, brand }], candidates: [{ sku, brand, stage }] }
 * stage per SKU: 'selected' | 'eligible_lost' | 'insufficient_info' | 'excluded' | 'out_of_scope'
 */

export const STAGES = ['selected', 'eligible_lost', 'insufficient_info', 'excluded', 'out_of_scope'];

/** Brand x scenario precedence (p.10): selected > eligible loss > insufficient information > excluded > out of scope. */
export function brandOutcome(result, brand) {
  const mine = (result.candidates || []).filter((c) => c.brand === brand);
  for (const stage of STAGES) if (mine.some((c) => c.stage === stage)) return stage;
  return 'out_of_scope';
}

export function rate(num, den) {
  return den > 0 ? { num, den, value: num / den } : { num, den, value: null };
}

/**
 * @param {object[]} results scenario results
 * @param {string} brand
 */
export function recommendationShare(results, brand) {
  let slots = 0;
  let brandSlots = 0;
  let wSlots = 0;
  let wBrand = 0;
  let included = 0;
  let eligible = 0;
  let eligiblePlaced = 0;
  let noResult = 0;
  let unfilled = 0;
  let k = 0;
  for (const r of results) {
    const w = r.weight ?? 1;
    const n = r.placements.length;
    const b = r.placements.filter((p) => p.brand === brand).length;
    k = Math.max(k, r.k ?? n);
    slots += n;
    brandSlots += b;
    wSlots += w * n;
    wBrand += w * b;
    if (n === 0) noResult += 1;
    unfilled += Math.max(0, (r.k ?? n) - n);
    if (b > 0) included += 1;
    const out = brandOutcome(r, brand);
    const isEligible = out === 'selected' || out === 'eligible_lost';
    if (isEligible) {
      eligible += 1;
      if (out === 'selected') eligiblePlaced += 1;
    }
  }
  return {
    scenarios: results.length,
    k,
    slots,
    brandSlots,
    unfilled,
    slotShare: rate(brandSlots, slots),
    weightedSlotShare: wSlots > 0 ? wBrand / wSlots : null,
    inclusion: rate(included, results.length),
    eligible: rate(eligible, results.length),
    eligibleToPlaced: rate(eligiblePlaced, eligible),
    noResult: rate(noResult, results.length),
  };
}

/** Slot counts for every brand, highest first. Used for rank only. */
export function brandSlotTable(results) {
  const m = new Map();
  for (const r of results) for (const p of r.placements) m.set(p.brand, (m.get(p.brand) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

/** 1-based rank by slots (ties share a rank); null when the brand has no slots. */
export function brandRank(results, brand) {
  const table = brandSlotTable(results);
  const mine = table.find(([b]) => b === brand);
  if (!mine) return { rank: null, of: table.length };
  return { rank: table.filter(([, n]) => n > mine[1]).length + 1, of: table.length };
}

/**
 * The eligibility funnel and primary loss reasons (p.11). Primary reasons
 * sum exactly to eligible-but-not-placed scenarios.
 * Each result's candidates carry `reason` on eligible losses.
 */
export function lossFunnel(results, brand) {
  const counts = { in_scope: 0, eligible: 0, placed: 0, eligible_lost: 0, insufficient_info: 0, excluded: 0, out_of_scope: 0 };
  const reasons = {};
  const examples = [];
  for (const r of results) {
    const out = brandOutcome(r, brand);
    if (out === 'out_of_scope') { counts.out_of_scope += 1; continue; }
    counts.in_scope += 1;
    if (out === 'selected') { counts.eligible += 1; counts.placed += 1; continue; }
    if (out === 'eligible_lost') {
      counts.eligible += 1;
      counts.eligible_lost += 1;
      const best = r.candidates.filter((c) => c.brand === brand && c.stage === 'eligible_lost').sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0];
      const reason = best?.reason || 'unclassified';
      reasons[reason] = (reasons[reason] || 0) + 1;
      const sameReason = examples.filter((e) => e.reason === reason).length;
      if (examples.length < 8 && sameReason < 2) examples.push({ scenarioId: r.scenarioId, label: r.label, sku: best?.sku, reason, detail: best?.detail || null, placed: r.placements.map((p) => p.name || p.sku) });
      continue;
    }
    counts[out] += 1;
  }
  return { counts, reasons, examples, check: Object.values(reasons).reduce((a, b) => a + b, 0) === counts.eligible_lost };
}

/** Per-SKU placement counts, stage mix and loss reasons. */
export function skuBreakdown(results, brand) {
  const m = new Map();
  for (const r of results) {
    for (const c of r.candidates) {
      if (c.brand !== brand) continue;
      const row = m.get(c.sku) || { sku: c.sku, name: c.name, selected: 0, eligible_lost: 0, insufficient_info: 0, excluded: 0, out_of_scope: 0, reasons: {} };
      row[c.stage] += 1;
      // Per-product loss reasons (p.11 drill-down): why this SKU missed when it was eligible.
      if (c.stage === 'eligible_lost') { const k = c.reason || 'unclassified'; row.reasons[k] = (row.reasons[k] || 0) + 1; }
      m.set(c.sku, row);
    }
  }
  return [...m.values()].sort((a, b) => b.selected - a.selected || String(a.name).localeCompare(String(b.name)));
}

/** Slot share range across subsets (e.g. budget bands). Sensitivity, not a confidence interval. */
export function sensitivityRange(results, brand, keyOf) {
  const groups = new Map();
  for (const r of results) { const k = keyOf(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const rows = [...groups.entries()].map(([key, rs]) => ({ key, ...recommendationShare(rs, brand) }));
  const vals = rows.map((x) => x.slotShare.value).filter((v) => v != null);
  return { rows, min: vals.length ? Math.min(...vals) : null, max: vals.length ? Math.max(...vals) : null };
}
