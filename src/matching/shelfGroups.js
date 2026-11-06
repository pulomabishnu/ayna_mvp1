/**
 * Shelf groups for display (Nov 6, founder: "shouldn't these just categorize together … think of
 * shelf names"). Needs that one set of products serves sit on one shelf with a plain name, so
 * "Period product support" and "Heavy periods", or "Hot flashes" and "Night sweats", don't repeat
 * the same products in two rows. The engine still scores each need on its own; this only groups
 * what she sees. One member alone keeps its own name.
 */
export const SHELF_GROUPS = [
  { id: 'period', needs: ['period.product_support', 'period.heavy', 'period.light'],
    name: (ids) => (ids.includes('period.heavy') ? 'Period products for a heavy flow' : ids.includes('period.light') ? 'Period products for a light flow' : 'Period products') },
  { id: 'pain', needs: ['pain.menstrual_cramp', 'pain.pelvic', 'pain.cycle_headache'], name: () => 'Cramps and period pain' },
  { id: 'heat', needs: ['vasomotor.hot_flashes', 'vasomotor.night_sweats'], name: () => 'Hot flashes and night sweats' },
  { id: 'mood', needs: ['cycle.pms', 'mood.swings', 'mood.irritability', 'mood.cycle_related', 'mood.pmdd'], name: (ids) => (ids.includes('cycle.pms') ? 'PMS and mood' : 'Mood swings and irritability') },
  { id: 'vaginal', needs: ['vaginal.odor', 'vaginal.discharge', 'vaginal.bv'], name: () => 'Odor, discharge and BV' },
  { id: 'bladder', needs: ['urinary.urgency', 'urinary.frequency', 'urinary.incontinence'], name: () => 'Bladder control and leaks' },
  { id: 'uti', needs: ['urinary.burning', 'urinary.recurrent_uti'], name: () => 'UTIs' },
  { id: 'gut', needs: ['digestive.gas', 'bloating.digestive', 'pain.abdominal', 'digestive.constipation', 'digestive.diarrhea'], name: () => 'Gut and bloating' },
  { id: 'focus', needs: ['cognition.brain_fog', 'cognition.concentration', 'energy.fatigue'], name: () => 'Focus and energy' },
  { id: 'fertility', needs: ['fertility.support', 'fertility.ttc', 'fertility.ovulation_tracking'], name: () => 'Trying to conceive' },
];
const GROUP_OF = new Map(SHELF_GROUPS.flatMap((g) => g.needs.map((n) => [n, g])));

/** Group a seed's shelves (getEcosystemSeedFromQuiz().shelves) for display. Order follows the first member. */
export function groupShelves(shelves = []) {
  const out = [];
  const byGroup = new Map();
  for (const sh of shelves || []) {
    const g = GROUP_OF.get(sh?.needId);
    if (!g) { out.push(sh); continue; }
    if (!byGroup.has(g.id)) { const slot = { g, members: [] }; byGroup.set(g.id, slot); out.push(slot); }
    byGroup.get(g.id).members.push(sh);
  }
  return out.map((x) => {
    if (!x.g) return x;
    const { g, members } = x;
    if (members.length === 1) return members[0];
    const ids = members.map((m) => m.needId);
    const best = new Map();
    for (const m of members) for (const p of m.picks || []) if (!best.has(p.productId) || (p.score ?? 0) > (best.get(p.productId).score ?? 0)) best.set(p.productId, p);
    const picks = [...best.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const first = members[0];
    const empty = !picks.length;
    return {
      ...first,
      label: g.name(ids),
      groupId: g.id,
      needIds: ids,
      memberLabels: members.map((m) => m.label),
      picks,
      productIds: picks.map((p) => p.productId),
      shortBy: 0,
      emptyReason: empty ? first.emptyReason : null,
      qualityNote: empty ? first.qualityNote : null,
      careFirst: members.some((m) => m.careFirst),
      careProminent: members.some((m) => m.careProminent),
      restrictedCount: members.reduce((n, m) => n + (m.restrictedCount || 0), 0),
    };
  });
}
