import { INTERVENTION_CLASSES } from '../../health/interventions.js';
import { daysBetweenDays } from '../../health/dailyLog.js';
import { tryStatus } from '../../health/outcomes.js';
import { getProductById } from '../../data/catalog.js';

/**
 * "1 of 3 done today" with dots (audit v2 section 11: Pai's "Today 2/6",
 * GlowCare's "0/4 step"; endowed progress). Real data only: the items ayna
 * showed today and the ones she acted on today (decisionEngine's seen map).
 */
export function todayProgress(items, t) {
  const seen = t.store?.seen || {};
  const shownToday = Object.entries(seen).filter(([, s]) => (s.shownDays || []).includes(t.today));
  const done = new Set(shownToday.filter(([, s]) => s.lastInteracted === t.today).map(([id]) => id));
  const all = new Set([...items.map((i) => i.id), ...done]);
  return { done: [...all].filter((id) => done.has(id)).length, total: all.size };
}


/** What she is trying now, as "Day 7 of 21" (Elure's routine ring): tries not yet due or answered. */
export function triesInProgress(tries = [], today) {
  return (tries || []).filter((x) => x?.startedDay && !x.outcome && tryStatus(x, today) === 'pending').map((x) => {
    const cls = INTERVENTION_CLASSES[x.ref];
    const name = cls ? cls.label : x.kind === 'product' ? getProductById(x.ref)?.name || null : null;
    const day = Math.max(1, daysBetweenDays(x.startedDay, today) + 1);
    return name ? { id: x.id, name, day: Math.min(day, x.horizonDays), of: x.horizonDays } : null;
  }).filter(Boolean).slice(0, 3);
}
