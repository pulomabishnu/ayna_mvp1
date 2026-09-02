// Mirrors the real onboarding quiz's step/question data and branching logic
// from src/components/Quiz.jsx (AGE_OPTIONS, REST_STEPS,
// CONTRACEPTION_USE_STEP, CONTRACEPTION_PREFERENCE_STEP, buildSteps,
// isAge50OrBelow) — copied verbatim since these aren't exported from that
// file and are static config + a small conditional, not complex matching
// logic. Keep in sync with Quiz.jsx if the real questions change.

export const AGE_OPTIONS = ['Under 25', '25-34', '35-44', '45-50', '51-55', '56+'];
const AGE_50_OR_BELOW = new Set(['Under 25', '25-34', '35-44', '45-50']);

export function isAge50OrBelow(ageValue) {
  return ageValue && AGE_50_OR_BELOW.has(ageValue);
}

// Maps a continuous age (from the design's slider widget, 13-90) onto one of
// the real AGE_OPTIONS buckets — lets the mobile UI keep the design's slider
// while still producing an answer the real buildSteps()/recommendation logic
// understands.
export function bucketAge(numericAge) {
  if (numericAge < 25) return 'Under 25';
  if (numericAge <= 34) return '25-34';
  if (numericAge <= 44) return '35-44';
  if (numericAge <= 50) return '45-50';
  if (numericAge <= 55) return '51-55';
  return '56+';
}

const REST_STEPS = [
  {
    id: 'frustrations',
    question: 'What are your main health concerns or goals?',
    subtitle: 'Select all that apply. This drives your recommendations',
    type: 'multi',
    options: [
      'Heavy flow',
      'Painful cramps',
      'Hormonal bloating',
      'Irregular cycles',
      'Leaks & staining',
      'General discomfort',
      'Not sure if products are safe',
      'Recurrent UTIs',
      'PCOS symptoms',
      'Pelvic pain',
      'Menopause symptoms',
      'Endometriosis',
      'Fertility / TTC',
      'Pregnancy',
      'Postpartum recovery',
    ],
  },
  {
    id: 'preference',
    question: 'What matters most to you in a product?',
    subtitle: "Select all that apply. We'll prioritize products that match",
    type: 'multi',
    options: [
      'Organic/Natural only',
      'Non-hormonal / hormone-free',
      'Lower cost',
      'Comfort/Convenience',
      'Privacy & data security',
      'Sustainability/Zero-waste',
    ],
  },
  {
    id: 'internalComfort',
    question: 'Are you comfortable with internal products (tampons, cups, discs)?',
    type: 'single',
    options: ['Yes', 'No', 'Open to trying'],
  },
  {
    id: 'currentUse',
    question: 'What do you use today?',
    subtitle: "Select all that apply. We'll avoid duplicating what you already have",
    type: 'multi',
    options: [
      'Pads',
      'Tampons',
      'Menstrual cup',
      'Menstrual disc',
      'Period underwear',
      'Supplements',
      'Flo / Clue / Stardust',
      'Apple Health / Garmin / Fitbit',
      'Telehealth (Wisp, Nurx, etc.)',
      'None',
    ],
  },
  {
    id: 'sensitivities',
    question: 'Any sensitivities or allergies we should know about?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: ['Fragrance sensitivity', 'Latex allergy', 'Synthetic materials', 'Other allergies', 'None that I know of'],
  },
  {
    id: 'productsToAvoid',
    question: "Any products or ingredients you already know you don't want to use?",
    subtitle: "We'll exclude these from your recommendations (e.g. essential oils, certain brands).",
    type: 'multi',
    options: ['Essential oils', 'Fragrance / scented products', 'Latex', 'Synthetic materials', "None / I'm open to suggestions"],
  },
  {
    id: 'budget',
    question: "Roughly, what's your monthly budget for health & wellness products?",
    type: 'single',
    options: ['Under $20', '$20–$50', '$50–$100', '$100+'],
  },
  {
    id: 'healthGoals',
    question: "Any other health goals we didn't cover today?",
    subtitle: "Type anything. Fertility, fitness, sleep, stress, skin, nutrition, etc. We'll factor it into your recommendations.",
    type: 'text',
    placeholder: 'e.g. I want to improve my sleep, manage stress better, and learn more about hormone health...',
  },
  {
    id: 'email',
    question: 'Save your profile (optional)',
    subtitle: 'Enter email to save recommendations, or skip to see results now.',
    type: 'email',
  },
];

const CONTRACEPTION_USE_STEP = {
  id: 'contraceptionUse',
  question: 'Are you currently using or interested in birth control?',
  subtitle: "We'll include contraception options in your recommendations if relevant.",
  type: 'single',
  options: ['Yes', 'No', 'Prefer not to say'],
};

const CONTRACEPTION_PREFERENCE_STEP = {
  id: 'contraceptionPreference',
  question: 'What type do you prefer or use?',
  subtitle: 'Select all that apply',
  type: 'multi',
  options: ['Pill', 'IUD', 'Implant', 'Ring', 'Patch', 'Condoms', 'Natural / FAM', 'None', 'Not sure'],
};

export function buildSteps(answers) {
  const ageStep = {
    id: 'age',
    question: "What's your age range?",
    subtitle: 'So we can tailor recommendations (e.g. contraception for under 50).',
    type: 'single',
    options: AGE_OPTIONS,
  };
  const contraceptionSteps = [];
  if (isAge50OrBelow(answers.age)) {
    contraceptionSteps.push(CONTRACEPTION_USE_STEP);
    if (answers.contraceptionUse === 'Yes') {
      contraceptionSteps.push(CONTRACEPTION_PREFERENCE_STEP);
    }
  }
  return [ageStep, ...contraceptionSteps, ...REST_STEPS];
}

// NOT part of the real quiz — the real app has no "goals" icon-grid step and
// no zip code field at all (its equivalent content is the free-text
// 'healthGoals' step above). Included as a purely decorative extra step
// per explicit request, kept out of buildSteps()/the real answers shape so
// it can never be mistaken for something the real recommendation logic
// reads. IntakeScreen inserts this locally after the age step.
// Tint colors are solid hex (not translucent rgba) so a checked tile stays
// visibly pale regardless of what's behind it — this screen's background is
// a dark gradient, not the light page these were originally designed for,
// so a low-alpha rgba just blends into the dark backdrop instead of
// showing a tint.
export const DECORATIVE_GOALS_STEP = {
  id: '_decorativeGoals',
  question: 'What brings you here?',
  subtitle: 'Pick as many as you like.',
  type: 'goals',
  options: [
    { key: 'cycle', label: 'Cycle comfort', tint: '#F5E7DE', stroke: '#A2603C', path: 'M12.5 3.8v4M20.7 12h-4.2M13 12a8.2 8.2 0 1 1-8.2 8.2 8.2 8.2 0 0 1 8.2-8.2Z' },
    { key: 'energy', label: 'Steady energy', tint: '#FFF3DD', stroke: '#C0761F', path: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z' },
    { key: 'sleep', label: 'Sleep', tint: '#EDE7F2', stroke: '#4E3866', path: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z' },
    { key: 'calm', label: 'Calm & mood', tint: '#F5E7DE', stroke: '#A2603C', path: 'M5 19c8-1 13-6 14-14-8 1-13 6-14 14Z M5 19c2-4 5-7 9-9' },
    { key: 'digestion', label: 'Digestion', tint: '#FBE8D3', stroke: '#C0761F', path: 'M12 3c4 5 7 8.5 7 12a7 7 0 1 1-14 0c0-3.5 3-7 7-12Z' },
    { key: 'skin', label: 'Skin & hair', tint: '#E4E6EF', stroke: '#242A52', path: 'M12 3 5 6v6c0 5 3 8 7 9 4-1 7-4 7-9V6l-7-3Z M9 12l2 2 4-4' },
  ],
};
