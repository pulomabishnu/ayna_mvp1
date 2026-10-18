/**
 * What each source's data may be used for, set by that provider's own terms
 * (researched Oct 2026; see docs/wearables-ehr-integration.md).
 *
 *   insights - shown back to her in Health Insights
 *   matching - allowed to strengthen Health Match (src/health/matchContext.js)
 *
 * Nothing from ANY source is ever sent to an LLM, analytics, ads, or a brand;
 * that is enforced by design (no code path does it), not by this table.
 *
 * Oura: the Oura API Agreement (effective June 8, 2026) bars "advertising,
 * marketing, or commercial targeting" use. Personal product matching in a
 * shop may or may not count; until Oura confirms in writing, Oura API data
 * powers Insights only. Oura data that reaches ayna through Apple Health or
 * Health Connect is covered by those platforms' rules instead.
 *
 * WHOOP: the WHOOP API Terms bar permanent copies of WHOOP data, so WHOOP
 * rows are fetched live and never saved; ads use and AI training are barred.
 *
 * Strava: the Strava API Policy (effective June 1, 2026) bars storing data
 * beyond 7 days and combining it with other customer data, so ayna does not
 * connect to Strava's API at all. Strava workouts can still arrive through
 * Apple Health or Health Connect if she syncs them there.
 */
export const SOURCE_POLICY = {
  apple_health: { insights: true, matching: true },
  health_connect: { insights: true, matching: true },
  manual_import: { insights: true, matching: true },
  oura: { insights: true, matching: false, matchingNote: 'Oura data shows in your insights. It does not change your product matches until Oura confirms its terms allow it.' },
  // WHOOP: terms bar storing copies, ads use and AI training; they do not bar
  // personal matching. Read live, never stored (src/health/providers/whoop.js).
  whoop: { insights: true, matching: true },
  garmin: { insights: true, matching: false },
  strava: { insights: false, matching: false },
};

export const usableForMatching = (row) => Boolean(SOURCE_POLICY[row?.source]?.matching);
export const usableForInsights = (row) => Boolean(SOURCE_POLICY[row?.source]?.insights);
