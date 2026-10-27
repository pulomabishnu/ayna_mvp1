import { PRO_FEATURES } from './features.js';
import { FEATURE_ALIAS } from './paywall.js';

// Early Access prices: the same values as api/_pro.js PRO_PLANS (499/899 and 4500/9000 cents).
const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';
const ANNUAL_PER_MONTH = '$3.75'; // $45 / 12
export const PAID_TERM_STARTS = 'Jan 1, 2027';

// Founder (Oct 27, 17:00): subscribe now, unlock Pro immediately, use it through Dec 31, 2026;
// the purchased term begins in January 2027.
export const EARLY_ACCESS_LINE = 'Subscribe now and Pro unlocks immediately. Use it through December 31, 2026, and your purchased subscription term begins in January 2027, so Early Access does not use up the month or year you bought.';

// Yearly is chosen first and marked: $45 today vs $4.99 + 11 x $8.99 = $103.88 for a
// first year paid monthly, and $90/year regular vs 12 x $8.99 = $107.88. 50% off is $45 of $90.
export const PLANS = [
  { id: 'year', label: 'Yearly', price: ANNUAL_PRICE, regular: ANNUAL_REGULAR, per: 'year', best: true,
    badge: '50% off', sub: `${ANNUAL_PER_MONTH}/month`,
    renew: `Renews at ${ANNUAL_REGULAR}/year. Cancel anytime.`,
    terms: `Your purchased year begins in January 2027, then renews at ${ANNUAL_REGULAR}/year unless canceled.` },
  { id: 'month', label: 'Monthly', price: MONTHLY_PRICE, regular: MONTHLY_REGULAR, per: 'month',
    sub: 'first month',
    renew: `Renews at ${MONTHLY_REGULAR}/month. Cancel anytime.`,
    terms: `Your purchased month begins in January 2027, then renews at ${MONTHLY_REGULAR}/month unless canceled.` },
];

/** Short chip words for each Pro feature, in the founder's wording. */
export const PRO_SHORT = {
  wearables: 'Apple Health and Health Connect',
  health: 'Health-data personalization',
  insights: 'Deeper personalized insights',
  tracking: 'Advanced tracking + trends',
  why: 'Deeper "why it fits"',
  quiz: 'Quiz retakes anytime',
  ask: 'Up to 50 Ask chats a day',
  reads: 'Unlimited Reads',
  playlists: 'Unlimited playlists',
};

/** Pro, grouped (founder: "don't just stack the features ... categorize it"). */
export const PRO_GROUPS = [
  { id: 'connect', name: 'Connect your health data', promise: 'ayna learns from the cycle, sleep, activity and other signals you choose to share.', items: ['wearables', 'health'] },
  { id: 'deeper', name: 'Go deeper', promise: 'Patterns and context over time, not single data points.', items: ['insights', 'tracking', 'why'] },
  { id: 'limits', name: 'Fewer limits', promise: 'Use ayna as much as your needs change.', items: ['quiz', 'ask', 'reads', 'playlists'] },
];

/** The groups with their features; `on` marks the feature she tapped. Evolving ones say so. */
export function proGroups(feature = '') {
  const tapped = FEATURE_ALIAS[feature] || feature;
  return PRO_GROUPS.map((g) => ({
    ...g,
    features: g.items.map((id) => PRO_FEATURES.find((f) => f.id === id)).filter(Boolean)
      .map((f) => ({ ...f, short: PRO_SHORT[f.id] || f.label, on: f.id === tapped, growing: f.stage !== 'available' })),
  }));
}
