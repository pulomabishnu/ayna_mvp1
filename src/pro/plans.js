import { PRO_FEATURES } from './features.js';
import { FEATURE_ALIAS } from './paywall.js';

// Early Access prices: the same values as api/_pro.js PRO_PLANS (499/899 and 4500/9000 cents).
const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';
const ANNUAL_PER_MONTH = '$3.75'; // $45 / 12
export const PAID_TERM_STARTS = 'Feb 1, 2027';

// Founder clarification (Nov 6): full launch in January 2027; Early Access is included through January 31.
// The purchased subscription term starts February 1, 2027, after launch month.
export const EARLY_ACCESS_LINE = 'Subscribe now and Pro unlocks immediately. ayna fully launches in January 2027, and your Early Access continues through January 31. Your purchased month or year begins February 1, 2027. After that paid term, your plan renews at the regular rate unless you cancel.';

// Yearly is chosen first and marked: $45 today vs $4.99 + 11 x $8.99 = $103.88 for a
// first year paid monthly, and $90/year regular vs 12 x $8.99 = $107.88. 50% off is $45 of $90.
export const PLANS = [
  { id: 'year', label: 'Yearly', price: ANNUAL_PRICE, regular: ANNUAL_REGULAR, per: 'year', best: true,
    badge: '50% off', sub: `${ANNUAL_PER_MONTH}/month`,
    renew: `First renewal February 1, 2028 at ${ANNUAL_REGULAR}/year, then yearly. Cancel before renewal.`,
    terms: `Your purchased year begins February 1, 2027, and renews February 1, 2028 at ${ANNUAL_REGULAR}/year unless canceled.` },
  { id: 'month', label: 'Monthly', price: MONTHLY_PRICE, regular: MONTHLY_REGULAR, per: 'month',
    sub: 'first month',
    renew: `First renewal March 1, 2027 at ${MONTHLY_REGULAR}/month, then monthly. Cancel before renewal.`,
    terms: `Your purchased month begins February 1, 2027, and renews March 1, 2027 at ${MONTHLY_REGULAR}/month unless canceled.` },
];

/** Short chip words for each Pro feature, in the founder's wording. */
export const PRO_SHORT = {
  wearables: 'Apple Health and Health Connect',
  health: 'Health-data personalization',
  insights: 'Deeper personalized insights',
  tracking: 'Advanced tracking + trends',
  quiz: 'Quiz retakes anytime',
  ask: 'Up to 50 Ask chats a month',
  reads: 'Unlimited Reads',
  playlists: 'Unlimited playlists',
};

/** Pro, grouped (founder: "don't just stack the features ... categorize it"). */
export const PRO_GROUPS = [
  { id: 'connect', name: 'Connect your health data', promise: 'ayna learns from the cycle, sleep, activity and other signals you choose to share.', items: ['dashboard', 'wearables', 'health'] },
  { id: 'deeper', name: 'Go deeper', promise: 'Patterns and context over time, not single data points.', items: ['insights', 'tracking'] },
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
