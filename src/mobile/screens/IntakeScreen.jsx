import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';
import { getFirstIncompleteStepId, getIncompleteStepIds } from '../utils/profileCompleteness.js';

// Mirrors the real onboarding form's one-question-per-step wizard from
// src/components/HealthIntakeForm.jsx (a full redesign — SUPPORT_GROUPS,
// LIFE_STAGES, branching helpers, and buildSnapshot() below are ported
// near-verbatim from that file's `intakeVersion: 'beta-redesign-2026-09'`).
// Keep in sync if the real intake changes again.
//
// Not ported to mobile:
// - sessionStorage draft persistence (DRAFT_KEY on desktop) — the rest of
//   this app doesn't persist in-progress screen state either, so a fresh
//   quiz each time it's opened is consistent with existing mobile behavior.
// - Server-side save (saveHealthIntakeForCurrentUser) — no real signed-in
//   session exists in the mobile app yet, same reasoning as elsewhere in
//   this build. onComplete still receives the exact same
//   mapIntakeToLegacyQuizProfile(...) shape the recommendation engine
//   expects, so matching works identically to the web version.
// - The "what matters to you" trust ranking uses real drag-to-reorder, but
//   built on Pointer Events rather than HTML5 native drag-and-drop, which
//   doesn't fire reliably on touchscreens (see TrustRanker below).

/* ------------------------------- Data ------------------------------- */

const SUPPORT_GROUPS = [
  {
    label: 'Period + cycle',
    items: [
      'Period product support', 'Cramps or period pain', 'Pelvic pain', 'Heavy periods', 'Light periods',
      'Irregular periods', 'Missed periods', 'Spotting between periods', 'PMS symptoms', 'PMDD symptoms',
      'Breast tenderness', 'Cycle-related headaches or migraines',
    ],
  },
  {
    label: 'Hormonal + reproductive',
    items: ['PCOS support', 'Endometriosis support', 'Fibroid-related concerns', 'Adenomyosis-related concerns', 'Hormone-related symptoms', 'Cycle-related bloating', 'Nausea'],
  },
  { label: 'Fertility', items: ['Fertility support', 'Trying to conceive', 'Ovulation tracking or support'] },
  { label: 'Pregnancy', items: ['Prenatal or pregnancy support', 'Pregnancy-related discomfort', 'Pregnancy-safe product discovery'] },
  { label: 'Postpartum', items: ['Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes'] },
  { label: 'Vaginal health', items: ['Vaginal dryness', 'Vaginal itching or irritation', 'Unusual vaginal discharge', 'Vaginal odor', 'BV concerns', 'Yeast infection concerns'] },
  { label: 'Urinary health', items: ['Burning with urination', 'Frequent urination', 'Urinary urgency', 'Recurrent UTI-like symptoms', 'Bladder leakage or incontinence'] },
  { label: 'Sexual + reproductive health', items: ['Pain or discomfort during sex', 'Low libido or libido changes', 'Sexual wellness or comfort', 'Contraception', 'STI-related concerns'] },
  { label: 'Perimenopause + menopause + post-menopause', items: ['Hot flashes', 'Night sweats', 'Joint aches', 'Menopause-related body changes'] },
  { label: 'Mood + mental wellbeing', items: ['Mood swings', 'Irritability', 'Anxiety', 'Low mood', 'Cycle-related mood changes'] },
  { label: 'Sleep + energy + cognition', items: ['Fatigue or low energy', 'Trouble sleeping', 'Brain fog', 'Difficulty concentrating'] },
  { label: 'Digestive health', items: ['Constipation', 'Diarrhea', 'Gas', 'Abdominal discomfort', 'Digestive bloating'] },
  { label: 'Skin + hair', items: ['Acne', 'Hair thinning or hair loss', 'Excess facial or body hair', 'Other hormone-related skin concerns'] },
  { label: 'Metabolic + physical wellness', items: ['Metabolism or weight support', 'Strength or fitness', 'Bone health'] },
  { label: 'Care access', items: ['Finding a doctor or specialist', 'Finding a telehealth provider'] },
  { label: 'Other', items: ['Something else', 'Nothing right now'] },
];

const LIFE_STAGES = [
  'I get periods regularly', 'My periods are irregular', 'I do not currently get periods',
  'I use hormonal birth control', 'I am trying to conceive', 'I am pregnant', 'I am postpartum',
  'I am in perimenopause', 'I am in menopause', 'I am post-menopause', 'Other',
];

const PERIOD_FLOW = ['Very light', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'It varies', 'I do not currently get periods', 'Not sure'];
const PERIOD_PAIN = ['None', 'Mild', 'Moderate', 'Severe', 'Very severe', 'It varies', 'Not sure'];
const UTI_FREQUENCY = ['This is the first time', 'Rarely', 'A few times a year', 'About monthly', 'More than once a month', 'I am experiencing them right now', 'Not sure'];
const POSTPARTUM_TIMING = ['Less than 6 weeks ago', '6 weeks–3 months ago', '3–6 months ago', '6–12 months ago', 'More than 12 months ago'];
const PREGNANCY_TRIMESTER = ['First trimester', 'Second trimester', 'Third trimester', 'Not sure', 'Prefer not to say'];
const PERIMENOPAUSE_LAST_PERIOD = ['Within the past 3 months', '3–6 months ago', '6–12 months ago', 'More than 12 months ago', "I'm not sure", 'Prefer not to say'];

const CONDITIONS = [
  'PCOS', 'Endometriosis', 'Fibroids', 'Adenomyosis', 'PMS', 'PMDD', 'Infertility', 'Thyroid condition',
  'Diabetes', 'Insulin resistance', 'High blood pressure', 'Migraine with aura', 'Anemia or iron deficiency',
  'IBS or another digestive condition', 'Autoimmune condition', 'Anxiety', 'Depression', 'Other / not listed',
  'None that I know of', 'Prefer not to say',
];

const ALLERGIES = [
  'Latex', 'Fragrance', 'Adhesives', 'NSAIDs such as ibuprofen', 'Acetaminophen', 'Aspirin', 'Antibiotics',
  'Hormonal medications', 'Topical ingredients', 'Supplements or herbal ingredients',
  'Nickel', 'Essential oils', 'Dyes', 'Preservatives', 'Gluten', 'Soy', 'Dairy',
];

const MEDICATION_SUGGESTIONS = [
  'Zoloft', 'Sertraline', 'Lexapro', 'Escitalopram', 'Prozac', 'Fluoxetine', 'Wellbutrin', 'Bupropion',
  'Buspirone', 'Celexa', 'Citalopram', 'Cymbalta', 'Duloxetine', 'Paxil', 'Paroxetine',
  'Vyvanse', 'Lisdexamfetamine', 'Adderall', 'Amphetamine/dextroamphetamine',
  'Accutane', 'Isotretinoin', 'Tretinoin', 'Doxycycline',
  'Metformin', 'Spironolactone', 'Levothyroxine', 'Synthroid', 'Letrozole', 'Clomiphene',
  'Ozempic', 'Semaglutide', 'Wegovy',
  'Ibuprofen', 'Naproxen', 'Acetaminophen',
  'Melatonin', 'Magnesium', 'Vitamin D', 'Vitamin B12', 'Iron', 'Folic acid', 'Prenatal vitamin',
  'Omega-3', 'Probiotic', 'Multivitamin', 'Biotin', 'Inositol', 'Myo-inositol',
  'Birth control pill', 'Yaz', 'Drospirenone/ethinyl estradiol', 'Hormonal IUD', 'Copper IUD',
  'Nexplanon', 'Depo-Provera', 'NuvaRing', 'Xulane patch',
];

const CATALOG_PRODUCT_NAMES = [...new Set((ALL_PRODUCTS || []).map((p) => p?.name).filter(Boolean))];
const CATALOG_BRANDS = [...new Set((ALL_PRODUCTS || []).flatMap((p) => [p?.brand, p?.brandName, p?.manufacturer, p?.company]).filter(Boolean))];
const COMMON_BRAND_SUGGESTIONS = [
  'LOLA', 'Cora', 'The Honey Pot', 'Rael', 'Saalt', 'August', 'Always', 'Tampax', 'U by Kotex',
  'Ritual', 'O Positiv', 'Love Wellness', 'Thorne', 'Nature Made', 'Garden of Life', 'Good Clean Love',
];
const BRAND_SUGGESTIONS = [...new Set([...CATALOG_BRANDS, ...COMMON_BRAND_SUGGESTIONS])];
const PRODUCT_OR_BRAND_SUGGESTIONS = [...new Set([...CATALOG_PRODUCT_NAMES, ...BRAND_SUGGESTIONS])];

const PRODUCT_FORMATS = [
  'Pills or capsules', 'Gummies', 'Powders', 'Drinks or teas', 'Creams, lotions, or gels', 'Patches',
  'Suppositories', 'Devices or wearables', 'Period-care products', 'No preference', 'Other',
];

// One real icon per product format, keyed to the exact option strings above
// (design pattern B1/E1 tiles) — line-art only, drawn with `currentColor` so
// each tile's badge can recolor with the tile's own selected/unselected ink.
const FORMAT_ICONS = {
  'Pills or capsules': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="10.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 14)" stroke="currentColor" strokeWidth="1.8" /><path d="M9.5 8.2l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  Gummies: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4c3 0 5 2.2 5 5 0 1-.3 1.7-.8 2.4.9.5 1.6 1.5 1.6 3 0 2.5-2.1 4.6-4.7 4.6-1 0-1.9-.3-2.6-.8-.7.5-1.6.8-2.6.8-2.6 0-4.7-2-4.7-4.6 0-1.5.7-2.5 1.6-3-.5-.7-.8-1.4-.8-2.4 0-2.8 2-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  ),
  Powders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 3h8l1 4H7l1-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M6 8h12l1.2 10.4a2 2 0 0 1-2 2.6H6.8a2 2 0 0 1-2-2.6L6 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 12h6M8.5 15.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  'Drinks or teas': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 8h11l-1 9.5A2 2 0 0 1 13 19.3H8a2 2 0 0 1-2-1.8L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" stroke="currentColor" strokeWidth="1.8" /><path d="M8 5.2c.4-.7 0-1-.3-1.5M12 5.2c.4-.7 0-1-.3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  'Creams, lotions, or gels': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 10c0-3 1.8-6 4-6.8C14.2 4 16 7 16 10v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8 10h8" stroke="currentColor" strokeWidth="1.8" /></svg>
  ),
  Patches: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M7 7l1.6 1.6M17 7l-1.6 1.6M7 17l1.6-1.6M17 17l-1.6-1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
  ),
  Suppositories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3c2 2 3 5 3 8.5 0 4-1.3 7-3 9.5-1.7-2.5-3-5.5-3-9.5C9 8 10 5 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  ),
  'Devices or wearables': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  'Period-care products': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3.5c3 4 6 8 6 11.5a6 6 0 1 1-12 0c0-3.5 3-7.5 6-11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  ),
  'No preference': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M6.5 17.5l11-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  ),
  Other: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="18" cy="12" r="1.6" fill="currentColor" /></svg>
  ),
};
const PRICE_RANGES = ['Under $25', '$25–$75', '$75–$150', '$150+', 'Price is not a major factor for me'];
const PRICE_BAND_SUBTITLES = {
  'Under $25': 'Everyday basics',
  '$25–$75': 'Most supplements',
  '$75–$150': 'Devices, longer courses',
  '$150+': 'Bigger investments',
};
const LARGE_PURCHASE_FREQUENCY = ['Never', 'Rarely', 'A few times a year', 'About once a month', 'More than once a month'];
const BRAND_OPENNESS = [
  'I mostly stick with brands I already trust',
  'I prefer trusted brands but am open to something new',
  'I like a mix of familiar and new brands',
  'I enjoy discovering new brands',
  'No preference',
];
const AVOID_INGREDIENTS = [
  'Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials',
  'Animal-derived', 'Added sugar', 'Artificial sweeteners', 'Pregnancy considerations',
  'Fragrance-free', 'Dye-free', 'Paraben-free', 'Sulfate-free', 'Latex-free', 'Vegan', 'Cruelty-free',
  'Black-owned', 'Brown-owned', 'Eco-friendly', 'Reusable', 'Organic', 'Minimal ingredients',
  'Sensitive skin', 'Unscented', 'Other', 'No preference',
];
const FSA_HSA = ['FSA', 'HSA', 'Both', 'No', 'Not sure'];
const TRUST_ITEMS = ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'];
const STOP_REASONS = [
  'It did not help', 'It stopped working', 'I had side effects or a reaction', 'It was too expensive',
  'It was inconvenient', 'I did not like the format', 'I found something better',
  'A clinician recommended stopping it', 'I simply did not repurchase it', 'Other',
];

const EMPTY = {
  age: '', lifeStage: '', lifeStageSelections: [], lifeStageOther: '', zipcode: '',
  supportSelections: [], supportOtherText: '',
  periodFlow: '', periodPain: '', utiFrequency: '', ttcDuration: '', postpartumTiming: '',
  pregnancyTrimester: '', breastfeedingStatus: '', perimenopauseLastPeriod: '',
  diagnosisSelections: [], conditionOtherText: '',
  allergyStatus: '', allergyItems: [], allergySelections: [], allergyOtherText: '',
  takesCurrent: '', currentMedicationItems: [],
  productHistory: [], avoidRepeat: [], safetyConcern: '',
  preferredFormats: [], formatOtherText: '', priceRange: [], largePurchaseFrequency: '',
  brandOpenness: '', trustedBrands: [], brandSupportPreferences: [],
  avoidIngredients: [], avoidIngredientsOtherText: '', fsaHsaAnswer: '',
  trustRanking: TRUST_ITEMS, trustRankingTouched: false, anythingElse: '',
};

// Field-name map from the legacy snapshot shape (buildSnapshot()'s output,
// what quizAnswers.fullHealthIntake actually holds) back to this wizard's
// own EMPTY-shaped state, for resuming an already-completed intake instead
// of starting over. Most fields are direct passthroughs in buildSnapshot
// (see below), so reconstruction is lossless for everything listed here;
// fsaHsa is the one field buildSnapshot maps to a different slug, so it
// gets a real reverse-lookup instead of a passthrough.
const FSA_HSA_REVERSE = { fsa: 'FSA', hsa: 'HSA', both: 'Both', none: 'No', unsure: 'Not sure' };
const RESUMABLE_PASSTHROUGH_FIELDS = [
  'age', 'lifeStage', 'lifeStageSelections', 'lifeStageOther', 'zipcode',
  'supportSelections', 'supportOtherText',
  'periodFlow', 'periodPain', 'utiFrequency', 'postpartumTiming', 'pregnancyTrimester',
  'breastfeedingStatus', 'perimenopauseLastPeriod',
  'diagnosisSelections', 'conditionOtherText',
  'allergyStatus', 'allergyItems',
  'takesCurrent', 'currentMedicationItems',
  'productHistory', 'avoidRepeat', 'safetyConcern',
  'preferredFormats', 'formatOtherText', 'priceRange', 'largePurchaseFrequency',
  'brandOpenness', 'trustedBrands',
  'avoidIngredients', 'avoidIngredientsOtherText',
  'anythingElse',
];

function reconstructIntakeFromSnapshot(snapshot) {
  if (!snapshot) return EMPTY;
  const next = { ...EMPTY };
  RESUMABLE_PASSTHROUGH_FIELDS.forEach((key) => {
    if (snapshot[key] !== undefined && snapshot[key] !== null) next[key] = snapshot[key];
  });
  if (snapshot.fsaHsa) next.fsaHsaAnswer = FSA_HSA_REVERSE[snapshot.fsaHsa] || '';
  if (Array.isArray(snapshot.trustRanking) && snapshot.trustRanking.length > 0) {
    next.trustRanking = snapshot.trustRanking;
    next.trustRankingTouched = true;
  }
  return next;
}

const SECTION_LABELS = {
  core: 'Core profile', support: 'What you are looking for', safety: 'Health & safety',
  history: 'What you have tried', preferences: 'Shopping preferences', trust: 'What matters to you',
};

const PERIOD_TRIGGER = new Set([
  'Period product support', 'Cramps or period pain', 'Pelvic pain', 'Heavy periods', 'Light periods',
  'Irregular periods', 'Missed periods', 'Spotting between periods', 'PMS symptoms', 'PMDD symptoms',
  'Breast tenderness', 'Cycle-related headaches or migraines',
]);
const UTI_TRIGGER = new Set(['Burning with urination', 'Frequent urination', 'Urinary urgency', 'Recurrent UTI-like symptoms']);
const TTC_TRIGGER = new Set(['Fertility support', 'Trying to conceive', 'Ovulation tracking or support']);
const PREGNANCY_TRIGGER = new Set(['Prenatal or pregnancy support', 'Pregnancy-related discomfort', 'Pregnancy-safe product discovery']);
const POSTPARTUM_TRIGGER = new Set(['Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes']);

const LEGACY_CONCERN_BY_ITEM = {
  'Period product support': 'Period care (pads, tampons, cups, discs, underwear)',
  'Cramps or period pain': 'Cramp and pain relief (devices, supplements, heat)',
  'Pelvic pain': 'Sexual health and comfort (lubricants, pelvic floor)',
  'Heavy periods': 'Period care (pads, tampons, cups, discs, underwear)',
  'Light periods': 'Period care (pads, tampons, cups, discs, underwear)',
  'Irregular periods': 'Hormone balance (supplements, lifestyle)',
  'Missed periods': 'Hormone balance (supplements, lifestyle)',
  'Spotting between periods': 'Hormone balance (supplements, lifestyle)',
  'PMS symptoms': 'Mental health and cycle mood support',
  'PMDD symptoms': 'Mental health and cycle mood support',
  'Breast tenderness': 'Hormone balance (supplements, lifestyle)',
  'Cycle-related headaches or migraines': 'Mental health and cycle mood support',
  'PCOS support': 'PCOS management (supplements, telehealth, apps)',
  'Endometriosis support': 'Endometriosis management (supplements, devices, telehealth)',
  'Fibroid-related concerns': 'Hormone balance (supplements, lifestyle)',
  'Adenomyosis-related concerns': 'Hormone balance (supplements, lifestyle)',
  'Hormone-related symptoms': 'Hormone balance (supplements, lifestyle)',
  'Cycle-related bloating': 'Hormonal bloating',
  Nausea: 'Hormone balance (supplements, lifestyle)',
  'Fertility support': 'Fertility and conception (supplements, trackers, telehealth)',
  'Trying to conceive': 'Fertility and conception (supplements, trackers, telehealth)',
  'Ovulation tracking or support': 'Fertility and conception (supplements, trackers, telehealth)',
  'Prenatal or pregnancy support': 'Pregnancy support (prenatal vitamins, trackers, comfort)',
  'Pregnancy-related discomfort': 'Pregnancy support (prenatal vitamins, trackers, comfort)',
  'Pregnancy-safe product discovery': 'Pregnancy support (prenatal vitamins, trackers, comfort)',
  'Postpartum recovery': 'Postpartum recovery (nursing, healing, comfort)',
  'Breastfeeding or lactation support': 'Postpartum recovery (nursing, healing, comfort)',
  'Postpartum body or skin changes': 'Postpartum recovery (nursing, healing, comfort)',
  'Vaginal dryness': 'Gut and vaginal health (probiotics, pH balance)',
  'Vaginal itching or irritation': 'Gut and vaginal health (probiotics, pH balance)',
  'Unusual vaginal discharge': 'Gut and vaginal health (probiotics, pH balance)',
  'Vaginal odor': 'Gut and vaginal health (probiotics, pH balance)',
  'BV concerns': 'Gut and vaginal health (probiotics, pH balance)',
  'Yeast infection concerns': 'Gut and vaginal health (probiotics, pH balance)',
  'Burning with urination': 'UTI support',
  'Frequent urination': 'UTI support',
  'Urinary urgency': 'UTI support',
  'Recurrent UTI-like symptoms': 'UTI support',
  'Bladder leakage or incontinence': 'Sexual health and comfort (lubricants, pelvic floor)',
  'Pain or discomfort during sex': 'Sexual health and comfort (lubricants, pelvic floor)',
  'Low libido or libido changes': 'Sexual health and comfort (lubricants, pelvic floor)',
  'Sexual wellness or comfort': 'Sexual health and comfort (lubricants, pelvic floor)',
  Contraception: 'Telehealth and provider matching',
  'STI-related concerns': 'STI support',
  'Hot flashes': 'Perimenopause and menopause support',
  'Night sweats': 'Perimenopause and menopause support',
  'Joint aches': 'Perimenopause and menopause support',
  'Menopause-related body changes': 'Perimenopause and menopause support',
  'Mood swings': 'Mental health and cycle mood support',
  Irritability: 'Mental health and cycle mood support',
  Anxiety: 'Mental health and cycle mood support',
  'Low mood': 'Mental health and cycle mood support',
  'Cycle-related mood changes': 'Mental health and cycle mood support',
  'Fatigue or low energy': 'Sleep and energy',
  'Trouble sleeping': 'Sleep and energy',
  'Brain fog': 'Sleep and energy',
  'Difficulty concentrating': 'Sleep and energy',
  Constipation: 'Gut and vaginal health (probiotics, pH balance)',
  Diarrhea: 'Gut and vaginal health (probiotics, pH balance)',
  Gas: 'Gut and vaginal health (probiotics, pH balance)',
  'Abdominal discomfort': 'Gut and vaginal health (probiotics, pH balance)',
  'Digestive bloating': 'Gut and vaginal health (probiotics, pH balance)',
  Acne: 'Skin and hair (hormone-related)',
  'Hair thinning or hair loss': 'Skin and hair (hormone-related)',
  'Excess facial or body hair': 'Skin and hair (hormone-related)',
  'Other hormone-related skin concerns': 'Skin and hair (hormone-related)',
  'Metabolism or weight support': 'Hormone balance (supplements, lifestyle)',
  'Strength or fitness': 'Sleep and energy',
  'Bone health': 'Perimenopause and menopause support',
  'Finding a doctor or specialist': 'Telehealth and provider matching',
  'Finding a telehealth provider': 'Telehealth and provider matching',
};

const CONDITION_TO_LEGACY = {
  PCOS: 'PCOS', Endometriosis: 'endometriosis', Fibroids: 'fibroids', Adenomyosis: 'adenomyosis',
  PMDD: 'PMDD', 'Anemia or iron deficiency': 'anemia / iron deficiency',
};

const FORMAT_TO_LEGACY = {
  'Pills or capsules': 'supplements', Gummies: 'supplements', Powders: 'supplements', 'Drinks or teas': 'supplements',
  'Creams, lotions, or gels': 'topicals', Patches: 'devices', Suppositories: 'personal care',
  'Devices or wearables': 'devices', 'Period-care products': 'pads',
};

const PREFERENCE_MAP = {
  Fragrance: 'fragrance-free', Dyes: 'dye-free', Parabens: 'paraben-free', Sulfates: 'sulfate-free',
  Phthalates: 'phthalate-free', Latex: 'latex-free', 'Synthetic materials': 'natural-materials',
  'Animal-derived ingredients': 'vegan', 'Added sugar': 'sugar-free', 'Artificial sweeteners': 'no-artificial-sweeteners',
};

function arrayHasAny(arr, set) {
  return (arr || []).some((value) => set.has(value));
}
function getLifeStages(intake) {
  const selected = Array.isArray(intake.lifeStageSelections) ? intake.lifeStageSelections.filter(Boolean) : [];
  if (selected.length) return selected;
  return intake.lifeStage ? [intake.lifeStage] : [];
}
function hasLifeStage(intake, value) {
  return getLifeStages(intake).includes(value);
}
function isPeriodRelevant(intake) {
  const lifeStages = getLifeStages(intake);

  if (
    lifeStages.includes('I am in menopause')
    || lifeStages.includes('I am post-menopause')
  ) {
    return false;
  }

  return lifeStages.some((value) =>
    ['I get periods regularly', 'My periods are irregular'].includes(value)
  ) || arrayHasAny(intake.supportSelections, PERIOD_TRIGGER);
}
function isUtiRelevant(intake) {
  return arrayHasAny(intake.supportSelections, UTI_TRIGGER);
}
function isTtcRelevant(intake) {
  return hasLifeStage(intake, 'I am trying to conceive') || arrayHasAny(intake.supportSelections, TTC_TRIGGER);
}
function isPregnancyRelevant(intake) {
  return hasLifeStage(intake, 'I am pregnant') || arrayHasAny(intake.supportSelections, PREGNANCY_TRIGGER);
}
function isPostpartumRelevant(intake) {
  return hasLifeStage(intake, 'I am postpartum') || arrayHasAny(intake.supportSelections, POSTPARTUM_TRIGGER);
}

function buildSnapshot(intake) {
  const lifeStageSelections = getLifeStages(intake);
  const primaryLifeStage = intake.lifeStage || lifeStageSelections[0] || '';
  const primaryConcerns = [...new Set((intake.supportSelections || []).map((item) => LEGACY_CONCERN_BY_ITEM[item]).filter(Boolean))];
  const customConcerns = intake.supportOtherText.trim()
    ? [intake.supportOtherText.trim()]
    : [];

  const conditions = (intake.diagnosisSelections || [])
    .filter((v) => !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(v))
    .map((v) => CONDITION_TO_LEGACY[v] || v.toLowerCase());
  if (intake.diagnosisSelections.includes('Other / not listed') && intake.conditionOtherText.trim()) conditions.push('other');

  const menstrualCycle = {
    'I get periods regularly': 'yes',
    'My periods are irregular': 'irregular',
    'I do not currently get periods': 'no',
    'I use hormonal birth control': 'yes',
    'I am trying to conceive': 'yes',
    'I am pregnant': 'no',
    'I am in perimenopause': 'irregular_perimenopause',
    'I am in menopause': 'no_menopause',
    'I am post-menopause': 'no_menopause',
  }[primaryLifeStage] || '';

  const flowLevel = { 'Very light': 'light', Light: 'light', Moderate: 'medium', Heavy: 'heavy', 'Very heavy': 'very heavy' }[intake.periodFlow] || '';
  const painLevel = { None: '0', Mild: '2', Moderate: '5', Severe: '8', 'Very severe': '10' }[intake.periodPain] || '';

  const symptomTokens = [];
  if ((intake.supportSelections || []).includes('Cramps or period pain')) symptomTokens.push('cramps');
  if ((intake.supportSelections || []).some((x) => /bloating/i.test(x))) symptomTokens.push('bloating');
  if ((intake.supportSelections || []).includes('Nausea')) symptomTokens.push('nausea');
  if ((intake.supportSelections || []).includes('Fatigue or low energy')) symptomTokens.push('fatigue');
  if ((intake.supportSelections || []).includes('Brain fog')) symptomTokens.push('brain fog');
  if ((intake.supportSelections || []).includes('Breast tenderness')) symptomTokens.push('breast tenderness');

  const usedNames = (intake.productHistory || []).map((p) => p.name).filter(Boolean);
  const automaticallyAvoid = (intake.productHistory || [])
    .filter((p) => p.worked === 'Made things worse' || p.reaction === 'Serious or concerning reaction')
    .map((p) => p.name)
    .filter(Boolean);
  const dislikedProducts = [...new Set([...(intake.avoidRepeat || []), ...automaticallyAvoid])];
  const dislikedReason = (intake.productHistory || [])
    .filter((p) => p.name && ((p.stopReasons || []).length || p.reactionText))
    .map((p) => `${p.name}: ${[...(p.stopReasons || []), p.reactionText].filter(Boolean).join(', ')}`)
    .join('; ');

  const allergies = intake.allergyStatus === 'Yes' ? [...new Set((intake.allergyItems || []).filter(Boolean))] : [];
  const legacyAllergySelections = intake.allergyStatus === 'Yes'
    ? allergies
    : intake.allergyStatus === 'No'
      ? ['None known']
      : intake.allergyStatus === "I'm not sure"
        ? ['Not sure']
        : [];

  const productPreferences = [...new Set((intake.avoidIngredients || []).map((x) => PREFERENCE_MAP[x]).filter(Boolean))];
  const preferredProductTypes = [...new Set((intake.preferredFormats || []).map((x) => FORMAT_TO_LEGACY[x]).filter(Boolean))];
  const fsaHsa = { FSA: 'fsa', HSA: 'hsa', Both: 'both', No: 'none', 'Not sure': 'unsure' }[intake.fsaHsaAnswer] || '';

  return {
    age: intake.age,
    zipcode: intake.zipcode.trim(),
    location: '',
    lifeStage: primaryLifeStage,
    lifeStageSelections,
    lifeStageOther: intake.lifeStageOther.trim(),
    supportSelections: intake.supportSelections,
    supportOtherText: intake.supportOtherText.trim(),
    primaryConcerns,
    customConcerns,
    concernFollowups: {},
    menstrualCycle,
    flowLevel,
    painLevel,
    symptoms: symptomTokens,
    periodFlow: isPeriodRelevant(intake) ? intake.periodFlow : '',
    periodPain: isPeriodRelevant(intake) ? intake.periodPain : '',
    utiFrequency: isUtiRelevant(intake) ? intake.utiFrequency : '',
    ttcDuration: '',
    postpartumTiming: isPostpartumRelevant(intake) ? intake.postpartumTiming : '',
    pregnancyTrimester: isPregnancyRelevant(intake) ? intake.pregnancyTrimester : '',
    breastfeedingStatus: hasLifeStage(intake, 'I am postpartum') ? intake.breastfeedingStatus : '',
    perimenopauseLastPeriod: hasLifeStage(intake, 'I am in perimenopause') ? intake.perimenopauseLastPeriod : '',
    diagnosisSelections: intake.diagnosisSelections,
    conditions,
    conditionOtherText: intake.conditionOtherText.trim(),
    allergyStatus: intake.allergyStatus,
    allergyItems: intake.allergyStatus === 'Yes' ? intake.allergyItems : [],
    allergySelections: legacyAllergySelections,
    allergyOtherText: '',
    allergies,
    takesCurrent: intake.takesCurrent,
    currentMedicationItems: intake.takesCurrent === 'Yes' ? intake.currentMedicationItems : [],
    currentMedications: intake.takesCurrent === 'Yes' ? intake.currentMedicationItems.join(', ') : '',
    hormonalBirthControl: hasLifeStage(intake, 'I use hormonal birth control') ? 'Yes' : '',
    hormonalBirthControlType: '',
    tryingToConceive: isTtcRelevant(intake) ? 'Yes' : 'No',
    productHistory: intake.productHistory,
    currentProducts: usedNames,
    avoidRepeat: intake.avoidRepeat,
    dislikedProducts,
    dislikedReason,
    brandSupportPreferences: intake.brandSupportPreferences,
    safetyConcern: intake.safetyConcern,
    preferredFormats: intake.preferredFormats,
    formatOtherText: intake.formatOtherText.trim(),
    preferredProductTypes,
    priceRange: intake.priceRange,
    largePurchaseFrequency: intake.largePurchaseFrequency,
    brandOpenness: intake.brandOpenness,
    trustedBrands: intake.trustedBrands,
    avoidIngredients: intake.avoidIngredients,
    avoidIngredientsOtherText: intake.avoidIngredientsOtherText.trim(),
    productPreferences,
    fsaHsa,
    trustRanking: intake.trustRankingTouched ? intake.trustRanking : [],
    anythingElse: intake.anythingElse.trim(),
    goals: [],
    personalizationCompleted: true,
    personalizationCompletedAt: new Date().toISOString(),
    intakeVersion: 'beta-redesign-2026-09',
  };
}

function requiredReady(stepId, intake) {
  if (stepId === 'conditions') return intake.diagnosisSelections.length > 0;
  if (stepId === 'allergies') return !!intake.allergyStatus && (intake.allergyStatus !== 'Yes' || intake.allergyItems.length > 0);
  if (stepId === 'medications') return !!intake.takesCurrent && (intake.takesCurrent !== 'Yes' || intake.currentMedicationItems.length > 0);
  if (stepId === 'safety') return !!intake.safetyConcern;
  return true;
}

/* --------------------------- Fuzzy search --------------------------- */

function normalizeSuggestion(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function editDistance(a, b) {
  const left = normalizeSuggestion(a);
  const right = normalizeSuggestion(b);
  if (!left) return right.length;
  if (!right) return left.length;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = saved;
    }
  }
  return row[right.length];
}
function rankedSuggestions(query, options = [], limit = 6) {
  const q = normalizeSuggestion(query);
  if (q.length < 2) return [];
  return options
    .map((option) => {
      const normalized = normalizeSuggestion(option);
      if (!normalized) return null;
      let score = Number.POSITIVE_INFINITY;
      if (normalized === q) score = 0;
      else if (normalized.startsWith(q)) score = 1 + (normalized.length - q.length) / 100;
      else if (normalized.includes(q)) score = 2 + normalized.indexOf(q) / 100;
      else {
        const distance = editDistance(q, normalized);
        const threshold = Math.max(2, Math.ceil(Math.max(q.length, normalized.length) * 0.4));
        if (distance <= threshold) score = 10 + distance + Math.abs(normalized.length - q.length) / 100;
      }
      return Number.isFinite(score) ? { option, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || String(a.option).localeCompare(String(b.option)))
    .slice(0, limit)
    .map((entry) => entry.option);
}

/* ---------------------------- Shared style tokens ---------------------------- */
// Values from the intake design reference (Ayna_Intake_Flow.html), which
// turned out to already be the app's own --ayna-* palette (surface, border,
// accent-dark, peach, chip-bg, brown, navy, text-faint) — reused as CSS vars
// here rather than re-hardcoded, so this screen gets the app's real dark
// mode for free instead of staying permanently light like the mockup frame.
// SELECTED_TEXT (#8A5A1E) is the one color the reference uses that has no
// existing --ayna-* var; it's a fixed accent-on-peach text tone, not
// intended to invert in dark mode (the reference's own dark-mode notes only
// redefine the surface/border/accent tokens, not this one).
const NAVY = 'var(--ayna-navy)';
const CARD_BG = 'var(--ayna-surface)';
const ROW_BORDER = 'var(--ayna-border)';
const ACCENT_BORDER = 'var(--ayna-accent-dark)';
const ACCENT_BG = 'var(--ayna-peach)';
const PANEL_BG = 'var(--ayna-chip-bg)';
const MUTED = 'var(--ayna-text-faint)';
const LABEL_GOLD = 'var(--ayna-brown)';
const SELECTED_TEXT = '#8A5A1E';
const INK = 'var(--ayna-text)';
const BODY_TEXT = 'var(--ayna-text-muted)';

const cardShadow = '0 1px 3px rgba(41,37,36,.04)';

/* ------------------------------ Shared widgets ------------------------------ */

// 2-column tile grid (design pattern B1/E1). Callers with real per-option
// icon art (currently just product formats — see FORMAT_ICONS above) pass an
// `icons` map to render a small rounded-square badge above the label;
// callers without one (life stages, which have no matching icon set) get the
// plain label-only tile exactly as before.
function ChoiceGrid({ items, selected = [], onToggle, icons }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 }}>
      {items.map((item) => {
        const on = selected.includes(item);
        const icon = icons && icons[item];
        return (
          <div
            key={item}
            onClick={() => onToggle(item)}
            style={{
              cursor: 'pointer', position: 'relative', minHeight: 60, display: 'flex',
              flexDirection: icon ? 'column' : 'row', alignItems: icon ? 'flex-start' : 'center',
              padding: '13px 26px 13px 13px', borderRadius: 18,
              background: on ? ACCENT_BG : CARD_BG,
              border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
              boxShadow: on ? '0 4px 14px rgba(232,169,79,.2)' : cardShadow,
            }}
          >
            {icon && (
              <span style={{
                width: 32, height: 32, borderRadius: 10, marginBottom: 10, flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? 'rgba(255,255,255,.55)' : PANEL_BG,
                color: on ? SELECTED_TEXT : NAVY,
              }}>
                {icon}
              </span>
            )}
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, lineHeight: 1.25, color: on ? SELECTED_TEXT : INK }}>{item}</span>
            {on && (
              <span style={{ position: 'absolute', top: 9, right: 9, width: 16, height: 16, borderRadius: 99, background: ACCENT_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Chip spec (design pattern C1/G1) — flex-wrapped pills, not vertical rows.
// Used both flat (conditions) and grouped under a label (SearchableGroups).
function RowChoiceList({ items, selected = [], onToggle, exclusiveValues = [] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {items.map((item) => {
        const on = selected.includes(item);
        const exclusive = exclusiveValues.includes(item);
        return (
          <div
            key={item}
            onClick={() => onToggle(item)}
            style={{
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, lineHeight: 1, padding: '10px 14px', borderRadius: 99,
              fontWeight: on ? 600 : 500,
              background: on ? ACCENT_BG : (exclusive ? PANEL_BG : CARD_BG),
              color: on ? SELECTED_TEXT : (exclusive ? MUTED : INK),
              border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
              boxShadow: on ? '0 2px 8px rgba(232,169,79,.22)' : 'none',
            }}
          >
            {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
            {item}
          </div>
        );
      })}
    </div>
  );
}

// Shared search-bar chrome (design rule: "search on every list over ~12
// options") — same pill-shaped input used by SearchableGroups, TokenInput
// and ProductHistoryBuilder, factored out so conditions/avoidIngredients
// (previously ungrouped flat lists with no filtering at all) can use it too.
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, borderRadius: 99, padding: '11px 14px', marginBottom: 14 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 13, minWidth: 0 }} />
    </div>
  );
}

// Same chip spec as RowChoiceList — kept as a separate component since
// callers pass a single non-array `selected` list built differently (some
// single-select via toggleExclusive, some genuinely multi), and the
// `compact`/`left` nested-context variants (inside ProductHistoryBuilder)
// need a smaller size without becoming a third visual language.
function Pills({ options, selected, onToggle, left, compact, exclusiveValues = [] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 7, justifyContent: left ? 'flex-start' : 'center' }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        const exclusive = exclusiveValues.includes(opt);
        return (
          <div
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              fontFamily: "'DM Sans',sans-serif", padding: compact ? '8px 11px' : '10px 14px', borderRadius: 99,
              background: on ? ACCENT_BG : (exclusive ? PANEL_BG : CARD_BG), color: on ? SELECTED_TEXT : (exclusive ? MUTED : INK),
              border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
              fontSize: compact ? 11.5 : 12.5, fontWeight: on ? 600 : 500,
              boxShadow: on ? '0 2px 8px rgba(232,169,79,.22)' : 'none',
            }}
          >
            {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
            {opt}
          </div>
        );
      })}
    </div>
  );
}

// Vertical single-select radio list (design pattern F1) — the workhorse
// pattern for every Yes/No/Not-sure-style question, replacing the old
// horizontal segmented-button bar.
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <div
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 16,
              background: on ? ACCENT_BG : CARD_BG, border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
            }}
          >
            <span style={{
              width: 19, height: 19, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? ACCENT_BORDER : 'transparent', border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
            }}>
              {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
            </span>
            <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 13.5, lineHeight: 1.35, fontWeight: on ? 600 : 400, color: on ? SELECTED_TEXT : INK }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

// Pattern K1: price bands as a vertical row list rather than chips — a
// Playfair price label on the left, a descriptive subtitle right-aligned,
// and a trailing checkmark instead of a leading radio circle.
function PriceBandList({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        const subtitle = PRICE_BAND_SUBTITLES[opt];
        return (
          <div
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 16,
              background: on ? ACCENT_BG : CARD_BG, border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
            }}
          >
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, flex: 'none', color: on ? SELECTED_TEXT : NAVY }}>{opt}</span>
            <span style={{ flex: 1, textAlign: 'right', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 11.5, color: on ? SELECTED_TEXT : MUTED }}>{subtitle}</span>
            <span style={{
              width: 19, height: 19, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? ACCENT_BORDER : 'transparent', border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
            }}>
              {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, inputMode, maxLength }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1.5px solid ' + ROW_BORDER, fontSize: 14, color: INK, background: CARD_BG, outline: 'none' }}
    />
  );
}

function OtherBox({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginTop: 16, textAlign: 'left' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#FFC774', marginBottom: 9 }}>{label}</div>
      <TextInput value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

const AGE_MIN = 13;
const AGE_MAX = 90;

// Pattern A2: a real, draggable slider (invisible native <input type=range>
// layered over a custom-drawn track/fill/thumb, since inline styles can't
// reach ::-webkit-slider-thumb) plus a manual numeric-entry stepper panel
// below it — same two ways to answer the design specifies, not just the
// slider alone.
// Wrapped in its own light card (rather than sitting directly on the
// screen background) since the floating value label works by painting an
// opaque cutout over the track — that only blends in when its background
// actually matches what's immediately behind it, which the page background
// no longer does now that it's back to the dark hero gradient.
function AgeCard({ value, onChange }) {
  const numeric = value ? Number(value) : 28;
  const pct = ((numeric - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100;
  const step = (delta) => onChange(String(Math.min(AGE_MAX, Math.max(AGE_MIN, numeric + delta))));
  return (
    <div style={{ background: CARD_BG, borderRadius: 24, padding: '40px 20px 20px', boxShadow: '0 20px 44px -22px rgba(0,0,0,.5)' }}>
      <div style={{ position: 'relative', height: 40 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 8, borderRadius: 99, background: 'var(--ayna-track)' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, top: 16, height: 8, borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT_BG}, ${ACCENT_BORDER})` }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: 4, transform: 'translateX(-50%)', width: 32, height: 32, borderRadius: 99, background: CARD_BG, border: '3px solid ' + ACCENT_BORDER, boxShadow: '0 6px 16px rgba(232,169,79,.4)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: `${pct}%`, top: -38, transform: 'translateX(-50%)', fontFamily: "'Playfair Display',serif", fontSize: 36, color: NAVY, background: CARD_BG, padding: '0 8px', pointerEvents: 'none' }}>
          {value || '—'}
        </div>
        <input
          type="range" min={AGE_MIN} max={AGE_MAX} value={numeric} onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', left: 0, right: 0, top: -2, height: 40, width: '100%', margin: 0, opacity: 0, cursor: 'grab' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: MUTED }}>
        <span>{AGE_MIN}</span><span>{AGE_MAX}+</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26, padding: '13px 15px', borderRadius: 16, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12.5, color: BODY_TEXT, flex: 1 }}>Prefer to type it?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, borderRadius: 12, padding: '8px 12px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: INK }}>{value || '—'}</div>
          <div style={{ width: 1, height: 14, background: ROW_BORDER }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div onClick={() => step(1)} style={{ cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            <div onClick={() => step(-1)} style={{ cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ZIP utility pattern: 5 digit boxes reading off one real, invisible numeric
// input laid on top (same overlay technique as the age slider) — a single
// text field is what's actually focusable/typeable, the boxes are just its
// display.
// Five real per-digit inputs (the standard OTP-input pattern), not one
// invisible input overlaid on decorative boxes — that overlay trick proved
// unreliable for actually opening the keyboard/accepting taps on real
// mobile browsers, where each digit box here is itself a genuine,
// correctly-sized, tappable, typeable <input>.
function ZipDigits({ value, onChange, onSkip }) {
  const inputRefs = useRef([]);
  const chars = String(value || '').split('');

  const setDigit = (index, raw) => {
    const clean = raw.replace(/\D/g, '');
    const next = [...chars];
    if (!clean) {
      next[index] = '';
      onChange(next.join('').slice(0, 5));
      return;
    }
    next[index] = clean[clean.length - 1];
    onChange(next.join('').slice(0, 5));
    if (index < 4) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    const lastIndex = Math.max(0, Math.min(text.length, 5) - 1);
    const el = inputRefs.current[lastIndex];
    if (el) el.focus();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            value={chars[i] || ''}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            aria-label={`ZIP code digit ${i + 1}`}
            style={{
              width: 52, height: 62, borderRadius: 16, background: CARD_BG,
              border: '1.5px solid ' + (chars[i] ? ACCENT_BORDER : ROW_BORDER),
              textAlign: 'center', padding: 0, outline: 'none', WebkitAppearance: 'none',
              fontFamily: "'Playfair Display',serif", fontSize: 26, color: NAVY,
            }}
          />
        ))}
      </div>
      {onSkip && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <div onClick={onSkip} style={{ cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 12.5, padding: '10px 14px', borderRadius: 99, background: PANEL_BG, border: '1.5px solid ' + ROW_BORDER, color: MUTED }}>
            Skip this
          </div>
        </div>
      )}
    </div>
  );
}

const SCALE_BAR_HEIGHTS = [18, 31, 44, 57, 70];

// Pattern D2: rising bars for the first up-to-5 ordered levels; any
// trailing non-ordinal options (e.g. "It varies", "Not sure") render as
// plain chips below instead of getting an arbitrary bar height — same
// options, just not force-fit onto a severity scale they don't belong on.
function Scale({ options, value, onChange }) {
  const scaleOptions = options.slice(0, 5);
  const extraOptions = options.slice(5);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 5 }}>
        {scaleOptions.map((opt, i) => {
          const on = value === opt;
          return (
            <div key={opt} onClick={() => onChange(opt)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
              <span style={{
                width: '100%', height: SCALE_BAR_HEIGHTS[i], borderRadius: '10px 10px 4px 4px',
                background: on ? `linear-gradient(180deg, ${ACCENT_BG}, ${ACCENT_BORDER})` : 'var(--ayna-track)',
                boxShadow: on ? '0 6px 16px rgba(232,169,79,.35)' : 'none',
              }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: on ? 600 : 500, fontSize: 10.5, lineHeight: 1.2, textAlign: 'center', color: on ? '#FFC774' : 'rgba(255,249,242,.6)' }}>{opt}</span>
            </div>
          );
        })}
      </div>
      {extraOptions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Pills options={extraOptions} selected={value ? [value] : []} onToggle={onChange} left compact />
        </div>
      )}
    </div>
  );
}

// Timeline questions (UTI recurrence, postpartum timing, trimester, large-
// purchase frequency) are single-select among ordered options — pattern F1
// (the same vertical radio list as Yes/No questions), not a distinct
// visual language of their own.
function Timeline({ options, value, onChange }) {
  return <Segmented options={options} value={value} onChange={onChange} />;
}

// Brand openness is a single-select among ordered options too — F1 again,
// swapping in only the option order it already had.
function BrandSpectrum({ value, onChange }) {
  return <Segmented options={BRAND_OPENNESS} value={value} onChange={onChange} />;
}

// Pattern H1: search-styled input, added items as swatch+title cards (not
// small chips), a dashed "Add" affordance implicit in the search bar
// itself, and an × to remove — same values/suggestions/onChange contract.
function TokenInput({ values, onChange, placeholder, suggestions = [], suggestionLimit = 6 }) {
  const [draft, setDraft] = useState('');
  const matches = useMemo(
    () => rankedSuggestions(draft, suggestions.filter((option) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(option))), suggestionLimit),
    [draft, suggestions, values, suggestionLimit]
  );
  const addValue = (raw) => {
    const next = String(raw || '').trim();
    if (!next || values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
  };
  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, borderRadius: 99, padding: '11px 14px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) addValue(draft); }}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 13, minWidth: 0 }}
        />
      </div>
      {draft.trim().length > 0 && (
        <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
          <div onClick={() => addValue(draft)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: SELECTED_TEXT, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, fontFamily: "'DM Sans',sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span>Add "{draft.trim()}"</span>
          </div>
          {matches.map((option) => (
            <div key={option} onClick={() => addValue(option)} style={{ padding: '13px 14px', fontSize: 13.5, color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>
              {option}
            </div>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {values.map((value, i) => (
            <div key={`${value}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: ACCENT_BG, border: '1px solid ' + ACCENT_BORDER, flex: 'none' }} />
              <span style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, color: INK }}>{value}</span>
              <span onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// The "never recommend again" step gets its own H1 variant: a dashed
// "+ Add a product or brand" affordance (rather than an always-open search
// bar) plus a "FROM YOUR HISTORY" quick-add row sourced from the real
// products the person entered earlier in this same form (productHistory),
// not invented data.
function AddProductBuilder({ values, onChange, suggestions, historyNames, footerText }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const matches = useMemo(
    () => rankedSuggestions(draft, suggestions.filter((option) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(option))), 6),
    [draft, suggestions, values]
  );
  const quickAdd = historyNames.filter((name) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(name)));

  const addValue = (raw) => {
    const next = String(raw || '').trim();
    if (!next || values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {values.map((value, i) => (
            <div key={`${value}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: ACCENT_BG, border: '1px solid ' + ACCENT_BORDER, flex: 'none' }} />
              <span style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, color: INK }}>{value}</span>
              <span onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </span>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <div
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            padding: '15px', borderRadius: 16, border: '1.5px dashed rgba(255,249,242,.35)', background: 'transparent',
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, color: '#FFC774',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC774" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add a product or brand
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CARD_BG, border: '1.5px solid ' + ACCENT_BORDER, borderRadius: 99, padding: '11px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) addValue(draft); }}
              placeholder="Start typing a product or brand"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 13, minWidth: 0 }}
            />
            <span onClick={() => { setAdding(false); setDraft(''); }} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </span>
          </div>
          {draft.trim().length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
              <div onClick={() => addValue(draft)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: SELECTED_TEXT, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, fontFamily: "'DM Sans',sans-serif" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span>Add "{draft.trim()}"</span>
              </div>
              {matches.map((option) => (
                <div key={option} onClick={() => addValue(option)} style={{ padding: '13px 14px', fontSize: 13.5, color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {quickAdd.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#FFC774', marginBottom: 10 }}>From your history</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {quickAdd.map((name) => (
              <div
                key={name}
                onClick={() => addValue(name)}
                style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 12.5, padding: '9px 13px', borderRadius: 99,
                  background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, color: INK,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={LABEL_GOLD} strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {footerText && (
        <p style={{ margin: '18px 0 0', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,249,242,.6)' }}>{footerText}</p>
      )}
    </div>
  );
}

// Pattern C1: search bar + grouped chips, each group header showing a live
// "n/m" selected count.
function SearchableGroups({ groups, selected, onToggle, search, onSearch }) {
  const q = search.trim().toLowerCase();
  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !q || item.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)) }))
    .filter((group) => group.items.length);
  return (
    <div>
      <SearchBar value={search} onChange={onSearch} placeholder="Search options..." />
      <div style={{ maxHeight: 400, overflowY: 'auto', textAlign: 'left' }}>
        {visible.map((group) => {
          const count = group.items.filter((item) => selected.includes(item)).length;
          return (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: '#FFF9F2' }}>{group.label}</span>
                <span style={{ flex: 1, height: 1, background: 'rgba(255,249,242,.24)' }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: count > 0 ? '#FFC774' : 'rgba(255,249,242,.55)' }}>{count}/{group.items.length}</span>
              </div>
              <RowChoiceList items={group.items} selected={selected} onToggle={onToggle} />
            </div>
          );
        })}
        {visible.length === 0 && <div style={{ padding: '22px 4px', color: 'rgba(255,249,242,.6)', fontSize: 13 }}>No matches. Try a different search.</div>}
      </div>
    </div>
  );
}

function ProductHistoryBuilder({ products, onChange }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const suggestions = useMemo(() => {
    const added = new Set(products.map((p) => normalizeSuggestion(p.name)));
    return rankedSuggestions(query, CATALOG_PRODUCT_NAMES.filter((name) => !added.has(normalizeSuggestion(name))), 6);
  }, [query, products]);

  const addProduct = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || products.some((p) => normalizeSuggestion(p.name) === normalizeSuggestion(trimmed))) return;
    onChange([...products, { name: trimmed, current: '', worked: '', reaction: '', reactionText: '', stopReasons: [], stopOther: '' }]);
    setQuery('');
    setAdding(false);
    setExpandedIndex(null);
  };
  const updateProduct = (index, patch) => onChange(products.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const removeProduct = (index) => {
    onChange(products.filter((_, i) => i !== index));
    setExpandedIndex((cur) => (cur === index ? null : cur > index ? cur - 1 : cur));
  };

  return (
    <div>
      {!adding ? (
        <div
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            padding: '15px', borderRadius: 16, border: '1.5px dashed rgba(255,249,242,.35)', background: 'transparent',
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, color: '#FFC774',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC774" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add a product or brand
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CARD_BG, border: '1.5px solid ' + ACCENT_BORDER, borderRadius: 99, padding: '11px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) addProduct(query); }} placeholder="Search products" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 13, minWidth: 0 }} />
            <span onClick={() => { setAdding(false); setQuery(''); }} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </span>
          </div>
          {query.trim().length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
              <div onClick={() => addProduct(query)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: SELECTED_TEXT, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, fontFamily: "'DM Sans',sans-serif" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span>Add "{query.trim()}"</span>
              </div>
              {suggestions.map((name) => (
                <div key={name} onClick={() => addProduct(name)} style={{ padding: '13px 14px', fontSize: 13.5, color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>{name}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {products.map((product, index) => {
            const expanded = expandedIndex === index;
            const summary = [product.current, product.worked, product.reaction].filter(Boolean);
            return (
              <div key={`${product.name}-${index}`} style={{ background: CARD_BG, color: INK, border: '1.5px solid ' + (expanded ? ACCENT_BORDER : ROW_BORDER), borderRadius: 16, overflow: 'hidden', textAlign: 'left' }}>
                <div onClick={() => setExpandedIndex(expanded ? null : index)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{summary.length ? summary.join(' · ') : 'Optional details'}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flex: 'none', color: MUTED, transform: expanded ? 'rotate(180deg)' : 'rotate(-90deg)', transition: 'transform .2s' }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {expanded && (
                  <div style={{ padding: '0 14px 16px', borderTop: '1px solid ' + ROW_BORDER, paddingTop: 14 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, color: INK, marginBottom: 8 }}>Currently using it?</div>
                      <Segmented options={['Yes', 'No']} value={product.current} onChange={(v) => updateProduct(index, { current: v })} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, color: INK, marginBottom: 8 }}>How well did it work?</div>
                      <Pills options={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={product.worked ? [product.worked] : []} onToggle={(v) => updateProduct(index, { worked: v })} left compact />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, color: INK, marginBottom: 8 }}>Any side effects or reactions?</div>
                      <Pills options={['No', 'Mild', 'Serious', 'Not sure']} selected={product.reaction ? [product.reaction] : []} onToggle={(v) => updateProduct(index, { reaction: v })} left compact />
                    </div>

                    {['Mild', 'Serious'].includes(product.reaction) && (
                      <div style={{ marginBottom: 14, padding: '12px 13px', borderRadius: 14, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
                        <input value={product.reactionText} onChange={(e) => updateProduct(index, { reactionText: e.target.value })} placeholder="What happened? (optional)" style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: INK, fontFamily: 'inherit' }} />
                      </div>
                    )}

                    {product.current === 'No' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, color: INK, marginBottom: 8 }}>Why did you stop?</div>
                        <Pills
                          options={STOP_REASONS}
                          selected={product.stopReasons || []}
                          onToggle={(reason) => updateProduct(index, {
                            stopReasons: (product.stopReasons || []).includes(reason) ? product.stopReasons.filter((x) => x !== reason) : [...(product.stopReasons || []), reason],
                          })}
                          left compact
                        />
                        {(product.stopReasons || []).includes('Other') && (
                          <div style={{ marginTop: 10, padding: '12px 13px', borderRadius: 14, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
                            <input value={product.stopOther || ''} onChange={(e) => updateProduct(index, { stopOther: e.target.value })} placeholder="Other reason" style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: INK, fontFamily: 'inherit' }} />
                          </div>
                        )}
                      </div>
                    )}

                    <div onClick={() => removeProduct(index)} style={{ marginTop: 10, color: LABEL_GOLD, fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: 'pointer' }}>Remove product</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pattern L1 — real drag-to-reorder, built on Pointer Events rather than
// HTML5 native drag-and-drop (which doesn't fire reliably on touchscreens).
// The dragged row tracks the pointer via a CSS transform computed from a
// fixed rect snapshot taken at pointer-down, while the other rows' *live*
// positions (read fresh on every move) decide when to splice the array —
// so the list itself reorders live as you drag, not just on release.
function TrustRanker({ order, onChange, onTouch }) {
  const itemRefs = useRef({});
  const [drag, setDrag] = useState(null); // { item, startClientY, top, height, y }

  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - drag.startClientY;
      setDrag((d) => (d ? { ...d, y: deltaY } : d));

      const draggedMid = drag.top + drag.height / 2 + deltaY;
      const others = order.filter((it) => it !== drag.item);
      let newIndex = 0;
      others.forEach((it) => {
        const el = itemRefs.current[it];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (draggedMid > rect.top + rect.height / 2) newIndex += 1;
      });
      const currentIndex = order.indexOf(drag.item);
      if (newIndex !== currentIndex) {
        const next = order.filter((it) => it !== drag.item);
        next.splice(newIndex, 0, drag.item);
        onTouch();
        onChange(next);
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, order, onChange, onTouch]);

  const handlePointerDown = (item, e) => {
    const el = itemRefs.current[item];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    e.preventDefault();
    setDrag({ item, startClientY: e.clientY, top: rect.top, height: rect.height, y: 0 });
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {order.map((item, index) => {
        const top = index === 0;
        const isDragging = drag && drag.item === item;
        return (
          <div
            key={item}
            ref={(el) => { itemRefs.current[item] = el; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14,
              background: top ? ACCENT_BG : CARD_BG,
              border: '1.5px solid ' + (top ? ACCENT_BORDER : ROW_BORDER),
              boxShadow: isDragging ? '0 18px 32px -12px rgba(41,37,36,.4)' : (top ? '0 8px 20px -10px rgba(232,169,79,.5)' : cardShadow),
              transform: isDragging ? `translateY(${drag.y}px) scale(1.02)` : 'none',
              position: 'relative',
              zIndex: isDragging ? 5 : 1,
              touchAction: 'none',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 9, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: top ? 'rgba(255,255,255,.7)' : PANEL_BG, color: top ? SELECTED_TEXT : NAVY,
              fontFamily: "'Playfair Display',serif", fontSize: 15,
            }}>{index + 1}</span>
            <span style={{ flex: 1, textAlign: 'left', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, color: top ? SELECTED_TEXT : INK }}>{item}</span>
            <span
              onPointerDown={(e) => handlePointerDown(item, e)}
              aria-label={`Drag to reorder ${item}`}
              style={{
                width: 30, height: 30, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: top ? SELECTED_TEXT : MUTED, cursor: 'grab', touchAction: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
                <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
                <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
              </svg>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Pattern M1 — textarea plus dashed "inspiration only" prompt chips: tapping
// one appends its starter phrase rather than committing an answer, since
// unlike every selectable option elsewhere in this form, these never
// represent a stored choice.
const FREE_TEXT_PROMPTS = ['A goal I have', "Something that hasn't worked", "A concern I haven't mentioned"];

function TextAreaField({ value, onChange, placeholder }) {
  const appendPrompt = (prompt) => {
    const prefix = value && !value.endsWith('\n') && !value.endsWith(' ') ? `${value}\n` : value;
    onChange(`${prefix}${prompt}: `);
  };
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        style={{ width: '100%', boxSizing: 'border-box', padding: 16, borderRadius: 20, border: '1.5px solid ' + ROW_BORDER, fontSize: 13.5, color: INK, background: CARD_BG, outline: 'none', resize: 'vertical', minHeight: 150, lineHeight: 1.65, fontFamily: 'inherit' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        {FREE_TEXT_PROMPTS.map((prompt) => (
          <div
            key={prompt}
            onClick={() => appendPrompt(prompt)}
            style={{ cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 12, padding: '9px 13px', borderRadius: 99, background: CARD_BG, border: '1.5px dashed ' + ROW_BORDER, color: BODY_TEXT }}
          >
            {prompt}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Main screen --------------------------------- */

export default function IntakeScreen({ onBack, onComplete, initialSnapshot = null }) {
  const [intake, setIntake] = useState(() => reconstructIntakeFromSnapshot(initialSnapshot));
  const [stepId, setStepId] = useState(() => getFirstIncompleteStepId(initialSnapshot) || 'age');
  const [search, setSearch] = useState('');
  // Computed once, from how things stood when this resume started — not
  // re-derived as answers change, so a step's flag clears only by actually
  // reaching and completing it, not by something else on the page changing.
  const [flaggedStepIds] = useState(() => new Set(getIncompleteStepIds(initialSnapshot)));

  const visibleSteps = useMemo(() => {
    const steps = [
      { id: 'age', section: 'core', title: 'How old are you?', type: 'age', optional: true },
      { id: 'lifeStage', section: 'core', title: 'Which options best describe you right now?', subtitle: 'Select all that apply.', type: 'lifeStage', optional: true },
      { id: 'zip', section: 'core', title: 'What is your ZIP code?', subtitle: 'Optional. This helps us personalize local care and availability.', type: 'zip', optional: true },
      { id: 'support', section: 'support', title: 'What are you currently experiencing or looking for support with?', subtitle: 'Choose anything that feels relevant. You can search or browse by category.', type: 'support', optional: true },
      ...(isPeriodRelevant(intake) ? [
        { id: 'periodFlow', section: 'support', title: 'How would you describe your typical period flow?', type: 'flow', optional: true },
        { id: 'periodPain', section: 'support', title: 'How would you describe your typical period pain?', type: 'pain', optional: true },
      ] : []),
      ...(isUtiRelevant(intake) ? [{ id: 'utiFrequency', section: 'support', title: 'How often do you experience UTI-like symptoms?', type: 'utiFrequency', optional: true }] : []),
      ...(isPostpartumRelevant(intake) ? [{ id: 'postpartumTiming', section: 'support', title: 'How long ago did you give birth?', type: 'postpartumTiming', optional: true }] : []),
      ...(isPregnancyRelevant(intake) ? [{ id: 'pregnancyTrimester', section: 'support', title: 'How far along are you?', type: 'pregnancyTrimester', optional: true }] : []),
      { id: 'conditions', section: 'safety', title: 'Have you been diagnosed with any of the following?', subtitle: 'This is different from what you are experiencing. It helps us separate a diagnosed condition from a symptom or goal.', type: 'conditions', optional: false },
      { id: 'allergies', section: 'safety', title: 'Do you have any known allergies or sensitivities that affect the products you can use?', subtitle: 'We use this to help flag products that may not be a fit for you.', type: 'allergies', optional: false },
      { id: 'medications', section: 'safety', title: 'Are you currently taking any medications, supplements, vitamins, or hormonal birth control?', subtitle: 'This helps us avoid duplicate ingredients and flag possible compatibility issues.', type: 'medications', optional: false },
      { id: 'products', section: 'history', title: 'What health or wellness products have you tried?', subtitle: 'Add any products you’ve tried. You can add more than one.', type: 'products', optional: true },
      { id: 'avoidRepeat', section: 'history', title: 'Are there any products or brands you definitely do not want recommended again?', type: 'avoidRepeat', optional: true },
      { id: 'safety', section: 'safety', title: 'Are any symptoms you are experiencing new, rapidly worsening, or concerning to you right now?', type: 'safety', optional: false },
      { id: 'formats', section: 'preferences', title: 'Which product formats do you prefer?', type: 'formats', optional: true },
      { id: 'priceRange', section: 'preferences', title: 'What price range do you usually prefer for health and wellness products?', type: 'price', optional: true },
      { id: 'brandOpenness', section: 'preferences', title: 'How do you feel about trying new brands?', type: 'brand', optional: true },
      ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [{ id: 'trustedBrands', section: 'preferences', title: 'Which brands do you already trust?', type: 'trustedBrands', optional: true }] : []),
      { id: 'avoidIngredients', section: 'preferences', title: 'Preferences', subtitle: 'Select any that matter to you. Allergies are handled separately.', type: 'avoidIngredients', optional: true },
      { id: 'fsaHsa', section: 'preferences', title: 'Do you have an FSA or HSA you would like to use?', type: 'fsa', optional: true },
      { id: 'trust', section: 'trust', title: 'What matters most to you when deciding whether to trust a product?', subtitle: 'Drag the handle, or long-press and move. You can also skip this.', type: 'trust', optional: true },
      { id: 'anythingElse', section: 'trust', title: 'Anything else you want Ayna to know?', subtitle: 'Share anything else that could help us personalize your recommendations.', type: 'textarea', optional: true },
    ];
    return steps;
  }, [intake]);

  const currentIndex = Math.max(0, visibleSteps.findIndex((s) => s.id === stepId));
  const step = visibleSteps[currentIndex] || visibleSteps[0];
  const isLast = currentIndex === visibleSteps.length - 1;

  const set = (key, value) => setIntake((prev) => ({ ...prev, [key]: value }));
  const toggleExclusive = (key, value, exclusiveValues = []) => setIntake((prev) => {
    const current = Array.isArray(prev[key]) ? prev[key] : (prev[key] ? [prev[key]] : []);
    let next;
    if (current.includes(value)) next = current.filter((x) => x !== value);
    else if (exclusiveValues.includes(value)) next = [value];
    else next = [...current.filter((x) => !exclusiveValues.includes(x)), value];
    return { ...prev, [key]: next };
  });
  const toggleLifeStage = (value) => setIntake((prev) => {
    const current = getLifeStages(prev);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    return { ...prev, lifeStageSelections: next, lifeStage: next[0] || '' };
  });

  const goBack = () => {
    if (currentIndex > 0) {
      setSearch('');
      setStepId(visibleSteps[currentIndex - 1].id);
    } else if (onBack) onBack();
  };
  const goNext = () => {
    if (!requiredReady(step.id, intake)) return;
    if (currentIndex >= visibleSteps.length - 1) {
      onComplete(mapIntakeToLegacyQuizProfile(buildSnapshot(intake)));
      return;
    }
    setSearch('');
    setStepId(visibleSteps[currentIndex + 1].id);
  };

  const selectedLifeStages = getLifeStages(intake);

  const renderBody = () => {
    if (step.type === 'age') return <AgeCard value={intake.age} onChange={(v) => set('age', v)} />;

    if (step.type === 'lifeStage') return (
      <>
        <ChoiceGrid items={LIFE_STAGES} selected={selectedLifeStages} onToggle={toggleLifeStage} />
        {selectedLifeStages.includes('I am postpartum') && (
          <div style={{ marginTop: 18, padding: 16, background: PANEL_BG, border: '1px solid ' + ROW_BORDER, borderRadius: 18, textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Are you currently breastfeeding?</div>
            <Segmented options={['Yes', 'No', 'Prefer not to say']} value={intake.breastfeedingStatus} onChange={(v) => set('breastfeedingStatus', v)} />
          </div>
        )}
        {selectedLifeStages.includes('I am in perimenopause') && (
          <div style={{ marginTop: 18, padding: 16, background: PANEL_BG, border: '1px solid ' + ROW_BORDER, borderRadius: 18, textAlign: 'left' }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>When was your last period?</div>
            <Pills options={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => set('perimenopauseLastPeriod', v)} left />
          </div>
        )}
        {selectedLifeStages.includes('Other') && (
          <OtherBox label="Tell us what best describes you (optional)" value={intake.lifeStageOther} onChange={(v) => set('lifeStageOther', v)} placeholder="Type here..." />
        )}
      </>
    );

    if (step.type === 'zip') return <ZipDigits value={intake.zipcode} onChange={(v) => set('zipcode', v.replace(/\D/g, '').slice(0, 5))} onSkip={goNext} />;

    if (step.type === 'support') return (
      <>
        <SearchableGroups groups={SUPPORT_GROUPS} selected={intake.supportSelections} search={search} onSearch={setSearch} onToggle={(item) => toggleExclusive('supportSelections', item, ['Nothing right now'])} />
        {intake.supportSelections.includes('Something else') && (
          <OtherBox label="Tell us what else you are looking for support with" value={intake.supportOtherText} onChange={(v) => set('supportOtherText', v)} placeholder="Type here..." />
        )}
      </>
    );

    if (step.type === 'flow') return <Scale options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} />;
    if (step.type === 'pain') return <Scale options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} />;
    if (step.type === 'utiFrequency') return <Timeline options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
    if (step.type === 'postpartumTiming') return <Timeline options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />;
    if (step.type === 'pregnancyTrimester') return <Timeline options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;

    if (step.type === 'conditions') {
      const q = search.trim().toLowerCase();
      const filtered = q ? CONDITIONS.filter((item) => item.toLowerCase().includes(q)) : CONDITIONS;
      return (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Search conditions..." />
          <RowChoiceList items={filtered} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} exclusiveValues={['None that I know of', 'Prefer not to say']} />
          {filtered.length === 0 && <div style={{ padding: '22px 4px', color: 'rgba(255,249,242,.6)', fontSize: 13 }}>No matches. Try a different search.</div>}
          {intake.diagnosisSelections.includes('Other / not listed') && (
            <OtherBox label="What condition was diagnosed?" value={intake.conditionOtherText} onChange={(v) => set('conditionOtherText', v)} placeholder="Type the condition..." />
          )}
        </>
      );
    }

    if (step.type === 'allergies') return (
      <>
        <Segmented
          options={['Yes', 'No', "I'm not sure", 'Prefer not to say']}
          value={intake.allergyStatus}
          onChange={(value) => setIntake((prev) => ({ ...prev, allergyStatus: value, allergyItems: value === 'Yes' ? prev.allergyItems : [] }))}
        />
        {intake.allergyStatus === 'Yes' && (
          <div style={{ marginTop: 16 }}>
            <TokenInput values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Start typing an allergy or sensitivity" suggestions={ALLERGIES} suggestionLimit={8} />
          </div>
        )}
      </>
    );

    if (step.type === 'medications') return (
      <>
        <Segmented options={['Yes', 'No', 'Prefer not to say']} value={intake.takesCurrent} onChange={(v) => set('takesCurrent', v)} />
        {intake.takesCurrent === 'Yes' && (
          <div style={{ marginTop: 16 }}>
            <TokenInput values={intake.currentMedicationItems} onChange={(v) => set('currentMedicationItems', v)} placeholder="Start typing a medication, supplement, vitamin, or birth control" suggestions={MEDICATION_SUGGESTIONS} suggestionLimit={10} />
          </div>
        )}
        <div style={{ marginTop: 16, padding: '13px 15px', border: '1px solid ' + ROW_BORDER, background: PANEL_BG, borderRadius: 14, color: BODY_TEXT, fontSize: 12, lineHeight: 1.55, textAlign: 'left' }}>
          Always consult a clinician before starting a new supplement or medication. Ayna surfaces options relevant to the profile you shared, but you should still check product ingredients, labels, and instructions.
        </div>
      </>
    );

    if (step.type === 'products') return <ProductHistoryBuilder products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
    if (step.type === 'avoidRepeat') return (
      <AddProductBuilder
        values={intake.avoidRepeat}
        onChange={(v) => set('avoidRepeat', v)}
        suggestions={PRODUCT_OR_BRAND_SUGGESTIONS}
        historyNames={[...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))]}
        footerText="Excluded items never appear in your ecosystem, search results, or “similar product” rows."
      />
    );
    if (step.type === 'trustedBrands') return <TokenInput values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Start typing a brand" suggestions={BRAND_SUGGESTIONS} />;

    // Pattern J1: the conditional alert panel gets its own amber header
    // band + "!" badge, distinct from the plain informational panels used
    // elsewhere — this one's meant to read as an escalation, not a note.
    if (step.type === 'safety') return (
      <>
        <Segmented options={['Yes', 'No', 'Not sure']} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && (
          <div style={{ marginTop: 14, borderRadius: 20, overflow: 'hidden', border: '1.5px solid ' + ACCENT_BORDER }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 15px', background: ACCENT_BG }}>
              <span style={{ width: 20, height: 20, borderRadius: 99, background: ACCENT_BORDER, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, color: '#fff' }}>!</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12.5, color: SELECTED_TEXT }}>Worth a closer look</span>
            </div>
            <div style={{ padding: '14px 15px', background: CARD_BG }}>
              <p style={{ margin: 0, fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12.5, lineHeight: 1.6, color: BODY_TEXT }}>
                Some new or worsening symptoms may need evaluation by a healthcare professional. Ayna helps with product discovery and education and does not diagnose medical conditions or replace professional medical care. If symptoms feel urgent or severe, seek appropriate medical care promptly.
              </p>
            </div>
          </div>
        )}
      </>
    );

    if (step.type === 'formats') return (
      <>
        <ChoiceGrid items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} icons={FORMAT_ICONS} />
        {intake.preferredFormats.includes('Other') && (
          <OtherBox label="What format do you prefer?" value={intake.formatOtherText} onChange={(v) => set('formatOtherText', v)} placeholder="Type here..." />
        )}
      </>
    );

    if (step.type === 'price') {
      const selectedPrices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
      const priceOnlyBands = PRICE_RANGES.filter((opt) => opt !== 'Price is not a major factor for me');
      const notAFactor = 'Price is not a major factor for me';
      const notAFactorOn = selectedPrices.includes(notAFactor);
      return (
        <>
          <PriceBandList options={priceOnlyBands} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <div
            onClick={() => toggleExclusive('priceRange', notAFactor, [notAFactor])}
            style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', marginTop: 7,
              fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, padding: '10px 14px', borderRadius: 99,
              fontWeight: notAFactorOn ? 600 : 500,
              background: notAFactorOn ? ACCENT_BG : PANEL_BG,
              color: notAFactorOn ? SELECTED_TEXT : MUTED,
              border: '1.5px solid ' + (notAFactorOn ? ACCENT_BORDER : ROW_BORDER),
              justifyContent: 'center',
            }}
          >
            {notAFactorOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SELECTED_TEXT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
            {notAFactor}
          </div>

          <div style={{ height: 1, background: 'rgba(255,249,242,.24)', margin: '24px 0 20px' }} />

          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: '#FFF9F2', marginBottom: 4 }}>How often do you spend $75 or more?</div>
          <p style={{ margin: '0 0 14px', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,249,242,.72)' }}>This is about purchase frequency, not your usual preferred price per product.</p>
          <Timeline options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(v) => set('largePurchaseFrequency', v)} />
        </>
      );
    }
    if (step.type === 'brand') return <BrandSpectrum value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
    if (step.type === 'avoidIngredients') {
      const q = search.trim().toLowerCase();
      const filtered = q ? AVOID_INGREDIENTS.filter((item) => item.toLowerCase().includes(q)) : AVOID_INGREDIENTS;
      return (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Search preferences..." />
          <Pills options={filtered} selected={intake.avoidIngredients} onToggle={(v) => toggleExclusive('avoidIngredients', v, ['No preference'])} exclusiveValues={['No preference']} left />
          {filtered.length === 0 && <div style={{ padding: '22px 4px', color: 'rgba(255,249,242,.6)', fontSize: 13 }}>No matches. Try a different search.</div>}
          {intake.avoidIngredients.includes('Other') && (
            <OtherBox label="Other preference" value={intake.avoidIngredientsOtherText} onChange={(v) => set('avoidIngredientsOtherText', v)} placeholder="Type here..." />
          )}
        </>
      );
    }
    if (step.type === 'fsa') return <Pills options={FSA_HSA} selected={intake.fsaHsaAnswer ? [intake.fsaHsaAnswer] : []} onToggle={(v) => set('fsaHsaAnswer', v)} />;
    if (step.type === 'trust') return <TrustRanker order={intake.trustRanking} onChange={(order) => set('trustRanking', order)} onTouch={() => set('trustRankingTouched', true)} />;
    if (step.type === 'textarea') return <TextAreaField value={intake.anythingElse} onChange={(v) => set('anythingElse', v)} placeholder="Share anything else that could help us personalize your recommendations." />;

    return null;
  };

  const countForStep =
    step.id === 'support' ? intake.supportSelections.length :
    step.id === 'conditions' ? intake.diagnosisSelections.length :
    step.id === 'allergies' ? intake.allergyItems.length :
    step.id === 'formats' ? intake.preferredFormats.length :
    step.id === 'avoidIngredients' ? intake.avoidIngredients.length : 0;
  const ready = requiredReady(step.id, intake);

  return (
    <div
      style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--ayna-gradient-hero, linear-gradient(165deg,#2A1F4E 0%,#4E3866 42%,#8A4A3C 74%,#D97A2B 100%))',
        color: '#FFF9F2', position: 'relative', overflow: 'hidden',
        fontFamily: "'DM Sans',system-ui,sans-serif", animation: 'ay-page .25s ease-out',
      }}
    >
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,199,116,.4),rgba(255,199,116,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(126,84,186,.35),rgba(126,84,186,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ flex: 'none', padding: 'max(16px, env(safe-area-inset-top)) 20px 12px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div onClick={goBack} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid rgba(255,249,242,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF9F2" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#FFC774', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SECTION_LABELS[step.section]}</div>
          </div>
          {step.optional && (
            <div onClick={goNext} style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,249,242,.65)', cursor: 'pointer', flex: 'none' }}>Skip</div>
          )}
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,249,242,.24)', overflow: 'hidden' }}>
          <div style={{ width: `${((currentIndex + 1) / visibleSteps.length) * 100}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FFC774,#E8A94F)' }} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}>
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, lineHeight: 1.17, color: '#FFF9F2' }}>{step.title}</div>
          {step.subtitle && <p style={{ margin: '8px 0 0', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,249,242,.72)' }}>{step.subtitle}</p>}
          {flaggedStepIds.has(step.id) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, padding: '6px 12px', borderRadius: 99, background: 'rgba(180,64,42,.16)', border: '1px solid rgba(180,64,42,.35)', color: '#FFC9BC', fontSize: 11.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: '#E8846F', flex: 'none' }} />
              Not answered yet
            </div>
          )}
        </div>
        <div style={{ padding: '20px 20px 20px', textAlign: 'left' }}>
          {renderBody()}
        </div>
      </div>

      <div style={{ flex: 'none', padding: '14px 20px max(20px, env(safe-area-inset-bottom))', position: 'relative', background: 'linear-gradient(to top,rgba(36,42,82,.35),rgba(36,42,82,0))' }}>
        <button
          onClick={goNext}
          disabled={!ready}
          style={{
            width: '100%', padding: 15, border: 'none', borderRadius: 99,
            background: ready ? 'linear-gradient(140deg,#FFDCA8,#FFC774 46%,#E8843C)' : 'rgba(255,249,242,.18)',
            color: ready ? NAVY : 'rgba(255,249,242,.5)',
            fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            cursor: ready ? 'pointer' : 'not-allowed',
            boxShadow: ready ? '0 16px 30px -14px rgba(232,132,60,.55)' : 'none',
          }}
        >
          <span>{isLast ? 'Finish profile' : 'Continue'}</span>
          {countForStep > 0 && <span style={{ background: 'rgba(42,31,78,.16)', borderRadius: 999, padding: '2px 9px', fontSize: 12 }}>{countForStep}</span>}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
