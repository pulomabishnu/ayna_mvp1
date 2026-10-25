/**
 * Every widget she can add to Home (app) or Today (website), by category
 * (founder, Oct 24 23:22). Only widgets backed by data or screens ayna
 * already has. Pure data: the components live in widgets/index.jsx.
 *
 *   sizes      small (1 space) and/or large (2 spaces)
 *   surfaces   where it can go ('app', 'web'); missing = both
 *   gate       optional ctx => boolean: offered in "Add a widget" only when
 *              true (data that may not exist at all, like heart data or the
 *              trending products count). Everything else can be added and
 *              shows an honest empty state until there is data.
 */
export const CATEGORIES = [
  { id: 'charts', title: 'Charts' },
  { id: 'summaries', title: 'Summaries' },
  { id: 'health', title: 'My health' },
  { id: 'routine', title: 'My routine' },
  { id: 'shopping', title: 'Shopping' },
  { id: 'community', title: 'Community' },
  { id: 'ayna', title: 'ayna' },
];

const BOTH = ['small', 'large'];

export const WIDGETS = [
  // Charts
  { id: 'sleep_chart', category: 'charts', title: 'Sleep', blurb: 'Your sleep each night. Small shows 7 days, large 30.', sizes: BOTH },
  { id: 'cycle_chart', category: 'charts', title: 'Cycle timeline', blurb: 'Period days over the last 30 days, and the next estimate when there is one.', sizes: BOTH },
  { id: 'pain_chart', category: 'charts', title: 'Pain', blurb: 'Pain from your daily log.', sizes: BOTH },
  { id: 'mood_chart', category: 'charts', title: 'Mood', blurb: 'Mood from your daily log.', sizes: BOTH },
  { id: 'heart_chart', category: 'charts', title: 'Heart', blurb: 'Heart rate variability or resting heart rate from your connected data.', sizes: BOTH, gate: (ctx) => Boolean(ctx.heartChart) },
  // Summaries
  { id: 'custom_summary', category: 'summaries', title: 'Your own summary', blurb: 'Pick a topic and a time range. ayna sums it up from your data on this device.', sizes: BOTH, configurable: true },
  { id: 'week_vs_week', category: 'summaries', title: 'This week vs last week', blurb: 'What moved in your log and sleep, week on week.', sizes: BOTH },
  { id: 'since_yesterday', category: 'summaries', title: 'What changed since yesterday', blurb: 'Today\'s log next to yesterday\'s.', sizes: BOTH },
  // My health
  { id: 'health', category: 'health', title: 'Health data and log', blurb: 'One fact from your health data, or your log, with a way to log today.', sizes: ['large', 'small'] },
  { id: 'next_period', category: 'health', title: 'Next period estimate', blurb: 'An estimate from your last cycles. Can be off by several days.', sizes: BOTH },
  { id: 'quick_log', category: 'health', title: 'Log today', blurb: 'What you logged today, one tap to log more.', sizes: BOTH },
  { id: 'log_streak', category: 'health', title: 'Log streak', blurb: 'Days in a row you logged.', sizes: BOTH },
  { id: 'patterns', category: 'health', title: 'Patterns ayna found', blurb: 'Patterns across your cycles, from your own logs.', sizes: BOTH },
  { id: 'doctor_prep', category: 'health', title: 'Doctor prep', blurb: 'Get ready for a visit: questions and a summary to bring.', sizes: ['small', 'large'], surfaces: ['web'] },
  // My routine
  { id: 'routine_today', category: 'routine', title: 'Today\'s routine', blurb: 'Where to start for each of your goals.', sizes: BOTH },
  { id: 'whats_working', category: 'routine', title: 'What\'s working', blurb: 'Things you tried and marked helpful.', sizes: BOTH },
  { id: 'reminders', category: 'routine', title: 'Reminders', blurb: 'Saved products you asked ayna to remind you about.', sizes: BOTH },
  // Shopping
  { id: 'shopping_list', category: 'shopping', title: 'Shopping list', blurb: 'Your saved products, with Buy links.', sizes: BOTH },
  { id: 'my_ecosystem', category: 'shopping', title: 'My ecosystem', blurb: 'The products in your routine.', sizes: BOTH },
  { id: 'trending_products', category: 'shopping', title: 'Trending products', blurb: 'Products many people saved lately. Counts only, never who.', sizes: BOTH, gate: (ctx) => Array.isArray(ctx.remote?.trendingProducts) && ctx.remote.trendingProducts.length > 0 },
  // Community
  { id: 'community_posts', category: 'community', title: 'Trending posts', blurb: 'Posts people found most helpful this week.', sizes: BOTH },
  { id: 'my_playlists', category: 'community', title: 'My playlists', blurb: 'Your Community playlists.', sizes: BOTH },
  { id: 'my_topics', category: 'community', title: 'Topics I follow', blurb: 'Jump into the topics you follow.', sizes: BOTH },
  { id: 'new_in_community', category: 'community', title: 'New in Community', blurb: 'New posts in your topics this week.', sizes: BOTH },
  // ayna
  { id: 'news', category: 'ayna', title: 'ayna news', blurb: 'News from the ayna team.', sizes: BOTH, gate: (ctx) => Array.isArray(ctx.news) && ctx.news.length > 0 },
  { id: 'recent_asks', category: 'ayna', title: 'Recent questions', blurb: 'Your last questions to ayna, one tap to ask again.', sizes: BOTH },
  { id: 'continue_reading', category: 'ayna', title: 'Continue reading', blurb: 'Reads you started.', sizes: BOTH, surfaces: ['app'] },
];

export const REGISTRY = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));

/** Widgets in a category she can add on this surface, given what data exists. */
export function widgetsFor(category, surface, ctx = {}) {
  return WIDGETS.filter((w) => w.category === category && (!w.surfaces || w.surfaces.includes(surface)) && (!w.gate || w.gate(ctx)));
}

/** Categories with at least one widget on this surface. */
export function categoriesFor(surface, ctx = {}) {
  return CATEGORIES.filter((c) => widgetsFor(c.id, surface, ctx).length > 0);
}

/** Summary topics and ranges for "Your own summary". */
export const SUMMARY_TOPICS = [
  { id: 'sleep', label: 'My sleep' },
  { id: 'cycle', label: 'My cycle' },
  { id: 'pain', label: 'My pain' },
  { id: 'mood', label: 'My mood' },
  { id: 'routine', label: 'How my routine is going' },
];
export const SUMMARY_RANGES = [
  { id: 'week', label: 'This week', days: 7 },
  { id: 'month', label: 'This month', days: 30 },
];
export const DEFAULT_SUMMARY = { topic: 'sleep', range: 'week' };
