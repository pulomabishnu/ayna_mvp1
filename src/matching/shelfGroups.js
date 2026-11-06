// Presentation groups only. Matching, safety, and product eligibility stay at
// the individual need level before shelves are combined for display.
export function symptomShelfGroup(needId) {
  if (String(needId).startsWith('mood.')) return { key: 'mental-wellbeing', label: 'Mental wellbeing' };
  if (String(needId).startsWith('vasomotor.')) return { key: 'temperature-sweating', label: 'Temperature & sweating' };
  return null;
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
