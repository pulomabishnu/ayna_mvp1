/**
 * How connected health data reaches Health Match.
 *
 * Priority (from the founders' brief):
 *   what she told us  >  safety / life stage  >  health-data context  >  other preferences
 *
 * So health data:
 * - NEVER creates a need. The matching engine's own rule is that needs are
 *   only what she selected or typed (src/matching/userProfile.js).
 * - NEVER weakens a need she chose. A good week of sleep does not mean she
 *   was wrong about her sleep.
 * - STRENGTHENS a need she chose when a trend (not one night) supports it.
 *   That is the `corroborated` flag the v2 engine reads (src/matching/v2.js).
 * - For a need she did NOT choose, only ever SUGGESTS: "Add sleep to your
 *   goals?" She decides.
 * - Is never read by Browse ranking, partner placement, ads or reporting.
 */

/**
 * @param {Array} signals   buildInsights(...).signals
 * @param {Array<string>} selectedNeedIds  needs she chose in the intake
 * @returns {{ byNeed: Record<string, {summary, sources, metric}>, suggestions: Array }}
 */
// Goals we offer to add only when her data shows the thing itself (shorter
// sleep for sleep, varying cycle lengths for cycles). Heart rate or readiness
// changes never become a suggested goal like "low energy": that would read as
// a guess about how she feels. They still back up a goal she already chose.
const SUGGESTABLE = new Set(['sleep.trouble', 'cycle.irregular']);

export function healthMatchContext(signals = [], selectedNeedIds = []) {
  const chosen = new Set(selectedNeedIds);
  const byNeed = {};
  const suggestions = [];
  for (const s of signals) {
    if (!s?.needId) continue;
    const isTiming = s.kind === 'timing';
    const entry = { kind: isTiming ? 'timing' : 'trend', summary: s.summary, sources: s.sources || [], metric: s.metric, section: s.section };
    if (isTiming) entry.timing = { timing: s.timing, daysUntil: s.daysUntil, summary: s.summary, cite: s.cite || null };
    if (chosen.has(s.needId)) {
      const had = byNeed[s.needId];
      if (!had) byNeed[s.needId] = entry;
      // A trend and a timing fact for the same need: keep the trend as the
      // headline and carry the timing with it.
      else if (isTiming && !had.timing) had.timing = entry.timing;
    } else if (!isTiming && SUGGESTABLE.has(s.needId) && !suggestions.some((x) => x.needId === s.needId)) {
      // Timing never becomes a suggested goal: "your period is due" is not a reason to add one.
      suggestions.push({ needId: s.needId, ...entry });
    }
  }
  return { byNeed, suggestions };
}

const join = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] || '');

/** The line shown on Why this match when health data made a need more relevant. */
export function whyLine(context, sourceName = (id) => id) {
  if (!context) return null;
  const from = join((context.sources || []).map(sourceName));
  const tail = from ? ` From ${from}.` : '';
  if (context.kind === 'timing') {
    return { text: 'Your cycle timing moved this up', detail: `${context.summary}, so things you use around your period come first.${tail}`, cite: context.timing?.cite || null };
  }
  const timing = context.timing ? ` ${context.timing.summary}, too.` : '';
  return { text: 'Your recent trends made this more relevant to you', detail: `${context.summary}.${timing}${tail}` };
}

/** Short badge words for a pick on a need her data backs ("Backed by your sleep data"). */
const SECTION_WORD = { sleep: 'sleep', cycle: 'cycle', heart: 'heart', recovery: 'recovery' };
export function badgeText(context) {
  if (!context) return null;
  return `Backed by your ${SECTION_WORD[context.section] || 'health'} data`;
}
