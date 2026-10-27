import { PRO_FEATURES } from './features.js';
import { FEATURE_ALIAS } from './paywall.js';

// Early Access prices: the same values as api/_pro.js PRO_PLANS (499/899 and 4500/9000 cents).
const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';
const ANNUAL_PER_MONTH = '$3.75'; // $45 / 12
export const PAID_TERM_STARTS = 'Jan 1, 2027';

// Yearly is chosen first and marked: $45 today vs $4.99 + 11 x $8.99 = $103.88 for a
// first year paid monthly, and $90/year regular vs 12 x $8.99 = $107.88. 50% off is $45 of $90.
export const PLANS = [
  { id: 'year', label: 'Yearly', price: ANNUAL_PRICE, regular: ANNUAL_REGULAR, per: 'year', best: true,
    badge: '50% off', sub: `${ANNUAL_PER_MONTH}/month`,
    renew: `Renews at ${ANNUAL_REGULAR}/year. Cancel anytime.`,
    terms: `Your first paid year begins at launch, then renews at ${ANNUAL_REGULAR}/year unless canceled.` },
  { id: 'month', label: 'Monthly', price: MONTHLY_PRICE, regular: MONTHLY_REGULAR, per: 'month',
    sub: 'first month',
    renew: `Renews at ${MONTHLY_REGULAR}/month. Cancel anytime.`,
    terms: `Your first paid month begins at launch, then renews at ${MONTHLY_REGULAR}/month unless canceled.` },
];

// The short "what changes" line under each benefit, from the Pro features list.
export const PRO_VALUE = {
  ask: 'Up to 50 chats a day instead of 5',
  quiz: 'Retake the quiz whenever you want, not once a month',
  reads: 'Every Read in the Library, not one a week',
  playlists: 'As many playlists as you want, not one',
  wearables: 'Bring in the health data you choose to share',
  history: 'Detailed cycle, sleep and body history',
  recap: 'Look back at your recent observations',
  tracking: 'Try a change, then check back in 7 or 14 days',
  appointment: 'Symptoms and questions, organized for your visit',
  early: 'Try new Pro features as they arrive',
};
const DEFAULT_ROWS = ['ask', 'reads', 'quiz', 'playlists'];

/** Four benefit rows from the Pro features list: the feature she tapped first (when it
 *  is available today), then the everyday ones. Nothing still in development. */
export function benefitRows(feature) {
  const available = PRO_FEATURES.filter((f) => f.stage === 'available');
  const first = available.find((f) => f.id === (FEATURE_ALIAS[feature] || feature));
  const rest = DEFAULT_ROWS.map((id) => available.find((f) => f.id === id)).filter((f) => f && f !== first);
  return [first, ...rest].filter(Boolean).slice(0, 4);
}

