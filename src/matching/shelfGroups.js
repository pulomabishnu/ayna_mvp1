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
  { id: 'mood', needs: ['mood.swings', 'mood.irritability', 'mood.cycle_related', 'mood.pmdd'], name: () => 'Mood swings and irritability' },
  { id: 'pms', needs: ['cycle.pms', 'bloating.cycle_related'], name: () => 'PMS and bloating' },
  { id: 'vaginal', needs: ['vaginal.odor', 'vaginal.discharge', 'vaginal.bv'], name: () => 'Odor, discharge and BV' },
  { id: 'bladder', needs: ['urinary.urgency', 'urinary.frequency', 'urinary.incontinence'], name: () => 'Bladder control and leaks' },
  { id: 'uti', needs: ['urinary.burning', 'urinary.recurrent_uti'], name: () => 'UTIs' },
  { id: 'gut', needs: ['digestive.gas', 'bloating.digestive', 'digestive.nausea', 'pain.abdominal', 'digestive.constipation', 'digestive.diarrhea'], name: () => 'Gut and bloating' },
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
      members: members.map((m) => ({ needId: m.needId, label: m.label, productIds: (m.picks || []).map((p) => p.productId) })),
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

/* ---- Team grouping from main (Nov 6-7, "Mental wellbeing", "Temperature & sweating", ...) ----
   Presentation groups only. Matching, safety, and product eligibility stay at the individual need
   level before shelves are combined for display. A shelf already grouped above (it has `groupId`)
   joins the team group of the same theme, so the two passes never split or double one theme. */
const TEAM_GROUP_OF_SHELF_GROUP = { mood: 'mood.swings', heat: 'vasomotor.hot_flashes', pms: 'cycle.pms', gut: 'digestive.gas' };
export function symptomShelfGroup(needId, groupId = null) {
  const id = groupId && TEAM_GROUP_OF_SHELF_GROUP[groupId] ? TEAM_GROUP_OF_SHELF_GROUP[groupId] : String(needId);
  if (id.startsWith('mood.')) return { key: 'mental-wellbeing', label: 'Mental wellbeing' };
  if (id.startsWith('vasomotor.')) return { key: 'temperature-sweating', label: 'Temperature & sweating' };
  if (id === 'bloating.cycle_related' || id === 'cycle.pms') return { key: 'period-pms', label: 'Period & PMS' };
  if (id === 'digestive.nausea' || id === 'bloating.digestive' || id === 'digestive.gas') return { key: 'digestive-comfort', label: 'Digestive comfort' };
  return null;
}
const mergeMembers = (target, src) => {
  const add = src.members || [{ needId: src.needId || src.id, label: src.label, productIds: (src.productIds || (src.products || []).map((p) => p.id)) }];
  for (const m of add) if (!target.members.some((x) => x.needId === m.needId)) target.members.push(m);
  target.memberLabels = target.members.map((m) => m.label);
};

// Keep each need's eligibility and safety decision; combine only what the reveal shows.
export function groupRevealRows(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const group = symptomShelfGroup(row.id, row.groupId);
    const key = group?.key || row.id;
    if (!groups.has(key)) groups.set(key, { ...row, id: key, label: group?.label || row.label, products: [], services: [], sourceNeedIds: [], members: [], heldWhy: '', why: '' });
    const target = groups.get(key);
    target.sourceNeedIds.push(...(row.needIds || [row.id]));
    mergeMembers(target, row);
    for (const type of ['products', 'services']) for (const product of row[type] || []) {
      if (!target[type].some((item) => item.id === product.id)) target[type].push(product);
    }
    target.needsAnswers ||= row.needsAnswers;
    target.held ||= row.held;
    target.careFirst ||= row.careFirst;
    target.heldWhy ||= row.heldWhy;
    target.why ||= row.why;
  }
  return [...groups.values()].filter((row) => row.products.length || row.services.length || row.held || row.careFirst || row.why);
}

export function groupSymptomShelves(shelves = []) {
  const groups = new Map();
  for (const shelf of shelves) {
    const group = symptomShelfGroup(shelf.needId, shelf.groupId);
    const key = group?.key || shelf.needId;
    if (!groups.has(key)) groups.set(key, { ...shelf, needId: key, label: group?.label || shelf.label, sourceNeedIds: [], members: [], picks: [], productIds: [] });
    const target = groups.get(key);
    target.sourceNeedIds.push(...(shelf.needIds || [shelf.needId]));
    mergeMembers(target, shelf);
    for (const pick of shelf.picks || []) {
      if (!target.picks.some((item) => item.productId === pick.productId)) target.picks.push(pick);
    }
    for (const id of shelf.productIds || []) {
      if (!target.productIds.includes(id)) target.productIds.push(id);
    }
  }
  return [...groups.values()];
}
