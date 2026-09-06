import { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';

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
// - Native drag-to-reorder for the "what matters to you" trust ranking —
//   HTML5 drag-and-drop doesn't fire reliably on touchscreens. The real
//   component's own up/down-arrow fallback (for accessibility) is used as
//   the only interaction here instead, not a fallback.

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
const PRICE_RANGES = ['Under $25', '$25–$75', '$75–$150', '$150+', 'Price is not a major factor for me'];
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

const SECTION_ORDER = ['core', 'support', 'safety', 'history', 'preferences', 'trust'];
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
  return getLifeStages(intake).some((value) => ['I get periods regularly', 'My periods are irregular'].includes(value)) || arrayHasAny(intake.supportSelections, PERIOD_TRIGGER);
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
  const customConcerns = [
    ...(intake.supportSelections || []).filter((item) => !['Nothing right now', 'Something else'].includes(item)),
    ...(intake.supportOtherText.trim() ? [intake.supportOtherText.trim()] : []),
  ];

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
// Colors lifted directly from the real desktop redesign's CSS-in-JS block so
// the mobile version matches it, not the app's older 3-stop intake gradient.

const NAVY = '#2A1F4E';
const CARD_BG = '#FFF9F2';
const ACCENT_BORDER = '#E8843C';
const ACCENT_BG = '#FFF3DD';
const MUTED = '#8c8078';
const LABEL_GOLD = '#FFDCA8';

const cardShadow = '0 10px 22px -16px rgba(0,0,0,.4)';

/* ------------------------------ Shared widgets ------------------------------ */

function SectionIcon({ section }) {
  const paths = {
    core: 'M12 21s-7.5-4.6-10-9.3C.3 8 2 4 6 4c2 0 3.5 1.2 4 2.8.5-1.6 2-2.8 4-2.8 4 0 5.7 4 4 7.7C19.5 16.4 12 21 12 21Z',
    support: null,
    safety: 'M12 3 5 6v6c0 5 3 8 7 9 4-1 7-4 7-9V6l-7-3Z',
    history: 'M12 7v5l3 3',
    preferences: 'M6 8h12l-1 12H7L6 8Z',
    trust: null,
  };
  const bg = { core: '#FFF3DD', support: '#EAEBF3', preferences: '#EAEBF3', trust: '#EAEBF3', safety: '#F1ECF4', history: '#FBEAD3' }[section];
  const stroke = { core: '#C0761F', support: '#242A52', preferences: '#242A52', trust: '#242A52', safety: '#4E3866', history: '#8A5A1E' }[section];
  return (
    <div style={{ width: 52, height: 52, borderRadius: 15, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 10px 24px -12px rgba(0,0,0,.35)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {section === 'support' ? (<><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" /></>) :
         section === 'history' ? (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>) :
         section === 'safety' ? (<><path d={paths.safety} /><path d="M9 12l2 2 4-4" /></>) :
         section === 'preferences' ? (<><path d={paths.preferences} /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>) :
         section === 'trust' ? (<><circle cx="12" cy="12" r="8.2" /><path d="M8 12h8M12 8v8" /></>) :
         (<path d={paths.core} />)}
      </svg>
    </div>
  );
}

function ChoiceGrid({ items, selected = [], onToggle }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <div
            key={item}
            onClick={() => onToggle(item)}
            style={{
              cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', minHeight: 60,
              padding: '16px 40px 16px 16px', borderRadius: 16, background: on ? ACCENT_BG : CARD_BG,
              border: '1.5px solid ' + (on ? ACCENT_BORDER : 'transparent'), boxShadow: cardShadow, color: NAVY,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
            <span style={{ position: 'absolute', top: 14, right: 14, width: 19, height: 19, borderRadius: '50%', border: '1.5px solid ' + (on ? NAVY : 'rgba(42,31,78,.25)'), background: on ? NAVY : 'transparent' }} />
          </div>
        );
      })}
    </div>
  );
}

function RowChoiceList({ items, selected = [], onToggle }) {
  return (
    <div>
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <div
            key={item}
            onClick={() => onToggle(item)}
            style={{
              width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              padding: '15px 16px', borderRadius: 16, background: on ? ACCENT_BG : CARD_BG,
              border: '1.5px solid ' + (on ? ACCENT_BORDER : 'transparent'), boxShadow: cardShadow, marginBottom: 9, color: NAVY,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
            <span style={{ width: 21, height: 21, borderRadius: 6, flex: 'none', border: '1.5px solid ' + (on ? NAVY : 'rgba(42,31,78,.25)'), background: on ? NAVY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {on ? '✓' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Pills({ options, selected, onToggle, left, compact }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 8 : 12, justifyContent: left ? 'flex-start' : 'center' }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <div
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              cursor: 'pointer', padding: compact ? '8px 11px' : '12px 19px', borderRadius: 999,
              background: on ? NAVY : CARD_BG, color: on ? '#fff' : NAVY,
              border: '1.5px solid ' + (on ? NAVY : 'rgba(42,31,78,.1)'),
              fontSize: compact ? 11.5 : 13.5, fontWeight: 600, boxShadow: on ? 'none' : '0 8px 16px -12px rgba(0,0,0,.35)',
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <div
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              cursor: 'pointer', flex: '1 1 100px', minWidth: 100, textAlign: 'center', padding: '15px 11px', borderRadius: 16,
              background: on ? NAVY : CARD_BG, color: on ? '#fff' : NAVY,
              border: '1.5px solid ' + (on ? NAVY : 'rgba(42,31,78,.1)'), fontSize: 13.5, fontWeight: 600,
              boxShadow: on ? 'none' : '0 10px 22px -16px rgba(0,0,0,.4)',
            }}
          >
            {opt}
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
      style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: 'none', fontSize: 14, color: NAVY, background: CARD_BG, boxShadow: '0 8px 18px -14px rgba(0,0,0,.5)', outline: 'none' }}
    />
  );
}

function OtherBox({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginTop: 16, textAlign: 'left' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: LABEL_GOLD, marginBottom: 9 }}>{label}</div>
      <TextInput value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function AgeCard({ value, onChange }) {
  const numeric = value ? Number(value) : 28;
  return (
    <div style={{ background: CARD_BG, borderRadius: 24, padding: '22px 24px 20px', boxShadow: '0 20px 44px -22px rgba(0,0,0,.5)', color: NAVY }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div onClick={() => onChange(String(Math.max(13, (value ? Number(value) : 28) - 1)))} style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(42,31,78,.15)', background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}>−</div>
        <div style={{ minWidth: 100, textAlign: 'center', fontFamily: "'Playfair Display',serif", fontSize: value ? 44 : 22, color: value ? NAVY : MUTED }}>{value || 'Select'}</div>
        <div onClick={() => onChange(String(Math.min(90, (value ? Number(value) : 27) + 1)))} style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(42,31,78,.15)', background: ACCENT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}>+</div>
      </div>
      <input type="range" min="13" max="90" value={numeric} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', marginTop: 18, display: 'block' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginTop: 4 }}><span>13</span><span>90</span></div>
    </div>
  );
}

function Scale({ options, value, onChange }) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 24, padding: 16, display: 'flex', gap: 7, overflowX: 'auto', boxShadow: '0 20px 44px -22px rgba(0,0,0,.5)' }}>
      {options.map((opt, i) => {
        const on = value === opt;
        return (
          <div key={opt} onClick={() => onChange(opt)} style={{ cursor: 'pointer', flex: 'none', minWidth: 74, padding: '12px 6px', borderRadius: 12, textAlign: 'center', background: on ? NAVY : '#fff', color: on ? '#fff' : NAVY, border: '1.5px solid rgba(42,31,78,.1)' }}>
            <span style={{ display: 'block', width: 14, height: 8 + Math.min(i, 4) * 4, maxHeight: 24, borderRadius: 999, background: on ? '#FFC774' : 'rgba(42,31,78,.18)', margin: '0 auto 8px' }} />
            <span style={{ fontSize: 10.5, lineHeight: 1.2 }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <div key={opt} onClick={() => onChange(opt)} style={{ cursor: 'pointer', flex: 'none', minWidth: 108, position: 'relative', paddingTop: 30, textAlign: 'center', color: on ? LABEL_GOLD : 'rgba(255,249,242,.72)' }}>
            <div style={{ position: 'absolute', top: 11, left: 0, right: 0, height: 3, background: 'rgba(255,249,242,.24)' }} />
            <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 19, height: 19, borderRadius: '50%', background: on ? NAVY : CARD_BG, border: '3px solid ' + (on ? LABEL_GOLD : 'rgba(42,31,78,.28)') }} />
            <span style={{ fontSize: 11, lineHeight: 1.3, fontWeight: on ? 700 : 400 }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function BrandSpectrum({ value, onChange }) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 24, padding: '20px 16px', boxShadow: '0 20px 44px -22px rgba(0,0,0,.5)' }}>
      <div style={{ height: 5, borderRadius: 999, background: 'linear-gradient(90deg,#4E3866,#FFC774,#D97A2B)', margin: '0 8px 16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        {BRAND_OPENNESS.map((opt) => {
          const on = value === opt;
          return (
            <div key={opt} onClick={() => onChange(opt)} style={{ cursor: 'pointer', padding: '12px 10px', borderRadius: 12, border: '1.5px solid ' + (on ? ACCENT_BORDER : 'rgba(42,31,78,.1)'), background: on ? ACCENT_BG : '#fff', color: NAVY, fontSize: 12.5, lineHeight: 1.3 }}>
              {opt}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAF1E2', borderRadius: 999, padding: '13px 18px', boxShadow: '0 10px 30px rgba(36,20,50,.14)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D84A0" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) addValue(draft); }}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#241A3D', fontSize: 14.5, minWidth: 0 }}
        />
      </div>
      {draft.trim().length > 0 && (
        <div style={{ marginTop: 8, borderRadius: 14, background: '#FFFAF3', boxShadow: '0 14px 28px -18px rgba(42,31,78,.45)', overflow: 'hidden' }}>
          <div onClick={() => addValue(draft)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', color: '#D98A52', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>+</span><span>Add "{draft.trim()}"</span>
          </div>
          {matches.map((option) => (
            <div key={option} onClick={() => addValue(option)} style={{ padding: '13px 18px', fontSize: 14, color: '#241A3D', cursor: 'pointer', borderTop: '1px solid rgba(36,26,61,.08)' }}>
              {option}
            </div>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14, justifyContent: 'center' }}>
          {values.map((value, i) => (
            <span key={`${value}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFAF3', color: '#241A3D', padding: '9px 10px 9px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, boxShadow: '0 3px 10px rgba(20,10,30,.12)' }}>
              {value}
              <span onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ width: 20, height: 20, borderRadius: '50%', background: '#F2E6D2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchableGroups({ groups, selected, onToggle, search, onSearch }) {
  const q = search.trim().toLowerCase();
  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !q || item.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)) }))
    .filter((group) => group.items.length);
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c8078" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search options..." style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px 13px 40px', borderRadius: 14, border: 'none', fontSize: 14, color: NAVY, background: CARD_BG, boxShadow: '0 8px 18px -14px rgba(0,0,0,.5)', outline: 'none' }} />
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', textAlign: 'left' }}>
        {visible.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: LABEL_GOLD, fontWeight: 700, margin: '10px 4px 8px' }}>{group.label}</div>
            <RowChoiceList items={group.items} selected={selected} onToggle={onToggle} />
          </div>
        ))}
        {visible.length === 0 && <div style={{ padding: '22px 4px', color: 'rgba(255,249,242,.75)', fontSize: 13 }}>No matches. Try a different search.</div>}
      </div>
    </div>
  );
}

function ProductHistoryBuilder({ products, onChange }) {
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
    setExpandedIndex(null);
  };
  const updateProduct = (index, patch) => onChange(products.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const removeProduct = (index) => {
    onChange(products.filter((_, i) => i !== index));
    setExpandedIndex((cur) => (cur === index ? null : cur > index ? cur - 1 : cur));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAF1E2', borderRadius: 999, padding: '13px 18px', boxShadow: '0 10px 30px rgba(36,20,50,.14)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D84A0" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#241A3D', fontSize: 14.5, minWidth: 0 }} />
      </div>
      {query.trim().length > 0 && (
        <div style={{ marginTop: 8, borderRadius: 14, background: '#FFFAF3', boxShadow: '0 14px 28px -18px rgba(42,31,78,.45)', overflow: 'hidden' }}>
          <div onClick={() => addProduct(query)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', color: '#D98A52', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>+</span><span>Add "{query.trim()}"</span>
          </div>
          {suggestions.map((name) => (
            <div key={name} onClick={() => addProduct(name)} style={{ padding: '13px 18px', fontSize: 14, color: '#241A3D', cursor: 'pointer', borderTop: '1px solid rgba(36,26,61,.08)' }}>{name}</div>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {products.map((product, index) => {
            const expanded = expandedIndex === index;
            const summary = [product.current, product.worked, product.reaction].filter(Boolean);
            return (
              <div key={`${product.name}-${index}`} style={{ background: CARD_BG, color: NAVY, border: '1px solid ' + (expanded ? 'rgba(232,132,60,.32)' : 'rgba(42,31,78,.09)'), borderRadius: 14, overflow: 'hidden', textAlign: 'left', boxShadow: '0 8px 20px -18px rgba(0,0,0,.5)' }}>
                <div onClick={() => setExpandedIndex(expanded ? null : index)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.length ? summary.join(' · ') : 'Optional details'}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flex: 'none', color: '#D97A2B', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {expanded && (
                  <div style={{ padding: '0 14px 16px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, marginBottom: 10 }}>Optional details</div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5c554e', marginBottom: 6 }}>Currently using it?</div>
                      <Segmented options={['Yes', 'No']} value={product.current} onChange={(v) => updateProduct(index, { current: v })} />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5c554e', marginBottom: 6 }}>How well did it work?</div>
                      <Pills options={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={product.worked ? [product.worked] : []} onToggle={(v) => updateProduct(index, { worked: v })} left compact />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5c554e', marginBottom: 6 }}>Any side effects or reactions?</div>
                      <Pills options={['No', 'Mild', 'Serious', 'Not sure']} selected={product.reaction ? [product.reaction] : []} onToggle={(v) => updateProduct(index, { reaction: v })} left compact />
                    </div>

                    {['Mild', 'Serious'].includes(product.reaction) && (
                      <input value={product.reactionText} onChange={(e) => updateProduct(index, { reactionText: e.target.value })} placeholder="What happened? (optional)" style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(42,31,78,.12)', fontSize: 13, color: NAVY }} />
                    )}

                    {product.current === 'No' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5c554e', marginBottom: 6 }}>Why did you stop?</div>
                        <Pills
                          options={STOP_REASONS}
                          selected={product.stopReasons || []}
                          onToggle={(reason) => updateProduct(index, {
                            stopReasons: (product.stopReasons || []).includes(reason) ? product.stopReasons.filter((x) => x !== reason) : [...(product.stopReasons || []), reason],
                          })}
                          left compact
                        />
                        {(product.stopReasons || []).includes('Other') && (
                          <input value={product.stopOther || ''} onChange={(e) => updateProduct(index, { stopOther: e.target.value })} placeholder="Other reason" style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(42,31,78,.12)', fontSize: 13, color: NAVY }} />
                        )}
                      </div>
                    )}

                    <div onClick={() => removeProduct(index)} style={{ marginTop: 6, color: '#9a7062', fontSize: 11, cursor: 'pointer' }}>Remove product</div>
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

function TrustRanker({ order, onChange, onTouch }) {
  const move = (index, delta) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onTouch();
    onChange(next);
  };
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {order.map((item, index) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CARD_BG, color: NAVY, borderRadius: 16, padding: '13px 14px', boxShadow: cardShadow }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: ACCENT_BG, color: '#8A5A1E', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{index + 1}</span>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{item}</span>
          <span style={{ display: 'flex', gap: 4, flex: 'none' }}>
            <div onClick={() => move(index, -1)} aria-label={`Move ${item} up`} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(42,31,78,.12)', background: '#fff', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: index === 0 ? 0.35 : 1 }}>↑</div>
            <div onClick={() => move(index, 1)} aria-label={`Move ${item} down`} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(42,31,78,.12)', background: '#fff', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: index === order.length - 1 ? 0.35 : 1 }}>↓</div>
          </span>
        </div>
      ))}
    </div>
  );
}

function TextAreaField({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: 'none', fontSize: 14, color: NAVY, background: CARD_BG, boxShadow: '0 8px 18px -14px rgba(0,0,0,.5)', outline: 'none', resize: 'vertical', minHeight: 128, lineHeight: 1.5, fontFamily: 'inherit' }}
    />
  );
}

/* --------------------------------- Main screen --------------------------------- */

export default function IntakeScreen({ onBack, onComplete }) {
  const [intake, setIntake] = useState(EMPTY);
  const [stepId, setStepId] = useState('age');
  const [search, setSearch] = useState('');

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
      { id: 'largePurchaseFrequency', section: 'preferences', title: 'How often do you make larger health or wellness purchases of $75 or more?', subtitle: 'This is about purchase frequency, not your usual preferred price per product.', type: 'largeSpend', optional: true },
      { id: 'brandOpenness', section: 'preferences', title: 'How do you feel about trying new brands?', type: 'brand', optional: true },
      ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [{ id: 'trustedBrands', section: 'preferences', title: 'Which brands do you already trust?', type: 'trustedBrands', optional: true }] : []),
      { id: 'avoidIngredients', section: 'preferences', title: 'Preferences', subtitle: 'Select any that matter to you. Allergies are handled separately.', type: 'avoidIngredients', optional: true },
      { id: 'fsaHsa', section: 'preferences', title: 'Do you have an FSA or HSA you would like to use?', type: 'fsa', optional: true },
      { id: 'trust', section: 'trust', title: 'What matters most to you when deciding whether to trust a product?', subtitle: 'Rank these using the arrows. You can also skip this.', type: 'trust', optional: true },
      { id: 'anythingElse', section: 'trust', title: 'Anything else you want Ayna to know?', subtitle: 'Share anything else that could help us personalize your recommendations.', type: 'textarea', optional: true },
    ];
    return steps;
  }, [intake]);

  const currentIndex = Math.max(0, visibleSteps.findIndex((s) => s.id === stepId));
  const step = visibleSteps[currentIndex] || visibleSteps[0];
  const sectionIndex = Math.max(0, SECTION_ORDER.indexOf(step.section));
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
          <div style={{ marginTop: 18, padding: 16, background: 'rgba(255,249,242,.1)', border: '1px solid rgba(255,249,242,.18)', borderRadius: 18, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF9F2', marginBottom: 12 }}>Are you currently breastfeeding?</div>
            <Segmented options={['Yes', 'No', 'Prefer not to say']} value={intake.breastfeedingStatus} onChange={(v) => set('breastfeedingStatus', v)} />
          </div>
        )}
        {selectedLifeStages.includes('I am in perimenopause') && (
          <div style={{ marginTop: 18, padding: 16, background: 'rgba(255,249,242,.1)', border: '1px solid rgba(255,249,242,.18)', borderRadius: 18, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF9F2', marginBottom: 12 }}>When was your last period?</div>
            <Pills options={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => set('perimenopauseLastPeriod', v)} />
          </div>
        )}
        {selectedLifeStages.includes('Other') && (
          <OtherBox label="Tell us what best describes you (optional)" value={intake.lifeStageOther} onChange={(v) => set('lifeStageOther', v)} placeholder="Type here..." />
        )}
      </>
    );

    if (step.type === 'zip') return <TextInput value={intake.zipcode} onChange={(v) => set('zipcode', v.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 10001" inputMode="numeric" maxLength={5} />;

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

    if (step.type === 'conditions') return (
      <>
        <RowChoiceList items={CONDITIONS} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} />
        {intake.diagnosisSelections.includes('Other / not listed') && (
          <OtherBox label="What condition was diagnosed?" value={intake.conditionOtherText} onChange={(v) => set('conditionOtherText', v)} placeholder="Type the condition..." />
        )}
      </>
    );

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
        <div style={{ maxWidth: 480, margin: '18px auto 0', padding: '13px 15px', border: '1px solid rgba(255,220,168,.25)', background: 'rgba(255,249,242,.08)', borderRadius: 14, color: 'rgba(255,249,242,.78)', fontSize: 12, lineHeight: 1.55, textAlign: 'left' }}>
          Always consult a clinician before starting a new supplement or medication. Ayna surfaces options relevant to the profile you shared, but you should still check product ingredients, labels, and instructions.
        </div>
      </>
    );

    if (step.type === 'products') return <ProductHistoryBuilder products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
    if (step.type === 'avoidRepeat') return <TokenInput values={intake.avoidRepeat} onChange={(v) => set('avoidRepeat', v)} placeholder="Start typing a product or brand" suggestions={PRODUCT_OR_BRAND_SUGGESTIONS} />;
    if (step.type === 'trustedBrands') return <TokenInput values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Start typing a brand" suggestions={BRAND_SUGGESTIONS} />;

    if (step.type === 'safety') return (
      <>
        <Segmented options={['Yes', 'No', 'Not sure']} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && (
          <div style={{ maxWidth: 480, margin: '18px auto 0', padding: '13px 15px', border: '1px solid rgba(255,220,168,.25)', background: 'rgba(255,249,242,.08)', borderRadius: 14, color: 'rgba(255,249,242,.78)', fontSize: 12, lineHeight: 1.55, textAlign: 'left' }}>
            Some new or worsening symptoms may need evaluation by a healthcare professional. Ayna helps with product discovery and education and does not diagnose medical conditions or replace professional medical care. If symptoms feel urgent or severe, seek appropriate medical care promptly.
          </div>
        )}
      </>
    );

    if (step.type === 'formats') return (
      <>
        <ChoiceGrid items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} />
        {intake.preferredFormats.includes('Other') && (
          <OtherBox label="What format do you prefer?" value={intake.formatOtherText} onChange={(v) => set('formatOtherText', v)} placeholder="Type here..." />
        )}
      </>
    );

    if (step.type === 'price') {
      const selectedPrices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
      return <Pills options={PRICE_RANGES} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, ['Price is not a major factor for me'])} />;
    }
    if (step.type === 'largeSpend') return <Timeline options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(v) => set('largePurchaseFrequency', v)} />;
    if (step.type === 'brand') return <BrandSpectrum value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
    if (step.type === 'avoidIngredients') return (
      <>
        <Pills options={AVOID_INGREDIENTS} selected={intake.avoidIngredients} onToggle={(v) => toggleExclusive('avoidIngredients', v, ['No preference'])} />
        {intake.avoidIngredients.includes('Other') && (
          <OtherBox label="Other preference" value={intake.avoidIngredientsOtherText} onChange={(v) => set('avoidIngredientsOtherText', v)} placeholder="Type here..." />
        )}
      </>
    );
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 24, paddingRight: 24, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20 }}>ayna</span>
          <span style={{ fontSize: 10, color: 'rgba(255,249,242,.6)' }}>beta</span>
        </div>
        <div onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,249,242,.8)', cursor: 'pointer', padding: '4px 2px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'rgba(255,249,242,.8)' }}>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '22px 24px 0', position: 'relative' }}>
        {SECTION_ORDER.map((section, i) => (
          <div key={section} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= sectionIndex ? '#FFC774' : 'rgba(255,249,242,.24)' }} />
        ))}
      </div>
      <div style={{ padding: '8px 24px 0', fontSize: 12, color: 'rgba(255,249,242,.55)', position: 'relative' }}>{SECTION_LABELS[step.section]}</div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative', padding: '20px 24px 24px', textAlign: 'center' }}>
        <SectionIcon section={step.section} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 500, fontSize: 25, lineHeight: 1.3, margin: '0 auto 10px', maxWidth: 480, color: '#FFF9F2' }}>{step.title}</div>
        {step.subtitle && <p style={{ margin: '0 auto 10px', fontSize: 14, color: 'rgba(255,249,242,.72)', lineHeight: 1.5, maxWidth: 440 }}>{step.subtitle}</p>}
        {!step.optional && <p style={{ margin: '5px auto 0', fontSize: 12, color: '#FFDCA8', fontWeight: 600 }}>Required for safety</p>}
        <div style={{ marginTop: 26, textAlign: step.type === 'support' || step.type === 'medications' || step.type === 'allergies' || step.type === 'products' || step.type === 'avoidRepeat' || step.type === 'trustedBrands' ? 'left' : 'center' }}>
          {renderBody()}
        </div>
      </div>

      <div style={{ padding: '14px 24px 34px', position: 'relative', background: 'linear-gradient(to top,rgba(36,42,82,.35),rgba(36,42,82,0))' }}>
        <button
          onClick={goNext}
          disabled={!ready}
          style={{
            width: '100%', padding: 16, border: 'none', borderRadius: 16,
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
        {step.optional && (
          <div onClick={goNext} style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,249,242,.62)', padding: '16px 0 0', cursor: 'pointer' }}>
            {step.id === 'products' ? 'Skip for now' : 'Skip this step'}
          </div>
        )}
      </div>
    </div>
  );
}
