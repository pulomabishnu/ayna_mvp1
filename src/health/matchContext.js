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
export function healthMatchContext(signals = [], selectedNeedIds = []) {
  const chosen = new Set(selectedNeedIds);
  const byNeed = {};
  const suggestions = [];
  for (const s of signals) {
    if (!s?.needId) continue;
    const entry = { summary: s.summary, sources: s.sources || [], metric: s.metric, section: s.section };
    if (chosen.has(s.needId)) {
      if (!byNeed[s.needId]) byNeed[s.needId] = entry;
    } else if (!suggestions.some((x) => x.needId === s.needId)) {
      suggestions.push({ needId: s.needId, ...entry });
    }
  }
  return { byNeed, suggestions };
}

/** The line shown on Why this match when health data made a need more relevant. */
export function whyLine(context, sourceName = (id) => id) {
  if (!context) return null;
  const from = context.sources.map(sourceName).join(' and ');
  return { text: 'Your recent trends made this more relevant to you', detail: `${context.summary}.${from ? ` From ${from}.` : ''}` };
}
