/**
 * Free product campaign: rules shared by the page (live hints) and the server
 * (/api/campaign, which is what actually enforces them, along with the
 * database). Pure functions, no browser or Node APIs.
 */

export const CAMPAIGN_ID = 'free-product-2026';
export const FEEDBACK_MIN_CHARS = 120;
export const FEEDBACK_MAX_CHARS = 1500;
export const FRIENDS_REQUIRED = 3;

export const FEEDBACK_QUESTIONS = [
  {
    key: 'like',
    label: "What's one thing about ayna you actually like or use?",
    hint: 'A page, a feature, a moment it helped. Tell us why.',
  },
  {
    key: 'friction',
    label: "What's one thing that's confusing, annoying, or in the way?",
    hint: 'Be honest. This is the one we learn the most from.',
  },
  {
    key: 'change',
    label: 'If you could change or add one thing, what would it be?',
    hint: 'Big or small. What would make you open ayna more?',
  },
];

export const FEEDBACK_KEYS = FEEDBACK_QUESTIONS.map((q) => q.key);
export const questionFor = (key) => FEEDBACK_QUESTIONS.find((q) => q.key === key) || null;

const lettersOnly = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (text) => String(text || '').toLowerCase().match(/[a-z]{2,}/g) || [];

/** The count shown to people: trimmed length, same as the database's char_count. */
export const feedbackLength = (text) => String(text || '').trim().length;

/**
 * Why an answer isn't accepted yet, or null when it's fine.
 * too_short | too_long | low_effort
 */
export function feedbackProblem(text, minChars = FEEDBACK_MIN_CHARS) {
  const trimmed = String(text || '').trim();
  if (trimmed.length < minChars) return 'too_short';
  if (trimmed.length > FEEDBACK_MAX_CHARS) return 'too_long';
  const clean = lettersOnly(trimmed);
  if (new Set(clean).size < 8) return 'low_effort';
  const w = words(trimmed);
  if (w.length < 12) return 'low_effort';
  // "good good good good..." or one word padded out
  if (new Set(w).size / w.length < 0.35) return 'low_effort';
  // one character dominating, e.g. "aaaaaaaaa great"
  const counts = {};
  for (const ch of clean) counts[ch] = (counts[ch] || 0) + 1;
  if (Math.max(...Object.values(counts)) / clean.length > 0.4) return 'low_effort';
  return null;
}

/** Jaccard overlap of the word sets. 1 = same words. */
export function wordOverlap(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/** True when two answers are the same answer, give or take a few words. */
export const tooSimilar = (a, b) => lettersOnly(a) === lettersOnly(b) || wordOverlap(a, b) >= 0.8;

export const FEEDBACK_MESSAGES = {
  too_short: (min) => `A little more, please. We need at least ${min} characters.`,
  too_long: () => `That's a lot (thank you). Keep it under ${FEEDBACK_MAX_CHARS} characters.`,
  low_effort: () => 'Give us a real sentence or two so we can actually use it.',
  duplicate: () => "This one reads a lot like another answer. Tell us something different here.",
};

/* ------------------------------ shipping ------------------------------ */

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'PR',
];

/** { field: message } for anything wrong, {} when the address is usable. */
export function shippingProblems(a = {}) {
  const v = (k) => String(a[k] ?? '').trim();
  const errors = {};
  if (v('fullName').length < 2) errors.fullName = 'Add your full name';
  if (v('fullName').length > 120) errors.fullName = 'That name is too long';
  if (v('line1').length < 3) errors.line1 = 'Add your street address';
  if (v('line1').length > 200) errors.line1 = 'That address is too long';
  if (v('line2').length > 200) errors.line2 = 'That is too long';
  if (v('city').length < 2) errors.city = 'Add your city';
  if (!US_STATES.includes(v('state').toUpperCase())) errors.state = 'Pick your state';
  if (!/^\d{5}(-\d{4})?$/.test(v('postal'))) errors.postal = 'Use a 5-digit ZIP';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')) || v('email').length > 254) errors.email = 'Add an email we can reach you at';
  return errors;
}

/* ------------------------------ progress copy ------------------------------ */

/**
 * What the main button says. Takes the server's progress object; never decides
 * eligibility itself (the server already did).
 */
export function remainingLabel(p) {
  if (!p) return '';
  if (p.claim) return 'see your free product';
  if (p.eligible) return 'unlock my free product';
  if (!p.verified) return 'verify your account to start';
  const fb = 3 - (p.feedbackDone?.length || 0);
  const fr = Math.max(0, (p.friendsRequired || FRIENDS_REQUIRED) - (p.friendsVerified || 0));
  const parts = [];
  if (fb > 0) parts.push(`${fb} more ${fb === 1 ? 'answer' : 'answers'}`);
  if (fr > 0) parts.push(`${fr} more verified ${fr === 1 ? 'friend' : 'friends'}`);
  return parts.length ? `${parts.join(' and ')} to go` : 'almost there';
}
