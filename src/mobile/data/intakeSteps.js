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
