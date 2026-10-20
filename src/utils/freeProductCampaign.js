/**
 * Free product campaign: shared rules, used by the page AND by api/campaign.js
 * so the counter she sees and the server's check can never disagree.
 *
 * The server is still the authority: the API re-validates every answer, and
 * Postgres (campaign_progress) re-checks length and distinctness again before
 * anything counts toward eligibility.
 */

export const CAMPAIGN_ID = 'free-product-2026';
export const FEEDBACK_MIN_CHARS = 120;
export const FEEDBACK_MAX_CHARS = 1500;
export const MIN_WORDS = 12;

export const FEEDBACK_QUESTIONS = [
  {
    key: 'like',
    title: 'Something you like',
    question: "What's one thing about ayna you actually like or find useful?",
    placeholder: 'What do you use it for, and what about it works for you?',
  },
  {
    key: 'friction',
    title: 'Something that bugs you',
    question: "What's one thing that felt confusing, annoying, or harder than it should be?",
    placeholder: 'Where were you, what did you expect, and what happened instead?',
  },
  {
    key: 'change',
    title: 'Something you would change',
    question: 'If you could change or add one thing to ayna, what would it be?',
    placeholder: 'What would it look like, and why would it help you?',
  },
];

export const questionByKey = (key) => FEEDBACK_QUESTIONS.find((q) => q.key === key) || null;

/** Whitespace runs collapse to one space, so padding with spaces or newlines never counts. */
export function normalizeAnswer(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

export function answerLength(text) {
  return normalizeAnswer(text).length;
}

function words(text) {
  return normalizeAnswer(text).toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
}

function wordSet(text) {
  return new Set(words(text).filter((w) => w.length > 2));
}

/** Share of distinct words two answers have in common (Jaccard). */
export function answerSimilarity(a, b) {
  const A = wordSet(a);
  const B = wordSet(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  return shared / (A.size + B.size - shared);
}

export const FEEDBACK_MESSAGES = {
  empty: 'Write a few sentences here.',
  too_short: (n) => `${n} more character${n === 1 ? '' : 's'} to go.`,
  too_long: `Keep it under ${FEEDBACK_MAX_CHARS} characters.`,
  repeated: 'Looks like a lot of the same character. Tell us in your own words.',
  too_few_words: 'Add a little more detail, a sentence or two.',
  low_variety: 'Try saying it in a few different words.',
  duplicate: 'This is very close to another answer. Each one should say something different.',
};

/**
 * @param {string} text
 * @param {string[]} others the other answers (to block copy and paste)
 * @returns {{ ok: boolean, reason: string|null, message: string|null, length: number, remaining: number }}
 */
export function validateFeedbackAnswer(text, others = [], { minChars = FEEDBACK_MIN_CHARS } = {}) {
  const norm = normalizeAnswer(text);
  const length = norm.length;
  const remaining = Math.max(0, minChars - length);
  const fail = (reason) => {
    const m = FEEDBACK_MESSAGES[reason];
    return { ok: false, reason, message: typeof m === 'function' ? m(remaining) : m, length, remaining };
  };
  if (!length) return fail('empty');
  if (length > FEEDBACK_MAX_CHARS) return fail('too_long');

  const compact = norm.replace(/\s/g, '');
  // "aaaaaaa", "!!!!!!!!", "lololololololol"
  if (/(.)\1{5,}/u.test(compact) || /(.{2,4})\1{4,}/u.test(compact)) return fail('repeated');
  const counts = {};
  for (const ch of compact.toLowerCase()) counts[ch] = (counts[ch] || 0) + 1;
  const top = Math.max(0, ...Object.values(counts));
  if (compact.length >= 20 && top / compact.length > 0.3) return fail('repeated');

  if (remaining > 0) return fail('too_short');

  const w = words(norm);
  if (w.length < MIN_WORDS) return fail('too_few_words');
  if (new Set(w).size / w.length < 0.4) return fail('low_variety');
  if (w.reduce((s, x) => s + x.length, 0) / w.length > 14) return fail('low_variety');

  for (const other of others) {
    if (!normalizeAnswer(other)) continue;
    if (normalizeAnswer(other).toLowerCase() === norm.toLowerCase() || answerSimilarity(norm, other) >= 0.7) {
      return fail('duplicate');
    }
  }
  return { ok: true, reason: null, message: null, length, remaining: 0 };
}

/* ------------------------------- Referral link ------------------------------ */

/**
 * Same code as referralCodeFor in badges.js and ayna_referral_code() in SQL
 * (kept here so the API does not pull the product catalog in via badges.js).
 * It is a short prefix of the account id, never the full id.
 */
export function referralCodeFor(userId) {
  const code = String(userId || '').replace(/-/g, '').slice(0, 10).toLowerCase();
  return /^[a-z0-9]{6,20}$/.test(code) ? code : null;
}

const CANONICAL_ORIGIN = 'https://www.aynahealth.co';

/**
 * Where share links point. On the live site always www.aynahealth.co: sign-up
 * confirmation emails land there, and the friend's saved ?ref lives in that
 * host's storage, so a link copied on the bare domain must not split them.
 * Local and preview builds keep their own origin so links work while testing.
 */
export function shareOrigin() {
  if (typeof window === 'undefined') return CANONICAL_ORIGIN;
  const host = window.location.hostname || '';
  return host === 'aynahealth.co' || host.endsWith('.aynahealth.co') ? CANONICAL_ORIGIN : window.location.origin;
}

export function joinLinkFor(userId, origin) {
  const code = referralCodeFor(userId);
  if (!code) return null;
  const base = origin || shareOrigin();
  return `${base.replace(/\/+$/, '')}/join?ref=${code}`;
}

/**
 * The invite code saved when a friend opened a /join?ref= link (badges.js,
 * captureReferralFromUrl), as sign-up metadata. The database writes the
 * referrals row from it the moment the account is created (trigger
 * ayna_referral_from_metadata), so the referral still counts when she
 * confirms her email in another browser or on her phone. Lives here, not in
 * badges.js, so the sign-up form does not pull in the product catalog.
 */
export function pendingReferralMeta() {
  try {
    const pending = JSON.parse(window.localStorage.getItem('ayna_pending_ref_v1') || 'null');
    if (!pending?.code || !/^[a-z0-9]{6,20}$/.test(pending.code) || !(Date.now() - pending.at <= 30 * 864e5)) return {};
    const viaShare = /^[A-Za-z0-9]{10}$/.test(String(pending.slug || '')) ? { referred_via_share: pending.slug } : {};
    return { referred_by: pending.code, referred_at: new Date().toISOString(), ...viaShare };
  } catch {
    return {};
  }
}

/* --------------------------------- Shipping --------------------------------- */

export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'], ['PR', 'Puerto Rico'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];
const STATE_CODES = new Set(US_STATES.map(([c]) => c));

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** @returns {{ ok: boolean, value: object, errors: Record<string,string> }} */
export function validateShipping(input = {}) {
  const value = {
    fullName: clean(input.fullName, 120),
    addressLine1: clean(input.addressLine1, 200),
    addressLine2: clean(input.addressLine2, 120),
    city: clean(input.city, 100),
    state: clean(input.state, 2).toUpperCase(),
    postalCode: clean(input.postalCode, 10),
    email: clean(input.email, 254).toLowerCase(),
  };
  const errors = {};
  if (value.fullName.length < 2) errors.fullName = 'Add the name for the package.';
  if (value.addressLine1.length < 3) errors.addressLine1 = 'Add a street address.';
  if (value.city.length < 2) errors.city = 'Add a city.';
  if (!STATE_CODES.has(value.state)) errors.state = 'Pick a state.';
  if (!/^\d{5}(-\d{4})?$/.test(value.postalCode)) errors.postalCode = 'Use a 5 digit ZIP.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) errors.email = 'Add an email we can reach you at.';
  return { ok: Object.keys(errors).length === 0, value, errors };
}

/* --------------------------------- Display ---------------------------------- */

export const FULFILLMENT_LABELS = {
  needs_shipping: 'Waiting for your address',
  preparing: 'Getting it ready',
  shipped: 'On the way',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

export const REFERRAL_STATUS_LABELS = {
  verified: 'Verified',
  unverified: 'Joined, not verified yet',
  existing: "Already had an account, doesn't count",
  same_person: "Same email as you, doesn't count",
  duplicate: "Same email as another friend, doesn't count",
};

/** What is left, in words, for the main button before she is eligible. */
export function remainingLabel(status) {
  if (!status?.campaign) return null;
  const c = status.campaign;
  if (!status.verified) return 'Verify your account to start';
  const fb = Math.max(0, c.feedbackRequired - (status.feedbackComplete || 0));
  const fr = Math.max(0, c.referralsRequired - (status.referralsVerified || 0));
  if (fb && fr) return `${fb} answer${fb === 1 ? '' : 's'} and ${fr} friend${fr === 1 ? '' : 's'} to go`;
  if (fb) return `${fb} more answer${fb === 1 ? '' : 's'} to go`;
  if (fr) return `${fr} more verified friend${fr === 1 ? '' : 's'} to go`;
  return null;
}
