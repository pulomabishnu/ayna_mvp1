/** Aggregate CSV export: counts, denominators and versions only. No scenario-level or product-text rows beyond names. */
const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function rollupCsv(data) {
  const b = data?.brand;
  if (!b) return '';
  const r = data.run;
  const rows = [['brand', 'run_id', 'created_at', 'scenario_set', 'category', 'metric', 'numerator', 'denominator', 'value_pct', 'note']];
  const push = (cat, metric, num, den, pct, note = '') => rows.push([b.displayName || b.name, r.runId, r.createdAt, r.scenarioSetVersion, cat, metric, num, den, pct, note]);
  for (const c of b.categories || []) {
    push(c.label, 'slot_share', c.brandSlots, c.slots, c.slotShare, 'synthetic benchmark');
    push(c.label, 'scenario_inclusion', c.inclusion.num, c.inclusion.den, c.inclusion.pct, 'synthetic benchmark');
    push(c.label, 'eligible_to_placed', c.eligibleToPlaced.num, c.eligibleToPlaced.den, c.eligibleToPlaced.pct, 'synthetic benchmark');
    push(c.label, 'no_result_scenarios', c.noResult.num, c.noResult.den, c.noResult.pct, 'synthetic benchmark');
    for (const x of c.funnel.reasons) push(c.label, `loss_reason:${x.id}`, x.n, c.funnel.eligible_lost, x.share, 'primary reason');
  }
  const m = b.evidence?.metrics;
  if (m) {
    push('all', 'claim_review_coverage', m.reviewCoverage.num, m.reviewCoverage.den, m.reviewCoverage.value == null ? '' : Math.round(m.reviewCoverage.value * 1000) / 10, 'human-reviewed claims');
    push('all', 'information_completeness_median', '', '', m.completeness.mine, `peer median ${m.completeness.peerMedian}`);
  }
  return rows.map((row) => row.map(esc).join(',')).join('\n') + '\n';
}
