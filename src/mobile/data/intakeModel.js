// The intake questions and answer logic, shared by the app's quiz
// (src/mobile/screens/IntakeScreen.jsx) and the website's quiz
// (src/components/WebIntake.jsx), so both always ask the same questions and
// save the same answers. Change questions here, not in either screen.
import { ALL_PRODUCTS } from '../../data/products.js';
import { normalizeAge, normalizeLifeStages } from '../../utils/intakeSelections.js';

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

export const PERIOD_FLOW = ['Very light', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'It varies', 'I do not currently get periods', 'Not sure'];
export const PERIOD_PAIN = ['None', 'Mild', 'Moderate', 'Severe', 'Very severe', 'It varies', 'Not sure'];
export const UTI_FREQUENCY = ['This is the first time', 'Rarely', 'A few times a year', 'About monthly', 'More than once a month', 'I am experiencing them right now', 'Not sure'];
export const POSTPARTUM_TIMING = ['Less than 6 weeks ago', '6 weeks–3 months ago', '3–6 months ago', '6–12 months ago', 'More than 12 months ago'];
export const PREGNANCY_TRIMESTER = ['First trimester', 'Second trimester', 'Third trimester', 'Not sure', 'Prefer not to say'];
export const PERIMENOPAUSE_LAST_PERIOD = ['Within the past 3 months', '3–6 months ago', '6–12 months ago', 'More than 12 months ago', "I'm not sure", 'Prefer not to say'];
export const TTC_DURATION = ['Not trying yet', 'Less than 6 months', '6–12 months', 'More than 12 months', 'Prefer not to say'];
export const BREASTFEEDING_STATUS = ['Yes', 'No', 'Prefer not to say'];
// Follow-up question copy, shared so the app and the website ask the same thing.
export const FOLLOWUP_QUESTIONS = {
  breastfeedingStatus: 'Are you breastfeeding or pumping?',
  perimenopauseLastPeriod: 'When was your last period?',
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
export const FSA_HSA = ['FSA', 'HSA', 'Both', 'No'];

export const AVOID_PAIRS = { Fragrance: 'Fragrance-free', Dyes: 'Dye-free', Parabens: 'Paraben-free', Sulfates: 'Sulfate-free', Latex: 'Latex-free' };
// Same values as AVOID_INGREDIENTS, grouped so "Fragrance" (leave out) and "Vegan" (should be) don't read as one list.
export const AVOID_GROUPS = {
  avoid: ['Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials', 'Animal-derived', 'Added sugar', 'Artificial sweeteners'],
  want: ['Unscented', 'Organic', 'Vegan', 'Cruelty-free', 'Minimal ingredients', 'Sensitive skin', 'Reusable', 'Eco-friendly', 'Pregnancy considerations', 'Black-owned', 'Brown-owned'],
};
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
  'anythingElse',
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
export function isPeriodRelevant(intake) {
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
export function isUtiRelevant(intake) {
  return arrayHasAny(intake.supportSelections, UTI_TRIGGER);
}
export function isTtcRelevant(intake) {
  return hasLifeStage(intake, 'I am trying to conceive') || arrayHasAny(intake.supportSelections, TTC_TRIGGER);
}
export function isPregnancyRelevant(intake) {
  return hasLifeStage(intake, 'I am pregnant') || arrayHasAny(intake.supportSelections, PREGNANCY_TRIGGER);
}
/** "Not trying yet" only makes sense when trying to conceive was not picked as a life stage. */
export function ttcDurationOptions(intake) {
  return hasLifeStage(intake, 'I am trying to conceive') ? TTC_DURATION.filter((x) => x !== 'Not trying yet') : TTC_DURATION;
}
/** Breastfeeding is asked with the life stage; anyone postpartum only through a need gets it on the timing step. */
export function asksBreastfeedingOnTiming(intake) {
  return isPostpartumRelevant(intake) && !hasLifeStage(intake, 'I am postpartum');
}
export function isPerimenopauseRelevant(intake) {
  return hasLifeStage(intake, 'I am in perimenopause');
}
export function isPostpartumRelevant(intake) {
  return hasLifeStage(intake, 'I am postpartum') || arrayHasAny(intake.supportSelections, POSTPARTUM_TRIGGER);
}

export function buildSnapshot(intake) {
  const lifeStageSelections = getLifeStages(intake);
  const primaryLifeStage = intake.lifeStage || lifeStageSelections[0] || '';
  const primaryConcerns = [...new Set((intake.supportSelections || []).flatMap((item) => LEGACY_CONCERN_BY_ITEM[item] || []))];
  const knownSupportOptions = new Set(SUPPORT_GROUPS.flatMap((group) => group.items));
  const customConcerns = [...new Set([
    ...(intake.supportSelections || []).filter((item) => !knownSupportOptions.has(item) && item !== 'Something else'),
    intake.supportOtherText.trim(),
  ].filter(Boolean))];
  const customLifeStages = lifeStageSelections.filter((item) => !LIFE_STAGES.includes(item) && item !== 'Other');
  const customConditions = (intake.diagnosisSelections || []).filter((item) => !CONDITIONS.includes(item) && !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(item));
  const customFormats = (intake.preferredFormats || []).filter((item) => !PRODUCT_FORMATS.includes(item) && item !== 'Other');
  const customPreferences = (intake.avoidIngredients || []).filter((item) => !AVOID_INGREDIENTS.includes(item) && item !== 'Other');

  const conditions = (intake.diagnosisSelections || [])
    .filter((v) => !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(v))
    .map((v) => CONDITION_TO_LEGACY[v] || v.toLowerCase());
  if (intake.diagnosisSelections.includes('Other / not listed') && intake.conditionOtherText.trim()) conditions.push(intake.conditionOtherText.trim().toLowerCase());

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
    periodPain: isPeriodRelevant(intake) ? intake.periodPain : '',
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
    tryingToConceive: !isTtcRelevant(intake) ? 'No' : intake.ttcDuration === 'Not trying yet' ? 'Not right now' : 'Yes',
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
    personalizationCompleted: true,
    personalizationCompletedAt: new Date().toISOString(),
    intakeVersion: 'beta-redesign-2026-09',
  };
}

export function requiredReady(stepId, intake) {
  if (stepId === 'conditions') return intake.diagnosisSelections.length > 0;
  if (stepId === 'allergies') return !!intake.allergyStatus && (intake.allergyStatus !== 'Yes' || intake.allergyItems.length > 0);
  if (stepId === 'medications') return !!intake.takesCurrent && (intake.takesCurrent !== 'Yes' || intake.currentMedicationItems.length > 0);
  if (stepId === 'safety') return !!intake.safetyConcern;
  return true;
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

/** Every question, in order. Some only appear when earlier answers make them relevant. */
export function getIntakeSteps(intake) {
  return [
      { id: 'age', section: 'core', title: 'Your age', type: 'age', optional: true, info: 'We use your age to skip products that are not meant for you, like menopause supplements in your 20s. Type it, tap plus or minus, or slide the ruler.' },
      { id: 'lifeStage', section: 'core', title: 'Your life stage', type: 'lifeStage', optional: true, info: 'Pick every stage that fits right now. It changes what we show, for example pregnancy-safe picks only, or midlife support.' },
      { id: 'zip', section: 'core', title: 'ZIP code', type: 'zip', optional: true, info: 'Only used to find clinics, telehealth and stores that serve your area. We never sell it or show it to anyone.' },
      { id: 'support', section: 'support', title: 'What needs support?', type: 'support', optional: true, info: 'Pick everything you want help with. Each one becomes its own shelf of products in your Ecosystem. Use the tabs or search to find more.' },
      ...(isPeriodRelevant(intake) ? [
        { id: 'periodFlow', section: 'support', title: 'Your period flow', type: 'flow', optional: true, info: 'How much you bleed on a typical heavy day. We use it to match pad, tampon, cup and underwear absorbency.' },
        { id: 'periodPain', section: 'support', title: 'Your period pain', type: 'pain', optional: true, info: 'How much cramps or pain usually affect your day. Higher pain moves heat, TENS and pain relief options up your list.' },
      ] : []),
      ...(isTtcRelevant(intake) ? [{ id: 'ttcDuration', section: 'support', title: 'How long have you been trying?', type: 'ttcDuration', optional: true, info: 'How long you have been trying to get pregnant. It changes whether we lead with tracking and prenatal basics, or with fertility care options.' }] : []),
      ...(isUtiRelevant(intake) ? [{ id: 'utiFrequency', section: 'support', title: 'How often?', type: 'utiFrequency', optional: true, info: 'How often UTI-type symptoms come back. It decides whether we show prevention products, testing strips or care options first.' }] : []),
      ...(isPostpartumRelevant(intake) ? [{ id: 'postpartumTiming', section: 'support', title: 'How long ago?', type: 'postpartumTiming', optional: true, info: 'How long since you gave birth. Recovery, nursing and hair needs change a lot over the first year.' }] : []),
      ...(isPregnancyRelevant(intake) ? [{ id: 'pregnancyTrimester', section: 'support', title: 'How far along are you?', type: 'pregnancyTrimester', optional: true, info: 'Which part of pregnancy you are in. We only show products generally considered safe for that stage.' }] : []),
      { id: 'conditions', section: 'safety', title: 'Diagnosed with?', subtitle: 'Clinician diagnosed only', type: 'conditions', optional: false, info: 'Only conditions a clinician has diagnosed. Some products are not a good fit with certain conditions, so we filter those out.' },
      { id: 'allergies', section: 'safety', title: 'Allergies or sensitivities?', type: 'allergies', optional: false, info: 'Anything you react to. Products with these ingredients or materials will not show up in your picks.' },
      { id: 'medications', section: 'safety', title: 'Taking anything?', subtitle: 'Medicines + supplements', type: 'medications', optional: false, info: 'Some supplements interact with medicines, for example St. John’s wort with birth control. We use this to flag those combinations.' },
      { id: 'products', section: 'history', title: 'What have you tried?', type: 'products', optional: true, info: 'Products you have used before. We use what worked and what did not to avoid repeats and find better fits.' },
      { id: 'avoidRepeat', section: 'history', title: 'What should we avoid?', type: 'avoidRepeat', optional: true, info: 'Anything you add here will never show up in your picks.' },
      { id: 'safety', section: 'safety', title: 'Anything urgent?', subtitle: 'New or rapidly worsening symptoms', type: 'safety', optional: false, info: 'ayna does not diagnose. If you have new or quickly worsening symptoms, we point you to care before products.' },
      { id: 'formats', section: 'preferences', title: 'Preferred formats', type: 'formats', optional: true, info: 'The kinds of products you like using. We rank these formats higher in your picks.' },
      { id: 'recommendationCount', section: 'preferences', title: 'Picks per need', subtitle: 'For each area you want support with', info: 'How many products we show for each thing you picked. For example, 3 means 3 for cramps and 3 for sleep.', type: 'recommendationCount', optional: true },
      { id: 'priceRange', section: 'preferences', title: 'Budget per item', info: 'What you usually spend on one item, not your total. We use it to rank picks within your range first.', type: 'price', optional: true },
      { id: 'brandOpenness', section: 'preferences', title: 'New brands?', type: 'brand', optional: true, info: 'How open you are to brands you have not tried. It shifts your picks between familiar names and newer startups.' },
      ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [{ id: 'trustedBrands', section: 'preferences', title: 'Trusted brands', info: 'Brands you already like. We show them first when they fit what you need.', type: 'trustedBrands', optional: true }] : []),
      { id: 'avoidIngredients', section: 'preferences', title: 'Avoid or must-have?', info: 'Leave out removes products with those ingredients. Should be favors products that match. Both are optional.', type: 'avoidIngredients', optional: true },
      { id: 'fsaHsa', section: 'preferences', title: 'FSA or HSA?', info: 'If you have a pre-tax health account, we can point out products that are usually eligible.', type: 'fsa', optional: true },
      { id: 'trust', section: 'trust', title: 'What matters most?', subtitle: 'When choosing a product', info: 'Drag to rank what you trust most. We weigh your top pick most when matching.', type: 'trust', optional: false },
      { id: 'anythingElse', section: 'trust', title: 'Anything else?', type: 'textarea', optional: true, info: 'Anything else you want us to keep in mind, like a goal, a budget limit or a product you love. Optional.' },
  ];
}
