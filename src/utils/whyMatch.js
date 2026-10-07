/**
 * Pure helpers behind the "Why this match" breakdown (WhyMatchPanel.jsx),
 * ported from the mobile app's WhyMatchScreen. Everything here reshapes the
 * real output of getProductMatchDetailsForProduct (src/data/products.js) —
 * the same weighted engine that drives the match % everywhere else on the
 * site. Tier copy is templated per score band, never written per product,
 * and the "What matched" rows are the engine's own reasonDetails text.
 */

// Three bands over the same percent the product page shows. Which band
// applies is driven entirely by the real score.
export const TIERS = [
  {
    key: 'strong',
    min: 75,
    tier: 'Strong match',
    headline: 'A strong match.',
    sub: "Multiple signals from your profile line up, and nothing you've flagged gets in the way.",
  },
  {
    key: 'good',
    min: 50,
    tier: 'Good fit',
    headline: 'Most of it fits.',
    sub: "Several signals line up. Worth a quick look at what's below before you commit.",
  },
  {
    key: 'look',
    min: 0,
    tier: 'Worth a look',
    headline: 'Worth a look.',
    sub: 'A couple of things line up with your profile: enough to show you, not enough to push.',
  },
];

export function tierForPercent(percent) {
  const n = Number(percent);
  if (!Number.isFinite(n)) return TIERS[TIERS.length - 1];
  return TIERS.find((t) => n >= t.min) || TIERS[TIERS.length - 1];
}

// Buckets the engine's reasonDetails into the same three groups the score
// itself is weighted by (goal fit, profile fit, preference fit) rather than
// inventing categories that don't map to what was computed.
const GOAL_COMPONENTS = new Set(['primaryGoal', 'periodFlow', 'periodPain', 'utiFrequency', 'diagnoses']);
const PROFILE_COMPONENTS = new Set([
  'age',
  'lifeStage',
  'breastfeeding',
  'postpartumTiming',
  'pregnancyTrimester',
  'perimenopauseLastPeriod',
  'triedBefore',
]);

export function kindForComponent(component) {
  if (GOAL_COMPONENTS.has(component)) return { key: 'goal', kind: 'Your goal', glyph: '✦' };
  if (PROFILE_COMPONENTS.has(component)) return { key: 'profile', kind: 'Your profile', glyph: '❋' };
  return { key: 'preference', kind: 'Your preference', glyph: '◈' };
}

function considerationText(note) {
  if (!note) return '';
  if (typeof note === 'string') return note.trim();
  return String(note.text || '').trim();
}

/**
 * Reshapes getProductMatchDetailsForProduct output into one of three states:
 * - 'unscored': no personal percent (not enough profile signal)
 * - 'excluded': the engine actively ruled this product out for the profile
 *   (life stage, flagged allergy, past bad reaction, etc.). Kept distinct from
 *   a low score so a real exclusion is never shown as a soft positive.
 * - 'scored': percent + tier + matched reasons + considerations
 */
export function buildMatchBreakdown(details) {
  const d = details || {};
  const considerations = (Array.isArray(d.considerations) ? d.considerations : [])
    .map(considerationText)
    .filter(Boolean);

  if (d.eligible === false) {
    return { state: 'excluded', percent: null, reason: considerations[0] || null, considerations, matches: [], tier: null };
  }

  const percent = Number.isFinite(d.percent) ? d.percent : null;
  if (percent == null) {
    return { state: 'unscored', percent: null, reason: null, considerations: [], matches: [], tier: null };
  }

  const matches = (Array.isArray(d.reasonDetails) ? d.reasonDetails : [])
    .filter((r) => r && String(r.text || '').trim())
    .map((r) => ({
      ...kindForComponent(r.component),
      component: r.component,
      label: String(r.text).trim(),
      weight: Number(r.score) >= 1 ? 'Strong' : 'Partial',
    }));

  return { state: 'scored', percent, reason: null, considerations, matches, tier: tierForPercent(percent) };
}

/** True when the viewer has given us any quiz or health-profile data at all. */
export function hasProfileSignal(quizResults, healthProfile) {
  const nonEmpty = (v) => !!v && typeof v === 'object' && Object.keys(v).length > 0;
  return nonEmpty(quizResults) || nonEmpty(healthProfile);
}

/** Long summaries get clamped behind "Read more" past this many characters. */
export const SUMMARY_CLAMP_CHARS = 320;

export function shouldClampSummary(text, max = SUMMARY_CLAMP_CHARS) {
  return String(text || '').trim().length > max;
}
