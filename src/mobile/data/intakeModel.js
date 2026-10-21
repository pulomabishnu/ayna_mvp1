// The intake questions and answer logic, shared by the app's quiz
// (src/mobile/screens/IntakeScreen.jsx) and the website's quiz
// (src/components/WebIntake.jsx), so both always ask the same questions and
// save the same answers. Change questions here, not in either screen.
import { ALL_PRODUCTS } from '../../data/products.js';
import { normalizeAge, normalizeLifeStages, selectLifeStage } from '../../utils/intakeSelections.js';

export const SUPPORT_GROUPS = [
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
  { label: 'Skin + hair', items: ['Acne', 'Hair thinning or hair loss', 'Excess facial or body hair', 'Hormone-related skin concerns'] },
  { label: 'Metabolic + physical wellness', items: ['Metabolism or weight support', 'Strength or fitness', 'Bone health'] },
  { label: 'Care access', items: ['Finding a doctor or specialist', 'Finding a telehealth provider'] },
  { label: 'Right now', items: ['Nothing right now'] },
];

export const LIFE_STAGES = [
  'I get periods regularly', 'My periods are irregular', 'I do not currently get periods',
  'I use hormonal birth control', 'I am trying to conceive', 'I am pregnant', 'I am postpartum',
  'I am in perimenopause', 'I am in menopause', 'I am post-menopause',
];
export const LIFE_STAGE_LABELS = {
  'I get periods regularly': 'Regular periods',
  'My periods are irregular': 'Irregular periods',
  'I do not currently get periods': 'No periods now',
  'I use hormonal birth control': 'Hormonal birth control',
  'I am trying to conceive': 'Trying to conceive',
  'I am pregnant': 'Pregnant',
  'I am postpartum': 'Postpartum',
  'I am in perimenopause': 'Perimenopause',
  'I am in menopause': 'Menopause',
  'I am post-menopause': 'Post-menopause',
};
export const LIFE_STAGE_VALUE_BY_LABEL = Object.fromEntries(Object.entries(LIFE_STAGE_LABELS).map(([value, label]) => [label, value]));
// Abstract "phase" marks (CSS-drawn) so each stage reads at a glance
// without leaning on clip-art icons.
export const LIFE_STAGE_GLYPHS = {
  'I get periods regularly': 'full',
  'My periods are irregular': 'wobble',
  'I do not currently get periods': 'empty',
  'I use hormonal birth control': 'pill',
  'I am trying to conceive': 'spark',
  'I am pregnant': 'bump',
  'I am postpartum': 'pair',
  'I am in perimenopause': 'half',
  'I am in menopause': 'crescent',
  'I am post-menopause': 'ring',
};
export const MIDLIFE_LIFE_STAGES = ['I am in perimenopause', 'I am in menopause', 'I am post-menopause'];
// Answers to the life-stage question that are not a stage. Each one is
// exclusive (it clears the stages, and picking a stage clears it), so nobody
// has to pick a stage that is not true for them. Stored as-is; they never
// imply a stage.
export const LIFE_STAGE_NOT_SURE = 'None of these / not sure';
export const LIFE_STAGE_PREFER_NOT = 'Prefer not to say';
export const LIFE_STAGE_EXCLUSIVE = [LIFE_STAGE_NOT_SURE, LIFE_STAGE_PREFER_NOT];
/** Toggle one life-stage answer: real stages keep their own conflict rules, the two non-stage answers are exclusive. */
export function toggleLifeStageSelection(current = [], value) {
  const list = Array.isArray(current) ? current : [];
  if (LIFE_STAGE_EXCLUSIVE.includes(value)) return list.includes(value) ? [] : [value];
  return selectLifeStage(list.filter((item) => !LIFE_STAGE_EXCLUSIVE.includes(item)), value);
}

const REGULAR = 'I get periods regularly';
const IRREGULAR = 'My periods are irregular';
const NO_PERIODS = 'I do not currently get periods';
const PERI = 'I am in perimenopause';
const ensureStage = (list, value) => (list.includes(value) ? list : selectLifeStage(list, value));

/**
 * Keep the life-stage picks and the perimenopause follow-up in agreement.
 * Regular (or irregular) periods next to Perimenopause answers the
 * follow-up for her; un-picking that period stage clears the answer it set.
 */
export function syncPerimenopausePeriods(intake) {
  const stages = Array.isArray(intake.lifeStageSelections) ? intake.lifeStageSelections : [];
  if (!stages.includes(PERI)) return intake;
  const answer = intake.perimenopauseLastPeriod || '';
  let next = answer;
  if (stages.includes(REGULAR)) next = PERI_STILL_REGULAR;
  else if (stages.includes(IRREGULAR)) next = PERI_IRREGULAR;
  else if (answer === PERI_STILL_REGULAR || answer === PERI_IRREGULAR) next = '';
  return next === answer ? intake : { ...intake, perimenopauseLastPeriod: next };
}

/** Answer the perimenopause follow-up; the period stage it implies is picked too. */
export function setPerimenopausePeriods(intake, value) {
  const stages = getLifeStages(intake).filter((item) => !LIFE_STAGE_EXCLUSIVE.includes(item));
  const implied = { [PERI_STILL_REGULAR]: REGULAR, [PERI_IRREGULAR]: IRREGULAR, [PERI_NONE_3_12]: NO_PERIODS, [PERI_NONE_12]: NO_PERIODS }[value];
  let nextStages = stages;
  if (implied) nextStages = ensureStage(stages, implied);
  else if (stages.includes(REGULAR) || stages.includes(IRREGULAR)) nextStages = stages.filter((item) => item !== REGULAR && item !== IRREGULAR);
  if (!nextStages.includes(PERI)) nextStages = ensureStage(nextStages, PERI);
  return { ...intake, perimenopauseLastPeriod: value, lifeStageSelections: nextStages, lifeStage: nextStages[0] || '' };
}

export const PERIOD_FLOW = ['Very light', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'It varies', 'I do not currently get periods', 'Not sure'];
export const PERIOD_PAIN = ['None', 'Mild', 'Moderate', 'Severe', 'Very severe', 'It varies', 'Not sure'];
export const UTI_FREQUENCY = ['This is the first time', 'Rarely', 'A few times a year', 'About monthly', 'More than once a month', 'I am experiencing them right now', 'Not sure'];
export const POSTPARTUM_TIMING = ['Less than 6 weeks ago', '6 weeks–3 months ago', '3–6 months ago', '6–12 months ago', 'More than 12 months ago'];
export const PREGNANCY_TRIMESTER = ['First trimester', 'Second trimester', 'Third trimester', 'Not sure', 'Prefer not to say'];
// Perimenopause follow-up. Periods can still be regular in perimenopause,
// so the answer describes her periods now, not only a last-period date.
// Saved as perimenopauseLastPeriod (same field as before). Older saved
// answers ('Within the past 3 months', '3–6 months ago', ...) stay valid.
export const PERI_STILL_REGULAR = 'Still regular';
export const PERI_IRREGULAR = 'Irregular or skipping';
export const PERI_NONE_3_12 = 'None for 3 to 12 months';
export const PERI_NONE_12 = 'None for over 12 months';
export const PERIMENOPAUSE_LAST_PERIOD = [PERI_STILL_REGULAR, PERI_IRREGULAR, PERI_NONE_3_12, PERI_NONE_12, "I'm not sure", 'Prefer not to say'];
export const TTC_DURATION = ['Not trying yet', 'Less than 6 months', '6–12 months', 'More than 12 months', 'Prefer not to say'];
export const MEDICATION_STATUS = ['Yes', 'No', "I'm not sure", 'Prefer not to say'];
export const ALLERGY_STATUS = ['Yes', 'No', "I'm not sure", 'Prefer not to say'];
export const URGENT_STATUS = ['Yes', 'No', 'Not sure'];
export const BREASTFEEDING_STATUS = ['Yes', 'No', 'Prefer not to say'];
// Follow-up question copy, shared so the app and the website ask the same thing.
export const FOLLOWUP_QUESTIONS = {
  breastfeedingStatus: 'Are you breastfeeding or pumping?',
  perimenopauseLastPeriod: 'How are your periods now?',
  largePurchaseFrequency: 'How often are you comfortable making $75+ purchases?',
};

export const CONDITIONS = [
  'PCOS', 'Endometriosis', 'Fibroids', 'Adenomyosis', 'PMS', 'PMDD', 'Infertility', 'Thyroid condition',
  'Diabetes', 'Insulin resistance', 'High blood pressure', 'Migraine with aura', 'Anemia or iron deficiency',
  'IBS or another digestive condition', 'Autoimmune condition', 'Anxiety', 'Depression',
  'None that I know of', 'Prefer not to say',
];

export const ALLERGIES = [
  'Latex', 'Fragrance', 'Adhesives', 'NSAIDs such as ibuprofen', 'Acetaminophen', 'Aspirin', 'Antibiotics',
  'Hormonal medications', 'Topical ingredients', 'Supplements or herbal ingredients',
  'Nickel', 'Essential oils', 'Dyes', 'Preservatives', 'Gluten', 'Soy', 'Dairy',
];

export const MEDICATION_SUGGESTIONS = [
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

export const CATALOG_PRODUCT_NAMES = [...new Set((ALL_PRODUCTS || []).map((p) => p?.name).filter(Boolean))];
export const CATALOG_BRANDS = [...new Set((ALL_PRODUCTS || []).flatMap((p) => [p?.brand, p?.brandName, p?.manufacturer, p?.company]).filter(Boolean))];
export const COMMON_BRAND_SUGGESTIONS = [
  'LOLA', 'Cora', 'The Honey Pot', 'Rael', 'Saalt', 'August', 'Always', 'Tampax', 'U by Kotex',
  'Ritual', 'O Positiv', 'Love Wellness', 'Thorne', 'Nature Made', 'Garden of Life', 'Good Clean Love',
];
export const BRAND_SUGGESTIONS = [...new Set([...CATALOG_BRANDS, ...COMMON_BRAND_SUGGESTIONS])];
export const PRODUCT_OR_BRAND_SUGGESTIONS = [...new Set([...CATALOG_PRODUCT_NAMES, ...BRAND_SUGGESTIONS])];

export const PRODUCT_FORMATS = [
  'Pills or capsules', 'Gummies', 'Powders', 'Drinks or teas', 'Creams, lotions, or gels', 'Patches',
  'Suppositories', 'Devices or wearables', 'Period-care products', 'No preference',
];

export const PRICE_RANGES = ['Under $25', '$25–$75', '$75–$150', '$150+', 'Price is not a major factor for me'];

export const LARGE_PURCHASE_FREQUENCY = ['Never', 'Rarely', 'A few times a year', 'About once a month', 'More than once a month'];
export const BRAND_OPENNESS = [
  'I mostly stick with brands I already trust',
  'I prefer trusted brands but am open to something new',
  'I like a mix of familiar and new brands',
  'I enjoy discovering new brands',
  'No preference',
];
export const AVOID_INGREDIENTS = [
  'Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials',
  'Animal-derived', 'Added sugar', 'Artificial sweeteners', 'Pregnancy considerations',
  'Fragrance-free', 'Dye-free', 'Paraben-free', 'Sulfate-free', 'Latex-free', 'Vegan', 'Cruelty-free',
  'Black-owned', 'Brown-owned', 'Eco-friendly', 'Reusable', 'Organic', 'Minimal ingredients',
  'Sensitive skin', 'Unscented', 'No preference',
];
export const FSA_HSA = ['FSA', 'HSA', 'Both', 'No', 'Not sure'];

export const AVOID_PAIRS = { Fragrance: 'Fragrance-free', Dyes: 'Dye-free', Parabens: 'Paraben-free', Sulfates: 'Sulfate-free', Latex: 'Latex-free' };
// Same values as AVOID_INGREDIENTS, grouped so "Fragrance" (leave out) and "Vegan" (should be) don't read as one list.
export const AVOID_GROUPS = {
  avoid: ['Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials', 'Animal-derived', 'Added sugar', 'Artificial sweeteners'],
  want: ['Unscented', 'Organic', 'Vegan', 'Cruelty-free', 'Minimal ingredients', 'Sensitive skin', 'Reusable', 'Eco-friendly', 'Pregnancy considerations', 'Black-owned', 'Brown-owned'],
};
// Display wording for a few stored values (the stored value is what the
// matching engine already reads).
export const AVOID_LABELS = { 'Sensitive skin': 'Sensitive-skin friendly' };
export const AVOID_VALUE_BY_LABEL = Object.fromEntries(Object.entries(AVOID_LABELS).map(([v, l]) => [l, v]));
export const TRUST_ITEMS = ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'];
export const STOP_REASONS = [
  'It did not help', 'It stopped working', 'I had side effects or a reaction', 'It was too expensive',
  'It was inconvenient', 'I did not like the format', 'I found something better',
  'A clinician recommended stopping it', 'I simply did not repurchase it',
];

export const EMPTY = {
  age: '', lifeStage: '', lifeStageSelections: [], lifeStageOther: '', zipcode: '',
  supportSelections: [], supportOtherText: '',
  periodFlow: '', periodPain: '', utiFrequency: '', ttcDuration: '', postpartumTiming: '',
  pregnancyTrimester: '', breastfeedingStatus: '', perimenopauseLastPeriod: '',
  diagnosisSelections: [], conditionOtherText: '',
  allergyStatus: '', allergyItems: [], allergySelections: [], allergyOtherText: '',
  takesCurrent: '', currentMedicationItems: [],
  productHistory: [], avoidRepeat: [], safetyConcern: '',
  preferredFormats: [], formatOtherText: '', recommendedProductsPerArea: 3, priceRange: [], largePurchaseFrequency: '',
  brandOpenness: '', trustedBrands: [], brandSupportPreferences: [],
  avoidIngredients: [], avoidIngredientsOtherText: '', fsaHsaAnswer: '',
  trustRanking: TRUST_ITEMS, trustRankingTouched: false, anythingElse: '',
  skippedSteps: [], recommendationCountTouched: false,
};

// Field-name map from the legacy snapshot shape (buildSnapshot()'s output,
// what quizAnswers.fullHealthIntake actually holds) back to this wizard's
// own EMPTY-shaped state, for resuming an already-completed intake instead
// of starting over. Most fields are direct passthroughs in buildSnapshot
// (see below), so reconstruction is lossless for everything listed here;
// fsaHsa is the one field buildSnapshot maps to a different slug, so it
// gets a real reverse-lookup instead of a passthrough.
export const FSA_HSA_REVERSE = { fsa: 'FSA', hsa: 'HSA', both: 'Both', none: 'No', unsure: 'Not sure' };
export const RESUMABLE_PASSTHROUGH_FIELDS = [
  'age', 'lifeStage', 'lifeStageSelections', 'lifeStageOther', 'zipcode',
  'supportSelections', 'supportOtherText',
  'periodFlow', 'periodPain', 'utiFrequency', 'ttcDuration', 'postpartumTiming', 'pregnancyTrimester',
  'breastfeedingStatus', 'perimenopauseLastPeriod',
  'diagnosisSelections', 'conditionOtherText',
  'allergyStatus', 'allergyItems',
  'takesCurrent', 'currentMedicationItems',
  'productHistory', 'avoidRepeat', 'safetyConcern',
  'preferredFormats', 'formatOtherText', 'recommendedProductsPerArea', 'priceRange', 'largePurchaseFrequency',
  'brandOpenness', 'trustedBrands', 'brandSupportPreferences',
  'avoidIngredients', 'avoidIngredientsOtherText',
  'anythingElse', 'skippedSteps', 'recommendationCountTouched',
];

export function reconstructIntakeFromSnapshot(snapshot) {
  if (!snapshot) return EMPTY;
  const next = { ...EMPTY };
  RESUMABLE_PASSTHROUGH_FIELDS.forEach((key) => {
    if (snapshot[key] !== undefined && snapshot[key] !== null) next[key] = snapshot[key];
  });
  [
    ['lifeStageSelections', 'Other', 'lifeStageOther'],
    ['supportSelections', 'Something else', 'supportOtherText'],
    ['diagnosisSelections', 'Other / not listed', 'conditionOtherText'],
    ['preferredFormats', 'Other', 'formatOtherText'],
    ['avoidIngredients', 'Other', 'avoidIngredientsOtherText'],
  ].forEach(([key, legacyOption, textKey]) => {
    if (!Array.isArray(next[key]) || !next[key].includes(legacyOption)) return;
    next[key] = next[key].filter((item) => item !== legacyOption);
    if (String(next[textKey] || '').trim()) next[key].push(String(next[textKey]).trim());
  });
  next.supportSelections = (next.supportSelections || []).map((item) => item === 'Other hormone-related skin concerns' ? 'Hormone-related skin concerns' : item);
  next.productHistory = (next.productHistory || []).map((product) => ({
    ...product,
    stopReasons: (product.stopReasons || []).filter((reason) => reason !== 'Other').concat(product.stopOther?.trim() || []),
  }));
  if (next.lifeStage === 'Other') next.lifeStage = next.lifeStageSelections[0] || '';
  next.lifeStageSelections = normalizeLifeStages(next.lifeStageSelections.length ? next.lifeStageSelections : next.lifeStage ? [next.lifeStage] : []);
  next.lifeStage = next.lifeStageSelections[0] || '';
  if (snapshot.fsaHsa) next.fsaHsaAnswer = FSA_HSA_REVERSE[snapshot.fsaHsa] || '';
  if (Array.isArray(snapshot.trustRanking) && snapshot.trustRanking.length > 0) {
    next.trustRanking = snapshot.trustRanking;
    next.trustRankingTouched = true;
  }
  return next;
}

export const PERIOD_TRIGGER = new Set([
  'Period product support', 'Cramps or period pain', 'Pelvic pain', 'Heavy periods', 'Light periods',
  'Irregular periods', 'Missed periods', 'Spotting between periods', 'PMS symptoms', 'PMDD symptoms',
  'Breast tenderness', 'Cycle-related headaches or migraines',
]);
export const UTI_TRIGGER = new Set(['Burning with urination', 'Frequent urination', 'Urinary urgency', 'Recurrent UTI-like symptoms']);
export const TTC_TRIGGER = new Set(['Fertility support', 'Trying to conceive', 'Ovulation tracking or support']);
export const PREGNANCY_TRIGGER = new Set(['Prenatal or pregnancy support', 'Pregnancy-related discomfort', 'Pregnancy-safe product discovery']);
export const POSTPARTUM_TRIGGER = new Set(['Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes']);

export const LEGACY_CONCERN_BY_ITEM = {
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
  // Not CONCERN_AREAS names on their own, so they never matched; both mostly
  // mean heavy, painful periods.
  'Fibroid-related concerns': ['Period care (pads, tampons, cups, discs, underwear)', 'Cramp and pain relief (devices, supplements, heat)'],
  'Adenomyosis-related concerns': ['Period care (pads, tampons, cups, discs, underwear)', 'Cramp and pain relief (devices, supplements, heat)'],
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
  'Hormone-related skin concerns': 'Skin and hair (hormone-related)',
  'Other hormone-related skin concerns': 'Skin and hair (hormone-related)',
  'Metabolism or weight support': 'Hormone balance (supplements, lifestyle)',
  'Strength or fitness': 'Sleep and energy',
  'Bone health': 'Perimenopause and menopause support',
  'Finding a doctor or specialist': 'Telehealth and provider matching',
  'Finding a telehealth provider': 'Telehealth and provider matching',
};

export const CONDITION_TO_LEGACY = {
  PCOS: 'PCOS', Endometriosis: 'endometriosis', Fibroids: 'fibroids', Adenomyosis: 'adenomyosis',
  PMDD: 'PMDD', 'Anemia or iron deficiency': 'anemia / iron deficiency',
};

export const FORMAT_TO_LEGACY = {
  'Pills or capsules': 'supplements', Gummies: 'supplements', Powders: 'supplements', 'Drinks or teas': 'supplements',
  'Creams, lotions, or gels': 'topicals', Patches: 'devices', Suppositories: 'personal care',
  'Devices or wearables': 'devices', 'Period-care products': 'pads',
};

export const PREFERENCE_MAP = {
  // Leave out
  Fragrance: 'fragrance-free', Dyes: 'dye-free', Parabens: 'paraben-free', Sulfates: 'sulfate-free',
  Phthalates: 'phthalate-free', Latex: 'latex-free', 'Synthetic materials': 'natural-materials',
  'Animal-derived': 'vegan', 'Animal-derived ingredients': 'vegan', 'Added sugar': 'sugar-free', 'Artificial sweeteners': 'no-artificial-sweeteners',
  // Paired values stored with a Leave out pick (AVOID_PAIRS)
  'Fragrance-free': 'fragrance-free', 'Dye-free': 'dye-free', 'Paraben-free': 'paraben-free', 'Sulfate-free': 'sulfate-free', 'Latex-free': 'latex-free',
  // Should be
  Unscented: 'fragrance-free', Organic: 'organic', Vegan: 'vegan', 'Cruelty-free': 'cruelty-free',
  'Minimal ingredients': 'minimal ingredients', 'Eco-friendly': 'sustainable/eco-friendly',
};
// "Should be" picks that are about who makes the product, not what is in it.
export const BRAND_SUPPORT_OPTIONS = ['Black-owned', 'Brown-owned'];
// Product history answers: the quiz saves the short UI words; older saved
// profiles used the long ones. Both count.
export const WORSE_ANSWERS = new Set(['Made it worse', 'Made things worse']);
export const SERIOUS_REACTIONS = new Set(['Serious', 'Serious or concerning reaction']);

export function arrayHasAny(arr, set) {
  return (arr || []).some((value) => set.has(value));
}
export function getLifeStages(intake) {
  const selected = Array.isArray(intake.lifeStageSelections) ? intake.lifeStageSelections.filter(Boolean) : [];
  if (selected.length) return selected;
  return intake.lifeStage ? [intake.lifeStage] : [];
}
export function hasLifeStage(intake, value) {
  return getLifeStages(intake).includes(value);
}
const hasNeed = (intake, value) => (intake.supportSelections || []).includes(value);

// CONDITIONAL QUESTIONS (founder intake spec). "required" means the person
// must answer it before the first matches; "optional" means it is offered in
// the optional refinements and skipping it is neutral.
// Flow: required for period products, heavy or light periods. Optional for
// any other period or cycle need. Never asked because of a life stage alone.
export const FLOW_REQUIRED_TRIGGER = new Set(['Period product support', 'Heavy periods', 'Light periods']);
export function flowRequired(intake) {
  return arrayHasAny(intake.supportSelections, FLOW_REQUIRED_TRIGGER);
}
export function flowOptional(intake) {
  return !flowRequired(intake) && arrayHasAny(intake.supportSelections, PERIOD_TRIGGER);
}
// Pain: only for cramps or period pain (pelvic pain is not period pain).
export function painRequired(intake) {
  return hasNeed(intake, 'Cramps or period pain');
}
// TTC duration: required when she says she is actively trying (stage or
// need). Optional, with "Not trying yet", for fertility support or ovulation
// tracking alone.
export function ttcRequired(intake) {
  return hasLifeStage(intake, 'I am trying to conceive') || hasNeed(intake, 'Trying to conceive');
}
export function ttcOptional(intake) {
  return !ttcRequired(intake) && (hasNeed(intake, 'Fertility support') || hasNeed(intake, 'Ovulation tracking or support'));
}
// UTI frequency: the four UTI-like symptoms only, never bladder leakage.
export function utiRequired(intake) {
  return arrayHasAny(intake.supportSelections, UTI_TRIGGER);
}
// Postpartum timing: postpartum stage or any postpartum need.
export function postpartumRequired(intake) {
  return hasLifeStage(intake, 'I am postpartum') || arrayHasAny(intake.supportSelections, POSTPARTUM_TRIGGER);
}
// Trimester: required only when she selected "Pregnant". A pregnancy need
// without the stage gets it as an optional question.
export function trimesterRequired(intake) {
  return hasLifeStage(intake, 'I am pregnant');
}
export function trimesterOptional(intake) {
  return !trimesterRequired(intake) && arrayHasAny(intake.supportSelections, PREGNANCY_TRIGGER);
}
// Kept for callers that only need "is this question shown at all".
export function isPeriodRelevant(intake) {
  return flowRequired(intake) || flowOptional(intake);
}
export function isPainRelevant(intake) {
  return painRequired(intake);
}
export function isUtiRelevant(intake) {
  return utiRequired(intake);
}
export function isTtcRelevant(intake) {
  return ttcRequired(intake) || ttcOptional(intake);
}
export function isPregnancyRelevant(intake) {
  return trimesterRequired(intake) || trimesterOptional(intake);
}
export function isPostpartumRelevant(intake) {
  return postpartumRequired(intake);
}
export function isPerimenopauseRelevant(intake) {
  return hasLifeStage(intake, 'I am in perimenopause');
}
/** "Not trying yet" only makes sense when she has not said she is trying. */
export function ttcDurationOptions(intake) {
  return ttcRequired(intake) ? TTC_DURATION.filter((x) => x !== 'Not trying yet') : TTC_DURATION;
}
/** Breastfeeding is asked with the life stage; anyone postpartum only through a need gets it on the timing step. */
export function asksBreastfeedingOnTiming(intake) {
  return isPostpartumRelevant(intake) && !hasLifeStage(intake, 'I am postpartum');
}

export function buildSnapshot(intake) {
  const lifeStageSelections = getLifeStages(intake);
  const realLifeStages = lifeStageSelections.filter((item) => !LIFE_STAGE_EXCLUSIVE.includes(item));
  const primaryLifeStage = (LIFE_STAGE_EXCLUSIVE.includes(intake.lifeStage) ? '' : intake.lifeStage) || realLifeStages[0] || '';
  const primaryConcerns = [...new Set((intake.supportSelections || []).flatMap((item) => LEGACY_CONCERN_BY_ITEM[item] || []))];
  const knownSupportOptions = new Set(SUPPORT_GROUPS.flatMap((group) => group.items));
  const customConcerns = [...new Set([
    ...(intake.supportSelections || []).filter((item) => !knownSupportOptions.has(item) && item !== 'Something else'),
    intake.supportOtherText.trim(),
  ].filter(Boolean))];
  const customLifeStages = lifeStageSelections.filter((item) => !LIFE_STAGES.includes(item) && !LIFE_STAGE_EXCLUSIVE.includes(item) && item !== 'Other');
  const customConditions = (intake.diagnosisSelections || []).filter((item) => !CONDITIONS.includes(item) && !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(item));
  const customFormats = (intake.preferredFormats || []).filter((item) => !PRODUCT_FORMATS.includes(item) && item !== 'Other');
  const customPreferences = (intake.avoidIngredients || []).filter((item) => !AVOID_INGREDIENTS.includes(item) && item !== 'Other');

  const conditions = (intake.diagnosisSelections || [])
    .filter((v) => !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(v))
    .map((v) => CONDITION_TO_LEGACY[v] || v.toLowerCase());
  if (intake.diagnosisSelections.includes('Other / not listed') && intake.conditionOtherText.trim()) conditions.push(intake.conditionOtherText.trim().toLowerCase());

  // Her period pattern comes from the period stage she picked, wherever it
  // sits in the list, so "Regular periods + Perimenopause" still reads as
  // regular (not irregular_perimenopause).
  const periAnswer = isPerimenopauseRelevant(intake) ? intake.perimenopauseLastPeriod : '';
  const periodPattern = realLifeStages.includes('I am pregnant') ? 'no'
    : realLifeStages.includes(REGULAR) || periAnswer === PERI_STILL_REGULAR ? 'yes'
      : realLifeStages.includes(IRREGULAR) || periAnswer === PERI_IRREGULAR ? (realLifeStages.includes(PERI) ? 'irregular_perimenopause' : 'irregular')
        : realLifeStages.includes(NO_PERIODS) ? 'no'
          : '';
  const menstrualCycle = periodPattern || {
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
  if ((intake.supportSelections || []).includes('Cycle-related bloating')) symptomTokens.push('bloating');
  if ((intake.supportSelections || []).includes('Nausea')) symptomTokens.push('nausea');
  if ((intake.supportSelections || []).includes('Fatigue or low energy')) symptomTokens.push('fatigue');
  if ((intake.supportSelections || []).includes('Brain fog')) symptomTokens.push('brain fog');
  if ((intake.supportSelections || []).includes('Breast tenderness')) symptomTokens.push('breast tenderness');

  const usedNames = (intake.productHistory || []).map((p) => p.name).filter(Boolean);
  const automaticallyAvoid = (intake.productHistory || [])
    .filter((p) => WORSE_ANSWERS.has(p.worked) || SERIOUS_REACTIONS.has(p.reaction))
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
    age: normalizeAge(intake.age),
    zipcode: intake.zipcode.trim(),
    location: '',
    lifeStage: primaryLifeStage,
    lifeStageSelections,
    lifeStageOther: [...new Set([...customLifeStages, intake.lifeStageOther.trim()].filter(Boolean))].join('; '),
    supportSelections: intake.supportSelections,
    supportOtherText: customConcerns.join('; '),
    primaryConcerns,
    customConcerns,
    concernFollowups: {},
    menstrualCycle,
    flowLevel,
    painLevel,
    symptoms: symptomTokens,
    periodFlow: isPeriodRelevant(intake) ? intake.periodFlow : '',
    periodPain: isPainRelevant(intake) ? intake.periodPain : '',
    utiFrequency: isUtiRelevant(intake) ? intake.utiFrequency : '',
    ttcDuration: isTtcRelevant(intake) ? (intake.ttcDuration || '') : '',
    postpartumTiming: isPostpartumRelevant(intake) ? intake.postpartumTiming : '',
    pregnancyTrimester: isPregnancyRelevant(intake) ? intake.pregnancyTrimester : '',
    breastfeedingStatus: isPostpartumRelevant(intake) ? (intake.breastfeedingStatus || '') : '',
    perimenopauseLastPeriod: isPerimenopauseRelevant(intake) ? (intake.perimenopauseLastPeriod || '') : '',
    diagnosisSelections: intake.diagnosisSelections,
    conditions,
    conditionOtherText: [...new Set([...customConditions, intake.conditionOtherText.trim()].filter(Boolean))].join('; '),
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
    // Only what she said: "Yes" when she is actively trying, "Not right now"
    // for "Not trying yet", otherwise unknown (never an assumed "No").
    tryingToConceive: ttcRequired(intake) || (isTtcRelevant(intake) && intake.ttcDuration && !['Not trying yet', 'Prefer not to say'].includes(intake.ttcDuration)) ? 'Yes'
      : isTtcRelevant(intake) && intake.ttcDuration === 'Not trying yet' ? 'Not right now' : '',
    productHistory: intake.productHistory,
    currentProducts: usedNames,
    avoidRepeat: intake.avoidRepeat,
    dislikedProducts,
    dislikedReason,
    // Asked in "Should be" (Black-owned, Brown-owned); other saved values are kept.
    brandSupportPreferences: [...new Set([
      ...(intake.brandSupportPreferences || []).filter((x) => !BRAND_SUPPORT_OPTIONS.includes(x)),
      ...(intake.avoidIngredients || []).filter((x) => BRAND_SUPPORT_OPTIONS.includes(x)),
    ])],
    safetyConcern: intake.safetyConcern,
    preferredFormats: intake.preferredFormats,
    formatOtherText: [...new Set([...customFormats, intake.formatOtherText.trim()].filter(Boolean))].join('; '),
    recommendedProductsPerArea: intake.recommendedProductsPerArea,
    preferredProductTypes,
    priceRange: intake.priceRange,
    largePurchaseFrequency: intake.largePurchaseFrequency || '',
    brandOpenness: intake.brandOpenness,
    trustedBrands: intake.trustedBrands,
    avoidIngredients: intake.avoidIngredients,
    avoidIngredientsOtherText: [...new Set([...customPreferences, intake.avoidIngredientsOtherText.trim()].filter(Boolean))].join('; '),
    productPreferences,
    fsaHsa,
    trustRanking: intake.trustRankingTouched ? intake.trustRanking : [],
    anythingElse: intake.anythingElse.trim(),
    goals: [],
    // Steps she chose to skip, and every question's answer state
    // (answered / explicit_no / not_sure / prefer_not / skipped / not_asked).
    // Skipped is neutral: it never lowers a match.
    skippedSteps: [...new Set(intake.skippedSteps || [])],
    recommendationCountTouched: intake.recommendationCountTouched === true,
    answerStates: getAnswerStates(intake),
    minimumComplete: minimumComplete(intake),
    personalizationCompleted: true,
    personalizationCompletedAt: new Date().toISOString(),
    intakeVersion: 'spec-2026-10',
  };
}

/** A plausible US ZIP: exactly five digits, and not 00000. Shared by app and website quiz. */
export function isValidUsZip(value) {
  const zip = String(value ?? '').trim();
  return /^\d{5}$/.test(zip) && zip !== '00000';
}

// ─── Answer checks ─────────────────────────────────────────────────────────
const filled = (v) => (Array.isArray(v) ? v.filter((x) => String(x ?? '').trim() !== '').length > 0 : String(v ?? '').trim() !== '');

/** Age is answered when it is a whole number we can use (18+ continues; under 18 is gated separately). */
export function isAgeAnswered(intake) {
  const raw = String(intake.age ?? '').trim();
  if (!/^\d{1,3}$/.test(raw)) return false;
  const n = Number(raw);
  return n >= 1 && n <= 120;
}

/**
 * Has this step been answered (including its inline follow-ups)? For the
 * required steps this is exactly "may continue"; "None that I know of",
 * "Prefer not to say", "Not sure" and "Nothing right now" all count.
 */
export function isStepAnswered(stepId, intake) {
  switch (stepId) {
    case 'age': return isAgeAnswered(intake) && !isMinorAge(intake.age);
    case 'lifeStage': {
      const stages = getLifeStages(intake);
      if (!stages.length) return false;
      if (stages.includes('I am postpartum') && !filled(intake.breastfeedingStatus)) return false;
      if (stages.includes('I am in perimenopause') && !filled(intake.perimenopauseLastPeriod)) return false;
      return true;
    }
    case 'aboutYou': return isStepAnswered('age', intake) && isStepAnswered('lifeStage', intake);
    case 'zip': return isValidUsZip(intake.zipcode);
    case 'support': return filled(intake.supportSelections) || filled(intake.supportOtherText);
    case 'periodFlow': return filled(intake.periodFlow);
    case 'periodPain': return filled(intake.periodPain);
    case 'ttcDuration': return filled(intake.ttcDuration);
    case 'utiFrequency': return filled(intake.utiFrequency);
    case 'postpartumTiming': return filled(intake.postpartumTiming) && (!asksBreastfeedingOnTiming(intake) || filled(intake.breastfeedingStatus));
    case 'pregnancyTrimester': return filled(intake.pregnancyTrimester);
    case 'conditions': return filled(intake.diagnosisSelections) || filled(intake.conditionOtherText);
    case 'allergies': return filled(intake.allergyStatus) && (intake.allergyStatus !== 'Yes' || filled(intake.allergyItems));
    case 'medications': return filled(intake.takesCurrent) && (intake.takesCurrent !== 'Yes' || filled(intake.currentMedicationItems));
    case 'safety': return filled(intake.safetyConcern);
    case 'products': return filled(intake.productHistory);
    case 'avoidRepeat': return filled(intake.avoidRepeat);
    case 'formats': return filled(intake.preferredFormats);
    case 'recommendationCount': return intake.recommendationCountTouched === true || Number(intake.recommendedProductsPerArea) !== 3;
    case 'priceRange': return filled(intake.priceRange) || filled(intake.largePurchaseFrequency);
    case 'brandOpenness': return filled(intake.brandOpenness);
    case 'trustedBrands': return filled(intake.trustedBrands);
    case 'avoidIngredients': return filled(intake.avoidIngredients);
    case 'fsaHsa': return filled(intake.fsaHsaAnswer);
    case 'trust': return intake.trustRankingTouched === true;
    case 'anythingElse': return filled(intake.anythingElse);
    default: return true;
  }
}

/** May she continue past this step? Optional steps never block; required ones need an answer. */
export function requiredReady(stepId, intake) {
  if (stepId === 'aboutYou') return isStepAnswered('aboutYou', intake);
  const step = getIntakeSteps(intake).find((s) => s.id === stepId);
  if (!step || !step.required) return true;
  return isStepAnswered(stepId, intake);
}

/** Every required question (including the conditional ones that apply) is answered: enough for a first, safe match. */
export function minimumComplete(intake) {
  return isAgeAnswered(intake) && !isMinorAge(intake.age)
    && getIntakeSteps(intake).filter((s) => s.required).every((s) => isStepAnswered(s.id, intake));
}

const singleAnswerState = (value, { no = [], notSure = [], preferNot = [] } = {}) => {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (no.includes(v)) return 'explicit_no';
  if (preferNot.includes(v) || /prefer not/i.test(v)) return 'prefer_not';
  if (notSure.includes(v) || /not sure/i.test(v)) return 'not_sure';
  return 'answered';
};

/**
 * Per question: answered | explicit_no | not_sure | prefer_not | skipped | not_asked.
 * "skipped" covers both a tapped Skip and optional questions she never
 * opened (she went straight to her results). Neutral for matching.
 */
export function getAnswerStates(intake) {
  const shown = new Set(getIntakeSteps(intake).map((s) => s.id));
  const out = {};
  const put = (id, state) => { out[id] = shown.has(id) ? (state || 'skipped') : 'not_asked'; };
  const stages = getLifeStages(intake);
  put('age', isAgeAnswered(intake) ? 'answered' : null);
  put('lifeStage', !stages.length ? null : stages.includes(LIFE_STAGE_PREFER_NOT) ? 'prefer_not' : stages.includes(LIFE_STAGE_NOT_SURE) ? 'not_sure' : 'answered');
  out.breastfeedingStatus = postpartumRequired(intake) ? (singleAnswerState(intake.breastfeedingStatus, { no: ['No'] }) || 'skipped') : 'not_asked';
  out.perimenopauseLastPeriod = isPerimenopauseRelevant(intake) ? (singleAnswerState(intake.perimenopauseLastPeriod) || 'skipped') : 'not_asked';
  put('zip', isValidUsZip(intake.zipcode) ? 'answered' : null);
  const support = intake.supportSelections || [];
  put('support', support.length === 1 && support[0] === 'Nothing right now' ? 'explicit_no' : isStepAnswered('support', intake) ? 'answered' : null);
  put('periodFlow', singleAnswerState(intake.periodFlow));
  put('periodPain', singleAnswerState(intake.periodPain, { no: ['None'] }));
  put('ttcDuration', singleAnswerState(intake.ttcDuration, { no: ['Not trying yet'] }));
  put('utiFrequency', singleAnswerState(intake.utiFrequency));
  put('postpartumTiming', singleAnswerState(intake.postpartumTiming));
  put('pregnancyTrimester', singleAnswerState(intake.pregnancyTrimester));
  const dx = intake.diagnosisSelections || [];
  put('conditions', dx.includes('Prefer not to say') ? 'prefer_not' : dx.includes('None that I know of') ? 'explicit_no' : isStepAnswered('conditions', intake) ? 'answered' : null);
  put('allergies', intake.allergyStatus === 'Yes' ? (filled(intake.allergyItems) ? 'answered' : null) : singleAnswerState(intake.allergyStatus, { no: ['No'] }));
  put('medications', intake.takesCurrent === 'Yes' ? (filled(intake.currentMedicationItems) ? 'answered' : null) : singleAnswerState(intake.takesCurrent, { no: ['No'] }));
  put('safety', singleAnswerState(intake.safetyConcern, { no: ['No'] }));
  put('products', filled(intake.productHistory) ? 'answered' : null);
  put('avoidRepeat', filled(intake.avoidRepeat) ? 'answered' : null);
  const formats = intake.preferredFormats || [];
  put('formats', formats.length === 1 && formats[0] === 'No preference' ? 'explicit_no' : formats.length ? 'answered' : null);
  // 3 is the default, so it only counts as answered once she picks a number.
  put('recommendationCount', intake.recommendationCountTouched || Number(intake.recommendedProductsPerArea) !== 3 ? 'answered' : null);
  const prices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
  put('priceRange', prices.includes('Price is not a major factor for me') ? 'explicit_no' : prices.length ? 'answered' : null);
  out.largePurchaseFrequency = singleAnswerState(intake.largePurchaseFrequency) || 'skipped';
  put('brandOpenness', intake.brandOpenness === 'No preference' ? 'explicit_no' : singleAnswerState(intake.brandOpenness));
  put('trustedBrands', filled(intake.trustedBrands) ? 'answered' : null);
  const avoid = intake.avoidIngredients || [];
  put('avoidIngredients', avoid.length === 1 && avoid[0] === 'No preference' ? 'explicit_no' : avoid.length ? 'answered' : null);
  put('fsaHsa', singleAnswerState(intake.fsaHsaAnswer, { no: ['No'] }));
  put('trust', intake.trustRankingTouched ? 'answered' : null);
  put('anythingElse', filled(intake.anythingElse) ? 'answered' : null);
  return out;
}

/** Remember a tapped Skip (only when the step is still unanswered). */
export function markSkipped(intake, stepId) {
  if (isStepAnswered(stepId, intake)) return intake;
  const list = intake.skippedSteps || [];
  return list.includes(stepId) ? intake : { ...intake, skippedSteps: [...list, stepId] };
}

export function normalizeSuggestion(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
export function editDistance(a, b) {
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
export function rankedSuggestions(query, options = [], limit = 6) {
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

export const MINOR_AGE_LIMIT = 18;
export const WARNING_BORDER = '#B4402A';
export const WARNING_BG = '#FAEDE8';
export const WARNING_BORDER_SOFT = '#E8C6B8';

export function isMinorAge(value) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n < MINOR_AGE_LIMIT;
}

export const FREE_TEXT_PROMPTS = ['A goal', "What hasn't worked", 'Something I missed'];

export const INTAKE_DRAFT_KEY = 'ayna_intake_draft_v1';
export function readIntakeDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(INTAKE_DRAFT_KEY) || 'null');
    return draft?.version === 1 && draft.intake && typeof draft.intake === 'object' && typeof draft.stepId === 'string' ? draft : null;
  } catch { return null; }
}

export const CHECKPOINT_STEP = 'checkpoint';

/**
 * Every question, in order: the required minimum first (with the
 * conditional follow-ups that apply), then the optional refinements.
 * Each step: { id, section, phase: 'required' | 'optional', required, optional, ... }.
 * Both quizzes read this list, so they cannot drift apart.
 */
export function getIntakeSteps(intake) {
  const req = (step) => ({ ...step, phase: 'required', required: true, optional: false });
  const opt = (step) => ({ ...step, phase: 'optional', required: false, optional: true });
  const flowStep = { id: 'periodFlow', section: 'support', title: 'Your period flow', type: 'flow', info: 'How much you bleed on a typical heavy day. We use it to match pad, tampon, cup and underwear absorbency.' };
  const ttcStep = { id: 'ttcDuration', section: 'support', title: 'How long have you been trying?', type: 'ttcDuration', info: 'How long you have been trying to get pregnant. It changes whether we lead with tracking and prenatal basics, or with fertility care options.' };
  const trimesterStep = { id: 'pregnancyTrimester', section: 'support', title: 'How far along are you?', type: 'pregnancyTrimester', info: 'Which part of pregnancy you are in. We only show products generally considered safe for that stage.' };
  return [
    // Required minimum
    req({ id: 'age', section: 'core', title: 'Your age', type: 'age', info: 'We use your age to skip products that are not meant for you, like menopause supplements in your 20s. Type it, tap plus or minus, or slide the ruler.' }),
    req({ id: 'lifeStage', section: 'core', title: 'Your life stage', subtitle: 'Pick all that fit', type: 'lifeStage', info: 'Pick every stage that fits right now. You can be in perimenopause and still have regular periods. It changes what we show, for example pregnancy-safe picks only, or midlife support. Not sure, or rather not say? Those count too.' }),
    req({ id: 'support', section: 'support', title: 'What needs support?', type: 'support', info: 'Pick everything you want help with. Each one becomes its own shelf of products in your ecosystem. Use the tabs or search to find more. "Nothing right now" counts too.' }),
    ...(flowRequired(intake) ? [req(flowStep)] : []),
    ...(painRequired(intake) ? [req({ id: 'periodPain', section: 'support', title: 'Your period pain', type: 'pain', info: 'How much cramps or pain usually affect your day. Higher pain moves heat, TENS and pain relief options up your list.' })] : []),
    ...(ttcRequired(intake) ? [req(ttcStep)] : []),
    ...(utiRequired(intake) ? [req({ id: 'utiFrequency', section: 'support', title: 'How often?', type: 'utiFrequency', info: 'How often UTI-type symptoms come back. Symptoms right now point you to testing and care first; repeat symptoms bring prevention forward.' })] : []),
    ...(postpartumRequired(intake) ? [req({ id: 'postpartumTiming', section: 'support', title: 'How long ago did you give birth?', type: 'postpartumTiming', info: 'How long since you gave birth. Recovery, nursing and hair needs change a lot over the first year.' })] : []),
    ...(trimesterRequired(intake) ? [req(trimesterStep)] : []),
    req({ id: 'conditions', section: 'safety', title: 'Diagnosed with?', subtitle: 'Clinician diagnosed only', type: 'conditions', info: 'Only conditions a clinician has diagnosed. Some products are not a good fit with certain conditions, so we filter those out. "None that I know of" and "Prefer not to say" both count.' }),
    req({ id: 'allergies', section: 'safety', title: 'Allergies or sensitivities?', type: 'allergies', info: 'Anything you react to. Products with these ingredients or materials will not show up in your picks.' }),
    req({ id: 'medications', section: 'safety', title: 'Taking anything?', subtitle: 'Medicines + supplements', type: 'medications', info: 'Some supplements interact with medicines, for example St. John’s wort with birth control. We use this to flag those combinations.' }),
    req({ id: 'safety', section: 'safety', title: 'Anything urgent?', subtitle: 'New or rapidly worsening symptoms', type: 'safety', info: 'ayna does not diagnose. If you have new or quickly worsening symptoms, we point you to care before products.' }),
    // Optional refinements ("Make my matches more personal")
    opt({ id: 'zip', section: 'core', title: 'ZIP code', type: 'zip', info: 'Only used to find clinics, telehealth and stores that serve your area. It never changes your match. We never sell it or show it to anyone.' }),
    ...(flowOptional(intake) ? [opt(flowStep)] : []),
    ...(ttcOptional(intake) ? [opt(ttcStep)] : []),
    ...(trimesterOptional(intake) ? [opt(trimesterStep)] : []),
    opt({ id: 'products', section: 'history', title: 'What have you tried?', type: 'products', info: 'Products you have used before. We use what worked and what did not to avoid repeats and find better fits.' }),
    opt({ id: 'avoidRepeat', section: 'history', title: 'What should we avoid?', type: 'avoidRepeat', info: 'Anything you add here will never show up in your picks.' }),
    opt({ id: 'formats', section: 'preferences', title: 'Preferred formats', type: 'formats', info: 'The kinds of products you like using. We rank these formats higher in your picks. Skip it and every format counts the same.' }),
    opt({ id: 'recommendationCount', section: 'preferences', title: 'Picks per need', subtitle: 'For each area you want support with', info: 'How many products we show for each thing you picked, 3 if you skip. We never lower the bar to fill a slot.', type: 'recommendationCount' }),
    opt({ id: 'priceRange', section: 'preferences', title: 'Budget per item', info: 'What you usually spend on one item, not your total. We use it to rank picks within your range first. Skip it and we assume nothing.', type: 'price' }),
    opt({ id: 'brandOpenness', section: 'preferences', title: 'New brands?', type: 'brand', info: 'How open you are to brands you have not tried. It shifts your picks between familiar names and newer startups.' }),
    ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [opt({ id: 'trustedBrands', section: 'preferences', title: 'Trusted brands', info: 'Brands you already like, in our shop or not. We show them first when they fit what you need.', type: 'trustedBrands' })] : []),
    opt({ id: 'avoidIngredients', section: 'preferences', title: 'Avoid or must-have?', info: 'Preferences, not allergies. Leave out removes products with those ingredients. Should be favors products that match.', type: 'avoidIngredients' }),
    opt({ id: 'fsaHsa', section: 'preferences', title: 'FSA or HSA?', info: 'If you have a pre-tax health account, we can point out products that are usually eligible.', type: 'fsa' }),
    opt({ id: 'trust', section: 'trust', title: 'What matters most?', subtitle: 'When choosing a product', info: 'Drag to rank what you trust most. Skip it and we use ayna’s default: evidence first.', type: 'trust' }),
    opt({ id: 'anythingElse', section: 'trust', title: 'Anything else?', type: 'textarea', info: 'Anything else you want us to keep in mind, like a goal, a budget limit or a product you love.' }),
  ];
}

/** { required, optional } step lists for the two parts of the quiz. */
export function splitIntakeSteps(intake) {
  const all = getIntakeSteps(intake);
  return { required: all.filter((s) => s.required), optional: all.filter((s) => !s.required) };
}

/**
 * Where to land when reopening a saved profile: the first required step
 * still missing an answer, else the checkpoint (results or refinements).
 */
export function firstUnansweredStepId(intake) {
  const missing = getIntakeSteps(intake).find((s) => s.required && !isStepAnswered(s.id, intake));
  return missing ? missing.id : CHECKPOINT_STEP;
}

/** Optional questions: how many there are and how many are still open. */
export function optionalProgress(intake) {
  const optional = splitIntakeSteps(intake).optional;
  const answered = optional.filter((s) => isStepAnswered(s.id, intake)).length;
  return { total: optional.length, answered, remaining: optional.length - answered };
}

/**
 * Where "Make my matches more personal" opens: the first optional question
 * she has not answered or skipped (where she left off), else the first one
 * still unanswered, else the first optional question. A required question
 * still missing an answer comes first.
 */
export function firstOptionalResumeStepId(intake) {
  const missingRequired = firstUnansweredStepId(intake);
  if (missingRequired !== CHECKPOINT_STEP) return missingRequired;
  const optional = splitIntakeSteps(intake).optional;
  const skipped = intake.skippedSteps || [];
  const open = optional.filter((s) => !isStepAnswered(s.id, intake));
  return (open.find((s) => !skipped.includes(s.id)) || open[0] || optional[0])?.id || CHECKPOINT_STEP;
}
