/**
 * Her top symptom this month, from her own log only (focus group: Zoleka, Nov 11, "one main takeaway,
 * like Oura"; UCLA, Oct 1, "top symptom this month"). Trends against other people wait until there
 * are enough people for a fair comparison. Pure; tested.
 */
const RULES = [
  { id: 'pain', noun: 'pain', bad: (v) => Number(v) >= 1 },
  { id: 'pms', noun: 'PMS', bad: (v) => Number(v) >= 1 },
  { id: 'sleep', noun: 'rough sleep', bad: (v) => Number(v) === 1 },
  { id: 'energy', noun: 'low energy', bad: (v) => Number(v) === 1 },
  { id: 'mood', noun: 'low mood', bad: (v) => Number(v) === 1 },
  { id: 'skin', noun: 'skin flares', bad: (v) => Number(v) === 1 },
];

/** { field, noun, days, logged, month } or null when nothing worse than usual was logged this month. */
export function monthTopSymptom(log = {}, today = new Date().toISOString().slice(0, 10)) {
  const month = String(today).slice(0, 7);
  const days = Object.entries(log || {}).filter(([d]) => d.startsWith(month));
  const logged = days.filter(([, e]) => e && RULES.some((r) => e[r.id] != null)).length;
  if (!logged) return null;
  let best = null;
  for (const r of RULES) {
    const n = days.filter(([, e]) => e && e[r.id] != null && r.bad(e[r.id])).length;
    if (n > 0 && (!best || n > best.days)) best = { field: r.id, noun: r.noun, days: n };
  }
  return best ? { ...best, logged, month } : null;
}

/** The one-line takeaway. */
export function takeawayLine(top) {
  if (!top) return '';
  return `${top.noun.charAt(0).toUpperCase()}${top.noun.slice(1)} on ${top.days} of the ${top.logged} ${top.logged === 1 ? 'day' : 'days'} you logged this month.`;
}
