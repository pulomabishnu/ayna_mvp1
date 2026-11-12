// First-time setup (UX spec sections 3 to 5): the existing intake, re-sequenced
// into seven short screens. Every answer still lands in the intake fields
// intakeModel.js already defines (supportSelections, lifeStageSelections,
// preferredFormats, ...), so matching reads exactly what it read before.
//
// Two answers are new and neither one changes a match:
//   helpTopics  what she wants help with (screen 1). An interest, never a
//               symptom or a condition (master prompt section 39). It only
//               narrows the list shown on screen 3.
//   goals       what she wants out of ayna (screen 4), stated in her words.
//
// Questions the spec calls rarely needed (ZIP, products tried, brands, picks
// per need, anything else) are not in the first run. They stay in the full
// quiz and are asked later, one at a time (profileCompleteness.js).
import { SUPPORT_GROUPS, getIntakeSteps, isStepAnswered } from './intakeModel.js';

export const ONBOARDING_SCREENS = [
  // Founder, Oct 29: name, age and life stage first, then what she wants help with.
  { n: 2, id: 'stage', label: 'Your life stage' },
  { n: 1, id: 'help', label: 'What you want help with' },
  { n: 3, id: 'experience', label: 'What you are experiencing' },
  { n: 4, id: 'goals', label: 'Your goals' },
  { n: 5, id: 'prefs', label: 'Your preferences' },
  { n: 6, id: 'deeper', label: 'For your safety' },
  { n: 7, id: 'connect', label: 'Health data' },
];
export const ONBOARDING_SCREEN_COUNT = ONBOARDING_SCREENS.length;

// The welcome's one value screen (app landing, website setup start).
export const VALUE_POINTS = [
  ['Today', 'A short daily rundown built around what you tell ayna.'],
  ['Matches with a reason', 'Products matched to your answers, each with why it fits.'],
  ['Your call', 'You don’t need a diagnosis. Skip anything, change anything.'],
];

const group = (label) => SUPPORT_GROUPS.find((g) => g.label === label)?.items || [];

// Screen 1 chips (spec section 3 list). Each opens the screen 3 options that
// belong to it. Picking a topic never selects a symptom for her.
export const HELP_TOPIC_ITEMS = {
  'Periods & cramps': group('Period + cycle'),
  Hormones: group('Hormonal + reproductive'),
  PCOS: ['PCOS support', 'Irregular periods', 'Missed periods', 'Excess facial or body hair', 'Hair thinning or hair loss'],
  Endometriosis: ['Endometriosis support', 'Cramps or period pain', 'Pelvic pain', 'Heavy periods', 'Pain or discomfort during sex'],
  Fertility: group('Fertility'),
  Pregnancy: group('Pregnancy'),
  Postpartum: group('Postpartum'),
  'Vaginal health': group('Vaginal health'),
  UTIs: group('Urinary health'),
  'Sexual health': group('Sexual + reproductive health'),
  'Gut health': group('Digestive health'),
  'Temperature changes': group('Temperature + sweating'),
  Perimenopause: [...group('Perimenopause + menopause + post-menopause'), ...group('Temperature + sweating'), 'Irregular periods', 'Trouble sleeping'],
  Menopause: [...group('Perimenopause + menopause + post-menopause'), ...group('Temperature + sweating'), 'Bone health'],
  // Founder, Oct 29: after menopause has its own needs (dryness, bladder, bone).
  'Post-menopause': [...group('Perimenopause + menopause + post-menopause'), ...group('Temperature + sweating'), 'Vaginal dryness', 'Pain or discomfort during sex', 'Bladder leakage or incontinence', 'Recurrent UTI-like symptoms', 'Bone health', 'Trouble sleeping'],
  Sleep: ['Trouble sleeping', 'Fatigue or low energy'],
  Energy: ['Fatigue or low energy', 'Brain fog', 'Difficulty concentrating', 'Strength or fitness', 'Metabolism or weight support'],
  'Mental wellness': group('Mood + mental wellbeing'),
  // Nov 5 all-hands: no Skin topic until skin care recommendations are ready.
  Hair: ['Hair thinning or hair loss', 'Excess facial or body hair'],
  Pain: ['Cramps or period pain', 'Pelvic pain', 'Cycle-related headaches or migraines', 'Joint aches', 'Pain or discomfort during sex', 'Abdominal discomfort'],
};
export const SOMETHING_ELSE = 'Something else';
export const HELP_TOPICS = [...Object.keys(HELP_TOPIC_ITEMS), SOMETHING_ELSE];

export const GOALS = [
  'Feel less pain', 'Improve sleep', 'Understand my cycle', 'Support fertility', 'Manage symptoms',
  'Improve sexual wellness', 'Find safer products', 'Find evidence-backed options', 'Understand menopause changes', 'Improve energy',
];

// Shown on screen 3 under every topic set: getting care, and "nothing specific".
const ALWAYS_ITEMS = [...group('Care access')];
export const NOTHING_SPECIFIC = 'Nothing right now';

/**
 * Screen 3 groups for her topics: [{ label, items }], one group per topic,
 * no item twice. No topic picked (or only "Something else") shows every group.
 */
export function supportGroupsForTopics(topics = []) {
  const picked = (topics || []).filter((t) => HELP_TOPIC_ITEMS[t]);
  if (!picked.length) return SUPPORT_GROUPS.filter((g) => g.label !== 'Right now');
  const seen = new Set();
  const out = picked.map((t) => {
    const items = HELP_TOPIC_ITEMS[t].filter((i) => !seen.has(i));
    items.forEach((i) => seen.add(i));
    return { label: t, items };
  }).filter((g) => g.items.length);
  const care = ALWAYS_ITEMS.filter((i) => !seen.has(i));
  if (care.length) out.push({ label: 'Care', items: care });
  return out;
}

/** Topics implied by needs she already picked (resuming an older profile). */
export function topicsFromSupport(support = []) {
  const set = new Set(support || []);
  return Object.keys(HELP_TOPIC_ITEMS).filter((t) => HELP_TOPIC_ITEMS[t].some((i) => set.has(i)));
}

// Why each first-run question is asked (spec: "The user should understand
// why ayna is asking each health question"). Short, plain, one line each.
const WHY = {
  name: 'Only to greet you. Optional, and you can leave it blank.',
  helpTopics: 'This only picks which options we show next. It is not added to your health profile.',
  support: 'Each one you pick gets its own matches and its own place on Today. Pick things you want to learn about too, like birth control. You can change this anytime in You, then My health.',
  periodFlow: 'We use it to match absorbency for pads, tampons, cups and period underwear.',
  periodPain: 'Stronger pain moves heat, TENS and pain relief options up, and tells us when to suggest care.',
  utiFrequency: 'Symptoms right now point you to testing and care first. Repeat symptoms bring prevention forward.',
  safety: 'ayna does not diagnose. If something is new or getting worse quickly, we show care before products.',
  goals: 'Goals shape what Today talks about. They never change a match score.',
  age: 'Some products have an age range on the label. Your life stage comes from what you tell us, never your age.',
  lifeStage: 'It changes what is safe to show, for example pregnancy-safe picks only.',
  ttcDuration: 'It changes whether we lead with tracking and prenatal basics or with fertility care.',
  postpartumTiming: 'Recovery, feeding and hair needs change a lot over the first year.',
  pregnancyTrimester: 'Some products are only suitable at certain stages of pregnancy.',
  formats: 'We rank the formats you like higher. Skip it and every format counts the same.',
  priceRange: 'Picks in your range come first. Skip it and we assume nothing.',
  avoidIngredients: 'Anything you pick here is left out of your picks. These are preferences, not allergies.',
  preferIngredients: 'Products that match move up in your picks, including eco-friendly and reusable ones.',
  fsaHsa: 'If you have a pre-tax health account, we point out products that are usually eligible.',
  trust: 'Choose what you trust most when picking a product. Skip it and ayna puts evidence first.',
  conditions: 'Some products are not a good fit with certain conditions, so we filter those out. Prefer not to answer is fine.',
  allergies: 'Products with these ingredients or materials never show up in your picks.',
  medications: 'Some supplements interact with medicines, for example St. John’s wort with birth control. We flag those.',
};
export const ONBOARDING_WHY = WHY;
// The app's tab is Home; the website's is still Today (QA, Oct 25).
const WHY_WEB = {
  support: 'Each one you pick gets its own matches and its own place on Today. Pick things you want to learn about too, like birth control. You can change this anytime in You, then My health.',
  goals: 'Goals shape what Today talks about. They never change a match score.',
};

// New first-run titles (sentence case, plain words). Step types and saved
// fields stay those of intakeModel.js.
const TITLES = {
  // Nov 3 (founder: "a 5 year old should be able to fill this out"): short, plain words.
  // Nov 9 focus group: people skipped things they live with but don't call a problem
  // (heavy periods) and ended up with an empty profile. Say those count, and where to change it.
  support: { title: 'What do you want help with?', subtitle: 'Include things you live with too, like heavy periods.' },
  periodFlow: { title: 'How heavy is your period flow?', subtitle: 'On a typical heavy day' },
  periodPain: { title: 'How much do period cramps get in your way?' },
  ttcDuration: { title: 'How long have you been trying to get pregnant?' },
  pregnancyTrimester: { title: 'How far along is your pregnancy?' },
  safety: { title: 'Is anything new or getting worse fast?', subtitle: 'Like new pain, or something that feels very wrong.' },
  age: { title: 'How old are you?' },
  lifeStage: { title: 'Which of these is you right now?', subtitle: 'Pick all that fit. Not sure is OK.' },
  formats: { title: 'Which kinds of products do you like using?' },
  priceRange: { title: 'What would you usually spend on one product?' },
  avoidIngredients: { title: 'Anything you want your products to avoid?', type: 'avoidOnly' },
  fsaHsa: { title: 'Do you have an FSA or HSA?', subtitle: 'These are accounts, often through work, that let you pay for eligible health costs with money before tax. Some health products qualify.' },
  trust: { title: 'What matters most when you pick a product?', subtitle: 'Drag to rank. Evidence comes first unless you change it.' },
  conditions: { title: 'Any diagnosed conditions?', subtitle: 'Only ones a clinician has diagnosed' },
  allergies: { title: 'Any allergies or sensitivities?' },
  medications: { title: 'Taking any medicines or supplements?' },
};

const SCREEN_OF = {
  support: 3, periodFlow: 3, periodPain: 3, utiFrequency: 3, safety: 3,
  age: 2, lifeStage: 2, ttcDuration: 2, postpartumTiming: 2, pregnancyTrimester: 2,
  formats: 5, priceRange: 5, avoidIngredients: 5, preferIngredients: 5, fsaHsa: 5, trust: 5,
  products: 5, avoidRepeat: 5, brandOpenness: 5, zip: 5, recommendationCount: 5, anythingElse: 5,
  conditions: 6, allergies: 6, medications: 6,
};
const SCREEN_ORDER = {
  2: ['age', 'lifeStage', 'ttcDuration', 'postpartumTiming', 'pregnancyTrimester'],
  3: ['support', 'periodFlow', 'periodPain', 'utiFrequency', 'safety'],
  // Founder, Nov 12 ("some quiz questions are missing from onboarding, like ZIP code"): every
  // question in the full quiz is in "more", after her matches (the first part stays four questions).
  5: ['products', 'avoidRepeat', 'formats', 'priceRange', 'brandOpenness', 'avoidIngredients', 'preferIngredients', 'fsaHsa', 'zip', 'trust', 'recommendationCount', 'anythingElse'],
  6: ['conditions', 'allergies', 'medications'],
};
// Optional detail she can add on screen 6 (cycle and pregnancy information).
const DEEPER_OPTIONAL = ['periodFlow', 'ttcDuration', 'pregnancyTrimester'];
/** Steps left for later, asked one at a time after the first run. */
// Nov 12: all but trustedBrands are now in "more" (founder: none missing from onboarding).
export const LATER_STEP_IDS = ['trustedBrands'];

/**
 * The first-run sequence: [{ ...intakeStep, screen, why, required }].
 * Required steps (getIntakeSteps' required list) are all here, so finishing
 * the first run is the same "minimum complete" as finishing the old quiz.
 */
export function getOnboardingSteps(intake, { part = 'all', surface = 'app' } = {}) {
  const WHY_FOR = surface === 'web' ? { ...WHY, ...WHY_WEB } : WHY;
  const all = getIntakeSteps(intake);
  const byId = new Map(all.map((s) => [s.id, s]));
  // Same saved field as "avoid", asked as its own plain question (team direction, section 30).
  const avoid = byId.get('avoidIngredients');
  if (avoid) byId.set('preferIngredients', { ...avoid, id: 'preferIngredients', type: 'wantOnly', title: 'Anything you prefer your products to have or be?' });
  const decorate = (s, screen, extra = {}) => ({ ...s, ...(TITLES[s.id] || {}), screen, why: WHY_FOR[s.id] || s.info, ...extra });
  const out = [];
  // Order (founder, Oct 29): name, age, life stage, then what she wants help
  // with and what she's experiencing, goals, preferences, safety.
  // Her first name is its own optional screen, before her age (critique, Oct 27:
  // name and age were two questions in one card). Saved in the same field.
  out.push({ id: 'name', section: 'core', type: 'name', title: 'What should we call you?', screen: 2, why: WHY_FOR.name, required: false, optional: false, phase: 'required' });
  const helpTopicsStep = { id: 'helpTopics', section: 'help', type: 'topics', title: 'What would you like ayna to help you with?', subtitle: 'You don’t need a diagnosis to use ayna.', screen: 3, why: WHY_FOR.helpTopics, required: false, optional: false, phase: 'required' };
  for (const n of [2, 3, 4, 5, 6]) {
    if (n === 3) out.push(helpTopicsStep);
    if (n === 4) {
      out.push({ id: 'goals', section: 'goals', type: 'goals', title: 'What do you want ayna to help you do?', screen: 4, why: WHY_FOR.goals, required: false, optional: true, phase: 'optional' });
      continue;
    }
    for (const id of SCREEN_ORDER[n]) {
      const s = byId.get(id);
      if (!s) continue;
      // Optional cycle and pregnancy detail moves to screen 6.
      if (!s.required && DEEPER_OPTIONAL.includes(id)) continue;
      out.push(decorate(s, SCREEN_OF[id]));
    }
    if (n === 6) {
      for (const id of DEEPER_OPTIONAL) {
        const s = byId.get(id);
        if (s && !s.required && !out.some((o) => o.id === id)) out.push(decorate(s, 6, { why: `${WHY_FOR[id]} Optional.` }));
      }
    }
  }
  const steps = out.map((s) => ({ ...s, safety: s.screen === 6 && s.required, afterReveal: AFTER_REVEAL.has(s.id) }));
  // Nov 3 (founder: "onboarding too heavy"; 3 of 21 website visitors who started
  // finished): four screens, then her matches. Her name and the three safety
  // questions (conditions, allergies, medicines) come right after the reveal,
  // first in "more". Nothing loosens: until they're answered, anything she
  // takes is held ("needs information"), never shown as a match.
  // The topic screen ("What would you like ayna to help you with?") only filtered the
  // next screen and read like it; the matcher never used it. The first part is now
  // 4 questions that all feed the matcher: age, life stage, what she wants help with
  // (her needs), and the urgent check. Topics stay editable from her profile.
  if (part === 'core') return steps.filter((s) => !s.optional && !s.afterReveal && s.id !== 'helpTopics');
  if (part === 'more') return [...steps.filter((s) => s.afterReveal && s.id !== 'name'), ...steps.filter((s) => s.optional && !s.afterReveal), ...steps.filter((s) => s.id === 'name')];
  return steps;
}

/** Asked right after the reveal, not before it (Nov 3). */
export const AFTER_REVEAL = new Set(['name', 'conditions', 'allergies', 'medications']);

/** Screens in the first part, health data (7) last. */
export const CORE_SCREENS = [1, 2, 3, 6, 7];
/** Progress words and numbers for a first-run step: { label, now, total }. */
export function onboardingProgress(step, part, list = []) {
  if (part === 'more') {
    const now = Math.max(1, list.findIndex((s) => s.id === step.id) + 1);
    return { label: `More about you, ${now} of ${list.length}`, now, total: list.length };
  }
  // Every screen she sees counts (critique, Oct 27: four sub-screens all said
  // "Step 2 of 5"). The total can grow when an answer adds a follow-up.
  const core = (list || []).filter((s) => s.id !== 'ready');
  const at = core.findIndex((s) => s.id === step.id);
  // Audit (Nov 12): the label said "Step 3 of 4", then "Step 4 of 6" once her needs added
  // follow-ups. A total that grows reads as a broken promise (NN/g, progress indicators), so the
  // total only shows once "What do you want help with?" is answered and the count can't change.
  const settled = core.findIndex((s) => s.id === 'support');
  if (at >= 0 && settled >= 0 && at <= settled) return { label: `Step ${at + 1}`, now: at + 1, total: core.length };
  if (at >= 0) return { label: `Step ${at + 1} of ${core.length}`, now: at + 1, total: core.length };
  const now = Math.max(1, CORE_SCREENS.indexOf(step.screen) + 1);
  return { label: `Step ${now} of ${CORE_SCREENS.length}`, now, total: CORE_SCREENS.length };
}

/** Which of the seven screens a step sits on (7 is health data). */
export function screenOf(stepId, intake) {
  if (stepId === 'connect') return 7;
  return getOnboardingSteps(intake).find((s) => s.id === stepId)?.screen || 1;
}

/** Optional setup questions she has neither answered nor skipped (for "Make my matches more personal"). */
export function moreRemaining(intake) {
  if (!intake) return 0;
  const skipped = intake.skippedSteps || [];
  return getOnboardingSteps(intake, { part: 'more' }).filter((s) => !isStepAnswered(s.id, intake) && !skipped.includes(s.id)).length;
}
