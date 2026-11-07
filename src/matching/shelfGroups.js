// Presentation groups only. Matching, safety, and product eligibility stay at
// the individual need level before shelves are combined for display.
export function symptomShelfGroup(needId) {
  if (String(needId).startsWith('mood.')) return { key: 'mental-wellbeing', label: 'Mental wellbeing' };
  if (String(needId).startsWith('vasomotor.')) return { key: 'temperature-sweating', label: 'Temperature & sweating' };
  if (needId === 'bloating.cycle_related' || needId === 'cycle.pms' || needId === 'hormonal.general') return { key: 'period-pms', label: 'Period & PMS' };
  if (needId === 'digestive.nausea' || needId === 'bloating.digestive' || needId === 'digestive.gas') return { key: 'digestive-comfort', label: 'Digestive comfort' };
  return null;
}

// Keep each need's eligibility and safety decision; combine only what the reveal shows.
export function groupRevealRows(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const group = symptomShelfGroup(row.id);
    const key = group?.key || row.id;
    if (!groups.has(key)) groups.set(key, { ...row, id: key, label: group?.label || row.label, products: [], services: [], sourceNeedIds: [], heldWhy: '', why: '' });
    const target = groups.get(key);
    target.sourceNeedIds.push(row.id);
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
    const group = symptomShelfGroup(shelf.needId);
    const key = group?.key || shelf.needId;
    if (!groups.has(key)) groups.set(key, { ...shelf, needId: key, label: group?.label || shelf.label, sourceNeedIds: [], picks: [], productIds: [] });
    const target = groups.get(key);
    target.sourceNeedIds.push(shelf.needId);
    for (const pick of shelf.picks || []) {
      if (!target.picks.some((item) => item.productId === pick.productId)) target.picks.push(pick);
    }
    for (const id of shelf.productIds || []) {
      if (!target.productIds.includes(id)) target.productIds.push(id);
    }
  }
  return [...groups.values()];
}
