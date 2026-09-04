import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore';

const DRAFT_KEY = 'ayna_intake_redesign_draft_v1';

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
  'I get periods regularly',
  'My periods are irregular',
  'I do not currently get periods',
  'I use hormonal birth control',
  'I am trying to conceive',
  'I am pregnant',
  'I am postpartum',
  'I am in perimenopause',
  'I am in menopause',
  'I am post-menopause',
  'Other',
];

const PERIOD_FLOW = ['Very light', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'It varies', 'I do not currently get periods', 'Not sure'];
const PERIOD_PAIN = ['None', 'Mild', 'Moderate', 'Severe', 'Very severe', 'It varies', 'Not sure'];
const UTI_FREQUENCY = ['This is the first time', 'Rarely', 'A few times a year', 'About monthly', 'More than once a month', 'I am experiencing them right now', 'Not sure'];
const TTC_DURATION = ['I have not started trying yet', 'Less than 6 months', '6–12 months', 'More than 12 months', 'Prefer not to say'];
const POSTPARTUM_TIMING = ['Less than 6 weeks ago', '6 weeks–3 months ago', '3–6 months ago', '6–12 months ago', 'More than 12 months ago'];
const PREGNANCY_TRIMESTER = ['First trimester', 'Second trimester', 'Third trimester', 'Not sure', 'Prefer not to say'];

const CONDITIONS = [
  'PCOS', 'Endometriosis', 'Fibroids', 'Adenomyosis', 'PMS', 'PMDD', 'Infertility', 'Thyroid condition',
  'Diabetes', 'Insulin resistance', 'High blood pressure', 'Migraine with aura', 'Anemia or iron deficiency',
  'IBS or another digestive condition', 'Autoimmune condition', 'Anxiety', 'Depression', 'Other / not listed',
  'None that I know of', 'Prefer not to say',
];

const ALLERGIES = [
  'Latex', 'Fragrance', 'Adhesives', 'NSAIDs such as ibuprofen', 'Acetaminophen', 'Aspirin', 'Antibiotics',
  'Hormonal medications', 'Topical ingredients', 'Supplements or herbal ingredients', 'Other', 'None known', 'Not sure',
];


const MEDICATION_SUGGESTIONS = [
  'Zoloft', 'Sertraline', 'Vyvanse', 'Lisdexamfetamine', 'Adderall', 'Amphetamine/dextroamphetamine',
  'Lexapro', 'Escitalopram', 'Prozac', 'Fluoxetine', 'Wellbutrin', 'Bupropion', 'Buspirone',
  'Metformin', 'Spironolactone', 'Levothyroxine', 'Synthroid', 'Ibuprofen', 'Naproxen', 'Acetaminophen',
  'Melatonin', 'Magnesium', 'Vitamin D', 'Vitamin B12', 'Iron', 'Folic acid', 'Prenatal vitamin',
  'Omega-3', 'Probiotic', 'Multivitamin', 'Biotin', 'Inositol', 'Myo-inositol',
  'Birth control pill', 'Hormonal IUD', 'Copper IUD', 'Nexplanon', 'Depo-Provera', 'NuvaRing', 'Xulane patch',
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
const AVOID_INGREDIENTS = ['Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials', 'Animal-derived ingredients', 'Added sugar', 'Artificial sweeteners', 'Other', 'None'];
const FSA_HSA = ['FSA', 'HSA', 'Both', 'No', 'Not sure'];
const TRUST_ITEMS = ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'];

const STOP_REASONS = [
  'It did not help', 'It stopped working', 'I had side effects or a reaction', 'It was too expensive',
  'It was inconvenient', 'I did not like the format', 'I found something better',
  'A clinician recommended stopping it', 'I simply did not repurchase it', 'Other',
];

const EMPTY = {
  age: '',
  lifeStage: '',
  lifeStageOther: '',
  zipcode: '',
  supportSelections: [],
  supportOtherText: '',
  periodFlow: '',
  periodPain: '',
  utiFrequency: '',
  ttcDuration: '',
  postpartumTiming: '',
  pregnancyTrimester: '',
  diagnosisSelections: [],
  conditionOtherText: '',
  allergySelections: [],
  allergyOtherText: '',
  takesCurrent: '',
  currentMedicationItems: [],
  productHistory: [],
  avoidRepeat: [],
  safetyConcern: '',
  preferredFormats: [],
  formatOtherText: '',
  priceRange: [],
  largePurchaseFrequency: '',
  brandOpenness: '',
  trustedBrands: [],
  avoidIngredients: [],
  avoidIngredientsOtherText: '',
  fsaHsaAnswer: '',
  trustRanking: TRUST_ITEMS,
  trustRankingTouched: false,
  anythingElse: '',
};

const SECTION_ORDER = ['core', 'support', 'safety', 'history', 'preferences', 'trust'];
const SECTION_LABELS = {
  core: 'Core profile',
  support: 'What you are looking for',
  safety: 'Health & safety',
  history: 'What you have tried',
  preferences: 'Shopping preferences',
  trust: 'What matters to you',
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
  'Nausea': 'Hormone balance (supplements, lifestyle)',
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
  'Contraception': 'Telehealth and provider matching',
  'STI-related concerns': 'STI support',
  'Hot flashes': 'Perimenopause and menopause support',
  'Night sweats': 'Perimenopause and menopause support',
  'Joint aches': 'Perimenopause and menopause support',
  'Menopause-related body changes': 'Perimenopause and menopause support',
  'Mood swings': 'Mental health and cycle mood support',
  'Irritability': 'Mental health and cycle mood support',
  'Anxiety': 'Mental health and cycle mood support',
  'Low mood': 'Mental health and cycle mood support',
  'Cycle-related mood changes': 'Mental health and cycle mood support',
  'Fatigue or low energy': 'Sleep and energy',
  'Trouble sleeping': 'Sleep and energy',
  'Brain fog': 'Sleep and energy',
  'Difficulty concentrating': 'Sleep and energy',
  'Constipation': 'Gut and vaginal health (probiotics, pH balance)',
  'Diarrhea': 'Gut and vaginal health (probiotics, pH balance)',
  'Gas': 'Gut and vaginal health (probiotics, pH balance)',
  'Abdominal discomfort': 'Gut and vaginal health (probiotics, pH balance)',
  'Digestive bloating': 'Gut and vaginal health (probiotics, pH balance)',
  'Acne': 'Skin and hair (hormone-related)',
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

function isPeriodRelevant(intake) {
  return ['I get periods regularly', 'My periods are irregular'].includes(intake.lifeStage) || arrayHasAny(intake.supportSelections, PERIOD_TRIGGER);
}
function isUtiRelevant(intake) {
  return arrayHasAny(intake.supportSelections, UTI_TRIGGER);
}
function isTtcRelevant(intake) {
  return intake.lifeStage === 'I am trying to conceive' || arrayHasAny(intake.supportSelections, TTC_TRIGGER);
}
function isPregnancyRelevant(intake) {
  return intake.lifeStage === 'I am pregnant' || arrayHasAny(intake.supportSelections, PREGNANCY_TRIGGER);
}
function isPostpartumRelevant(intake) {
  return intake.lifeStage === 'I am postpartum' || arrayHasAny(intake.supportSelections, POSTPARTUM_TRIGGER);
}

function buildSnapshot(intake) {
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
  }[intake.lifeStage] || '';

  const flowLevel = {
    'Very light': 'light', Light: 'light', Moderate: 'medium', Heavy: 'heavy', 'Very heavy': 'very heavy',
  }[intake.periodFlow] || '';
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

  const allergies = (intake.allergySelections || []).filter((v) => !['None known', 'Not sure', 'Other'].includes(v));
  if (intake.allergySelections.includes('Other') && intake.allergyOtherText.trim()) allergies.push(intake.allergyOtherText.trim());

  const productPreferences = [...new Set((intake.avoidIngredients || []).map((x) => PREFERENCE_MAP[x]).filter(Boolean))];
  const preferredProductTypes = [...new Set((intake.preferredFormats || []).map((x) => FORMAT_TO_LEGACY[x]).filter(Boolean))];
  const fsaHsa = { FSA: 'fsa', HSA: 'hsa', Both: 'both', No: 'none', 'Not sure': 'unsure' }[intake.fsaHsaAnswer] || '';

  return {
    age: intake.age,
    zipcode: intake.zipcode.trim(),
    location: '',
    lifeStage: intake.lifeStage,
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
    ttcDuration: isTtcRelevant(intake) ? intake.ttcDuration : '',
    postpartumTiming: isPostpartumRelevant(intake) ? intake.postpartumTiming : '',
    pregnancyTrimester: isPregnancyRelevant(intake) ? intake.pregnancyTrimester : '',
    diagnosisSelections: intake.diagnosisSelections,
    conditions,
    conditionOtherText: intake.conditionOtherText.trim(),
    allergySelections: intake.allergySelections,
    allergyOtherText: intake.allergyOtherText.trim(),
    allergies,
    takesCurrent: intake.takesCurrent,
    currentMedicationItems: intake.takesCurrent === 'Yes' ? intake.currentMedicationItems : [],
    currentMedications: intake.takesCurrent === 'Yes' ? intake.currentMedicationItems.join(', ') : '',
    hormonalBirthControl: intake.lifeStage === 'I use hormonal birth control' ? 'Yes' : '',
    hormonalBirthControlType: '',
    tryingToConceive: isTtcRelevant(intake) ? 'Yes' : 'No',
    productHistory: intake.productHistory,
    currentProducts: usedNames,
    avoidRepeat: intake.avoidRepeat,
    dislikedProducts,
    dislikedReason,
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

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
}

function SectionIcon({ section }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': true };
  let icon;
  if (section === 'core') icon = <svg {...common}><path d="M12 21s-7.5-4.6-10-9.3C.3 8 2 4 6 4c2 0 3.5 1.2 4 2.8.5-1.6 2-2.8 4-2.8 4 0 5.7 4 4 7.7C19.5 16.4 12 21 12 21Z" /></svg>;
  else if (section === 'support') icon = <svg {...common}><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" /></svg>;
  else if (section === 'safety') icon = <svg {...common}><path d="M12 3 5 6v6c0 5 3 8 7 9 4-1 7-4 7-9V6l-7-3Z" /><path d="M9 12l2 2 4-4" /></svg>;
  else if (section === 'history') icon = <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
  else icon = <svg {...common}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  return <div className={`ayna-intake-icon ${section}`}>{icon}</div>;
}

function ChoiceCard({ label, selected, onClick }) {
  return (
    <button type="button" className={`ayna-choice-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <span>{label}</span><span className="ayna-choice-indicator" aria-hidden="true" />
    </button>
  );
}

function RowChoice({ label, selected, onClick, square = false }) {
  return (
    <button type="button" className={`ayna-row-choice${selected ? ' selected' : ''}`} onClick={onClick}>
      <span>{label}</span><span className={`ayna-row-indicator${square ? ' square' : ''}`} aria-hidden="true" />
    </button>
  );
}

function Pill({ label, selected, onClick }) {
  return <button type="button" className={`ayna-pill${selected ? ' selected' : ''}`} onClick={onClick}>{label}</button>;
}

function Segmented({ options, value, onChange }) {
  return <div className="ayna-segmented">{options.map((option) => <button type="button" key={option} className={`ayna-seg-option${value === option ? ' selected' : ''}`} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

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

function TokenInput({ values, onChange, placeholder, suggestions = [] }) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const matches = useMemo(
    () => rankedSuggestions(draft, suggestions.filter((option) => !values.some((value) => normalizeSuggestion(value) === normalizeSuggestion(option))), 6),
    [draft, suggestions, values]
  );

  const addValue = (rawValue) => {
    const next = String(rawValue || '').trim();
    if (!next || values.some((value) => normalizeSuggestion(value) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
    setOpen(false);
  };

  return (
    <div className="ayna-token-card">
      <div className="ayna-token-line">
        <input
          value={draft}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setDraft(e.target.value); setOpen(true); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValue(draft);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
        />
        <button type="button" onClick={() => addValue(draft)}>Add</button>
      </div>
      {open && draft.trim().length >= 2 && matches.length > 0 && (
        <div className="ayna-smart-suggestions" role="listbox">
          {matches.map((option) => (
            <button
              type="button"
              key={option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addValue(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {values.length > 0 && <div className="ayna-tokens">{values.map((value, index) => <span key={`${value}-${index}`}>{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((_, i) => i !== index))}>×</button></span>)}</div>}
    </div>
  );
}

function SearchableGroups({ groups, selected, onToggle, search, onSearch }) {
  const q = search.trim().toLowerCase();
  const visible = groups.map((group) => ({ ...group, items: group.items.filter((item) => !q || item.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)) })).filter((group) => group.items.length);
  return (
    <>
      <div className="ayna-search-wrap"><SearchIcon /><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search options..." /></div>
      <div className="ayna-list-panel">
        {visible.map((group) => (
          <div className="ayna-category" key={group.label}>
            <div className="ayna-category-title">{group.label}</div>
            {group.items.map((item) => <RowChoice key={item} label={item} selected={selected.includes(item)} onClick={() => onToggle(item)} square />)}
          </div>
        ))}
        {visible.length === 0 && <div className="ayna-no-matches">No matches. Try a different search.</div>}
      </div>
    </>
  );
}

function ProductHistoryBuilder({ products, onChange }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => {
    const alreadyAdded = new Set(products.map((product) => normalizeSuggestion(product.name)));
    return rankedSuggestions(query, CATALOG_PRODUCT_NAMES.filter((name) => !alreadyAdded.has(normalizeSuggestion(name))), 6);
  }, [query, products]);

  const addProduct = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || products.some((p) => normalizeSuggestion(p.name) === normalizeSuggestion(trimmed))) return;
    onChange([...products, { name: trimmed, current: '', worked: '', reaction: '', reactionText: '', stopReasons: [], stopOther: '' }]);
    setQuery('');
    setShowSuggestions(false);
  };
  const updateProduct = (index, patch) => onChange(products.map((product, i) => i === index ? { ...product, ...patch } : product));

  return (
    <div className="ayna-product-builder">
      <div className="ayna-token-card">
        <div className="ayna-token-line">
          <input
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProduct(query); } }}
            placeholder="Start typing a product name"
            autoComplete="off"
            aria-autocomplete="list"
          />
          <button type="button" onClick={() => addProduct(query)}>Add</button>
        </div>
        {showSuggestions && query.trim().length >= 2 && suggestions.length > 0 && (
          <div className="ayna-smart-suggestions" role="listbox">
            {suggestions.map((name) => (
              <button type="button" key={name} onMouseDown={(e) => e.preventDefault()} onClick={() => addProduct(name)}>{name}</button>
            ))}
          </div>
        )}
      </div>

      {products.map((product, index) => (
        <div className="ayna-product-card" key={`${product.name}-${index}`}>
          <div className="ayna-product-head"><div>{product.name}</div><button type="button" onClick={() => onChange(products.filter((_, i) => i !== index))}>Remove</button></div>
          <div className="ayna-product-q"><div className="ayna-product-label">Are you currently using it?</div><Segmented options={['Yes', 'No']} value={product.current} onChange={(current) => updateProduct(index, { current })} /></div>
          <div className="ayna-product-q"><div className="ayna-product-label">How well did it work for you?</div><div className="ayna-pills left">{['Helped a lot', 'Helped somewhat', 'No noticeable difference', 'Made things worse', 'Not sure'].map((option) => <Pill key={option} label={option} selected={product.worked === option} onClick={() => updateProduct(index, { worked: option })} />)}</div></div>
          <div className="ayna-product-q"><div className="ayna-product-label">Did you experience any side effects or reactions?</div><div className="ayna-pills left">{['No', 'Mild side effects', 'Serious or concerning reaction', 'Not sure'].map((option) => <Pill key={option} label={option} selected={product.reaction === option} onClick={() => updateProduct(index, { reaction: option })} />)}</div></div>
          {['Mild side effects', 'Serious or concerning reaction'].includes(product.reaction) && <input className="ayna-inline-input" value={product.reactionText} onChange={(e) => updateProduct(index, { reactionText: e.target.value })} placeholder="What happened? (optional)" />}
          {product.current === 'No' && <div className="ayna-product-q"><div className="ayna-product-label">Why did you stop using it? (optional)</div><div className="ayna-pills left compact">{STOP_REASONS.map((reason) => <Pill key={reason} label={reason} selected={(product.stopReasons || []).includes(reason)} onClick={() => updateProduct(index, { stopReasons: (product.stopReasons || []).includes(reason) ? product.stopReasons.filter((x) => x !== reason) : [...(product.stopReasons || []), reason] })} />)}</div>{(product.stopReasons || []).includes('Other') && <input className="ayna-inline-input" value={product.stopOther || ''} onChange={(e) => updateProduct(index, { stopOther: e.target.value })} placeholder="Tell us why you stopped (optional)" />}</div>}
        </div>
      ))}
    </div>
  );
}

function Scale({ options, value, onChange, kind = 'flow' }) {
  return (
    <div className={`ayna-white-card ayna-scale ${kind}`}>
      {options.map((option, index) => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}><span className="ayna-scale-mark" style={{ height: `${8 + Math.min(index, 4) * 4}px` }} /><span>{option}</span></button>)}
    </div>
  );
}

function Timeline({ options, value, onChange }) {
  return <div className="ayna-timeline">{options.map((option) => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}><span className="ayna-timeline-dot" /><span className="ayna-timeline-label">{option}</span></button>)}</div>;
}

function BrandSpectrum({ value, onChange }) {
  return (
    <div className="ayna-white-card ayna-spectrum">
      <div className="ayna-spectrum-line" />
      <div className="ayna-spectrum-grid">{BRAND_OPENNESS.map((option) => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div>
    </div>
  );
}

function TrustRanker({ order, onChange, onTouch }) {
  const move = (index, delta) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onTouch(); onChange(next);
  };
  const dragIndex = useRef(null);
  return (
    <div className="ayna-trust-list">
      {order.map((item, index) => (
        <div className="ayna-trust-item" key={item} draggable onDragStart={() => { dragIndex.current = index; }} onDragOver={(e) => e.preventDefault()} onDrop={() => { const from = dragIndex.current; if (from === null || from === index) return; const next = [...order]; const [moved] = next.splice(from, 1); next.splice(index, 0, moved); dragIndex.current = null; onTouch(); onChange(next); }}>
          <span className="ayna-drag" aria-hidden="true">⋮⋮</span><span className="ayna-rank">{index + 1}</span><span className="ayna-trust-label">{item}</span><span className="ayna-move"><button type="button" onClick={() => move(index, -1)} aria-label={`Move ${item} up`}>↑</button><button type="button" onClick={() => move(index, 1)} aria-label={`Move ${item} down`}>↓</button></span>
        </div>
      ))}
    </div>
  );
}

function requiredReady(stepId, intake) {
  if (stepId === 'conditions') return intake.diagnosisSelections.length > 0 && (!intake.diagnosisSelections.includes('Other / not listed') || !!intake.conditionOtherText.trim());
  if (stepId === 'allergies') return intake.allergySelections.length > 0 && (!intake.allergySelections.includes('Other') || !!intake.allergyOtherText.trim());
  if (stepId === 'medications') return !!intake.takesCurrent && (intake.takesCurrent !== 'Yes' || intake.currentMedicationItems.length > 0);
  if (stepId === 'safety') return !!intake.safetyConcern;
  if (stepId === 'lifeStage' && intake.lifeStage === 'Other') return !!intake.lifeStageOther.trim();
  if (stepId === 'support' && intake.supportSelections.includes('Something else')) return !!intake.supportOtherText.trim();
  if (stepId === 'formats' && intake.preferredFormats.includes('Other')) return !!intake.formatOtherText.trim();
  if (stepId === 'avoidIngredients' && intake.avoidIngredients.includes('Other')) return !!intake.avoidIngredientsOtherText.trim();
  if (stepId === 'products' && intake.productHistory.length) return intake.productHistory.every((p) => p.current && p.worked && p.reaction);
  return true;
}

const STYLES = `
.ayna-intake-root{min-height:calc(100dvh - 70px);background:linear-gradient(165deg,#2A1F4E 0%,#4E3866 42%,#8A4A3C 74%,#D97A2B 100%);font-family:var(--font-body,'DM Sans',system-ui,sans-serif);color:#FFF9F2;position:relative;overflow:hidden;padding:36px 18px 72px}
.ayna-intake-root *{box-sizing:border-box}.ayna-intake-root button,.ayna-intake-root input,.ayna-intake-root textarea{font:inherit}.ayna-intake-glow{position:absolute;border-radius:50%;pointer-events:none}.ayna-intake-glow.g1{top:-120px;right:-110px;width:420px;height:420px;background:radial-gradient(circle,rgba(255,199,116,.4),rgba(255,199,116,0) 70%)}.ayna-intake-glow.g2{bottom:-110px;left:-110px;width:360px;height:360px;background:radial-gradient(circle,rgba(126,84,186,.35),rgba(126,84,186,0) 70%)}.ayna-intake-glow.g3{top:340px;left:-70px;width:220px;height:220px;background:radial-gradient(circle,rgba(217,122,43,.3),rgba(217,122,43,0) 70%)}
.ayna-intake-shell{max-width:640px;margin:0 auto;position:relative;z-index:1}.ayna-intake-top{display:flex;align-items:center;gap:12px;max-width:600px;margin:0 auto}.ayna-intake-back{width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(255,249,242,.25);background:rgba(255,249,242,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;padding:0;color:#FFF9F2}.ayna-intake-back svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round}.ayna-intake-segments{display:flex;gap:6px;flex:1}.ayna-intake-segment{flex:1;height:6px;border-radius:3px;background:rgba(255,249,242,.22)}.ayna-intake-segment.on{background:#FFC774}.ayna-intake-section-label{max-width:600px;margin:0 auto;padding:9px 0 0 46px;font-size:12px;color:rgba(255,249,242,.55);letter-spacing:.02em}
.ayna-intake-question{text-align:center;padding-top:26px;max-width:600px;margin:0 auto}.ayna-intake-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 10px 24px -12px rgba(0,0,0,.35)}.ayna-intake-icon svg{width:24px;height:24px;fill:none;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}.ayna-intake-icon.core{background:#FFF3DD}.ayna-intake-icon.core svg{stroke:#C0761F}.ayna-intake-icon.support,.ayna-intake-icon.preferences,.ayna-intake-icon.trust{background:#EAEBF3}.ayna-intake-icon.support svg,.ayna-intake-icon.preferences svg,.ayna-intake-icon.trust svg{stroke:#242A52}.ayna-intake-icon.safety{background:#F1ECF4}.ayna-intake-icon.safety svg{stroke:#4E3866}.ayna-intake-icon.history{background:#FBEAD3}.ayna-intake-icon.history svg{stroke:#8A5A1E}
.ayna-intake-question h1{font-family:var(--font-serif,'Playfair Display',Georgia,serif);font-weight:500;font-size:27px;line-height:1.3;margin:0 auto 8px;max-width:540px;color:#FFF9F2}.ayna-intake-subtitle{margin:0 auto 6px;font-size:14px;color:rgba(255,249,242,.72);line-height:1.5;max-width:460px}.ayna-intake-hint{margin:5px auto 0;font-size:12px;color:#FFDCA8;font-weight:600}.ayna-intake-stage{margin-top:24px}.ayna-white-card{background:#FFF9F2;border-radius:24px;padding:24px 26px;box-shadow:0 20px 44px -22px rgba(0,0,0,.5);color:#2A1F4E}
.ayna-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ayna-choice-card{cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;min-height:78px;padding:18px 34px 18px 14px;border-radius:18px;background:#FFF9F2;border:1.5px solid transparent;box-shadow:0 10px 22px -16px rgba(0,0,0,.4);color:#2A1F4E;transition:.15s}.ayna-choice-card:hover{transform:translateY(-1px)}.ayna-choice-card.selected{border-color:#E8843C;background:#FFF3DD}.ayna-choice-card>span:first-child{font-size:14px;font-weight:500;line-height:1.35}.ayna-choice-indicator{position:absolute;top:10px;right:10px;width:19px;height:19px;border-radius:50%;border:1.5px solid rgba(42,31,78,.25)}.ayna-choice-card.selected .ayna-choice-indicator{background:#2A1F4E;border-color:#2A1F4E}.ayna-choice-card.selected .ayna-choice-indicator:after{content:'';position:absolute;inset:5px;border-radius:50%;background:#fff}
.ayna-row-choice{width:100%;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-radius:16px;background:#FFF9F2;border:1.5px solid transparent;box-shadow:0 10px 22px -16px rgba(0,0,0,.4);margin-bottom:9px;color:#2A1F4E;text-align:left}.ayna-row-choice.selected{border-color:#E8843C;background:#FFF3DD}.ayna-row-choice>span:first-child{font-size:14px;font-weight:500;line-height:1.35}.ayna-row-indicator{width:21px;height:21px;border-radius:50%;border:1.5px solid rgba(42,31,78,.25);flex:none;position:relative}.ayna-row-indicator.square{border-radius:6px}.ayna-row-choice.selected .ayna-row-indicator{background:#2A1F4E;border-color:#2A1F4E}.ayna-row-choice.selected .ayna-row-indicator:after{content:'✓';position:absolute;inset:0;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.ayna-pills{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.ayna-pills.left{justify-content:flex-start}.ayna-pill{cursor:pointer;padding:11px 18px;border-radius:999px;background:#FFF9F2;border:1.5px solid rgba(42,31,78,.1);box-shadow:0 8px 16px -12px rgba(0,0,0,.35);font-size:13.5px;font-weight:600;color:#2A1F4E}.ayna-pill.selected{background:#2A1F4E;color:#fff;border-color:#2A1F4E}.ayna-pills.compact .ayna-pill{padding:8px 11px;font-size:11.5px}
.ayna-segmented{display:flex;gap:10px;max-width:520px;margin:0 auto}.ayna-seg-option{cursor:pointer;flex:1;padding:15px 11px;text-align:center;border-radius:16px;background:#FFF9F2;border:1.5px solid rgba(42,31,78,.1);box-shadow:0 10px 22px -16px rgba(0,0,0,.4);font-size:13.5px;font-weight:600;color:#2A1F4E}.ayna-seg-option.selected{background:#2A1F4E;color:#fff;border-color:#2A1F4E}
.ayna-text-input,.ayna-textarea,.ayna-inline-input{width:100%;padding:14px 16px;border-radius:14px;border:none;font-size:14px;color:#2A1F4E;background:#FFF9F2;box-shadow:0 8px 18px -14px rgba(0,0,0,.5);outline:none}.ayna-text-input{max-width:440px}.ayna-textarea{min-height:128px;resize:vertical;line-height:1.5}.ayna-inline-input{margin-top:10px;border:1px solid rgba(42,31,78,.12);box-shadow:none}.ayna-other-box{max-width:480px;margin:14px auto 0;text-align:left}.ayna-other-box label{display:block;font-size:12px;font-weight:600;color:#FFDCA8;margin-bottom:8px}
.ayna-search-wrap{position:relative;margin-bottom:12px;max-width:520px;margin-left:auto;margin-right:auto}.ayna-search-wrap svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:16px;height:16px;fill:none;stroke:#8c8078;stroke-width:2;stroke-linecap:round}.ayna-search-wrap input{width:100%;padding:13px 16px 13px 40px;border-radius:14px;border:none;font-size:14px;color:#2A1F4E;background:#FFF9F2;box-shadow:0 8px 18px -14px rgba(0,0,0,.5);outline:none}.ayna-list-panel{max-width:520px;margin:0 auto;max-height:405px;overflow-y:auto;padding-right:7px}.ayna-list-panel::-webkit-scrollbar{width:7px}.ayna-list-panel::-webkit-scrollbar-thumb{background:rgba(255,249,242,.22);border-radius:4px}.ayna-category{max-width:520px;margin:0 auto 16px;text-align:left}.ayna-category-title{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#FFDCA8;font-weight:700;margin:16px 4px 8px}.ayna-no-matches{padding:22px 4px;color:rgba(255,249,242,.75);font-size:13px}
.ayna-age-card{padding:26px 28px 22px}.ayna-age-top{display:flex;align-items:center;justify-content:center;gap:22px}.ayna-age-btn{width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(42,31,78,.15);background:#FFF3DD;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#2A1F4E;font-size:22px}.ayna-age-value{min-width:112px;text-align:center;font-family:var(--font-serif,'Playfair Display',Georgia,serif);font-size:48px;line-height:1;color:#2A1F4E}.ayna-age-value.empty{font-size:24px;color:#8c8078}.ayna-age-range{width:100%;margin-top:20px;display:block;-webkit-appearance:none;height:4px;border-radius:2px;background:rgba(42,31,78,.12);outline:none}.ayna-age-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#2A1F4E;border:3px solid #FFDCA8;cursor:pointer}.ayna-age-range.unset::-webkit-slider-thumb{opacity:0}.ayna-range-labels{display:flex;justify-content:space-between;font-size:11px;color:#8c8078;margin-top:6px}
.ayna-continue-wrap{max-width:400px;margin:28px auto 0}.ayna-continue{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(140deg,#FFDCA8,#FFC774 46%,#E8843C);color:#2A1F4E;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;box-shadow:0 16px 30px -14px rgba(232,132,60,.55)}.ayna-continue:disabled{opacity:.42;cursor:not-allowed}.ayna-skip{margin-top:14px;border:none;background:none;color:rgba(255,249,242,.62);font-size:13px;cursor:pointer}.ayna-mini-note{max-width:520px;margin:14px auto 0;padding:13px 15px;border:1px solid rgba(255,220,168,.25);background:rgba(255,249,242,.08);border-radius:14px;color:rgba(255,249,242,.78);font-size:12px;line-height:1.55;text-align:left}
.ayna-scale{display:flex;gap:8px;align-items:stretch;padding:18px}.ayna-scale button{flex:1;min-width:0;padding:12px 4px;border-radius:12px;background:#fff;border:1.5px solid rgba(42,31,78,.1);color:#2A1F4E;cursor:pointer;font-size:10.5px;line-height:1.2}.ayna-scale button.selected{background:#2A1F4E;color:#fff;border-color:#2A1F4E}.ayna-scale-mark{display:block;width:14px;border-radius:999px;background:rgba(42,31,78,.18);margin:0 auto 8px}.ayna-scale button.selected .ayna-scale-mark{background:#FFC774}
.ayna-timeline{display:flex;align-items:flex-start;max-width:560px;margin:0 auto;padding:8px 2px}.ayna-timeline button{flex:1;position:relative;padding:30px 4px 0;background:none;border:none;cursor:pointer;color:rgba(255,249,242,.72)}.ayna-timeline button:before{content:'';position:absolute;top:11px;left:0;right:0;height:3px;background:rgba(255,249,242,.24)}.ayna-timeline button:first-child:before{left:50%}.ayna-timeline button:last-child:before{right:50%}.ayna-timeline-dot{position:absolute;top:3px;left:50%;transform:translateX(-50%);width:19px;height:19px;border-radius:50%;background:#FFF9F2;border:3px solid rgba(42,31,78,.28)}.ayna-timeline button.selected .ayna-timeline-dot{background:#2A1F4E;border-color:#FFDCA8}.ayna-timeline-label{font-size:11px;line-height:1.3}.ayna-timeline button.selected{color:#FFDCA8;font-weight:700}
.ayna-token-card{max-width:520px;margin:0 auto;background:#FFF9F2;border-radius:18px;padding:16px;box-shadow:0 14px 28px -18px rgba(0,0,0,.45);text-align:left}.ayna-token-line{display:flex;gap:8px}.ayna-token-line input{flex:1;border:1.5px solid rgba(42,31,78,.14);border-radius:12px;padding:12px 13px;color:#2A1F4E;background:#fff;outline:none}.ayna-token-line button{border:none;border-radius:12px;background:#2A1F4E;color:#fff;padding:0 15px;font-weight:700;cursor:pointer}.ayna-tokens{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.ayna-tokens>span{display:inline-flex;align-items:center;gap:6px;background:#FFF3DD;color:#8A5A1E;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:600}.ayna-tokens span button{border:none;background:none;color:inherit;padding:0;cursor:pointer;font-size:14px}
.ayna-smart-suggestions{margin-top:8px;border:1px solid rgba(42,31,78,.12);border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 14px 28px -20px rgba(0,0,0,.5);position:relative;z-index:3}.ayna-smart-suggestions button{display:block;width:100%;padding:11px 12px;background:#fff;border:none;border-top:1px solid rgba(42,31,78,.08);text-align:left;color:#2A1F4E;cursor:pointer;font-size:13px}.ayna-smart-suggestions button:first-child{border-top:none}.ayna-smart-suggestions button:hover,.ayna-smart-suggestions button:focus{background:#FFF3DD}.ayna-allergy-list{max-height:none}
.ayna-product-builder{max-width:540px;margin:0 auto}.ayna-product-suggestions{margin-top:8px;border:1px solid rgba(42,31,78,.12);border-radius:12px;overflow:hidden}.ayna-product-suggestions button{display:block;width:100%;padding:10px 12px;background:#fff;border:none;border-top:1px solid rgba(42,31,78,.08);text-align:left;color:#2A1F4E;cursor:pointer}.ayna-product-suggestions button:first-child{border-top:none}.ayna-product-card{background:#FFF9F2;color:#2A1F4E;border-radius:20px;padding:18px;margin-top:14px;text-align:left;box-shadow:0 16px 34px -20px rgba(0,0,0,.5)}.ayna-product-head{display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:var(--font-serif,'Playfair Display',Georgia,serif);font-size:18px}.ayna-product-head button{border:none;background:none;color:#8c8078;font-size:12px;cursor:pointer}.ayna-product-q{margin-top:15px}.ayna-product-label{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.045em;margin-bottom:8px;color:#5c554e}.ayna-product-card .ayna-segmented{margin:0;max-width:none}.ayna-product-card .ayna-pill{border-color:rgba(42,31,78,.13);box-shadow:none}
.ayna-spectrum{padding:20px 18px}.ayna-spectrum-line{height:5px;border-radius:999px;background:linear-gradient(90deg,#4E3866,#FFC774,#D97A2B);margin:8px 22px 18px}.ayna-spectrum-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.ayna-spectrum-grid button{padding:11px 7px;border-radius:12px;border:1.5px solid rgba(42,31,78,.1);background:#fff;font-size:10.5px;line-height:1.3;color:#2A1F4E;cursor:pointer}.ayna-spectrum-grid button.selected{border-color:#E8843C;background:#FFF3DD}
.ayna-trust-list{max-width:520px;margin:0 auto;display:grid;gap:10px}.ayna-trust-item{display:flex;align-items:center;gap:10px;background:#FFF9F2;color:#2A1F4E;border-radius:16px;padding:13px 14px;box-shadow:0 10px 22px -16px rgba(0,0,0,.4)}.ayna-drag{color:#8c8078;cursor:grab;letter-spacing:-4px;font-size:18px}.ayna-rank{width:24px;height:24px;border-radius:50%;background:#FFF3DD;color:#8A5A1E;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}.ayna-trust-label{flex:1;text-align:left;font-size:13px;font-weight:600;line-height:1.35}.ayna-move{display:flex;gap:4px}.ayna-move button{width:26px;height:26px;border-radius:8px;border:1px solid rgba(42,31,78,.12);background:#fff;color:#2A1F4E;cursor:pointer}
.ayna-saving{margin-top:14px;color:rgba(255,249,242,.72);font-size:12px}.ayna-error{margin-top:14px;color:#FFE0D6;font-size:12px;font-weight:600}.ayna-count{background:rgba(42,31,78,.16);border-radius:999px;padding:2px 9px;font-size:12px}
@media(max-width:720px){.ayna-intake-root{padding:24px 14px 58px}.ayna-intake-question{padding-top:20px}.ayna-choice-grid{grid-template-columns:1fr}.ayna-intake-question h1{font-size:25px}.ayna-spectrum-grid{grid-template-columns:1fr}.ayna-scale{overflow-x:auto}.ayna-scale button{min-width:76px}.ayna-timeline{overflow-x:auto;padding-bottom:8px}.ayna-timeline button{min-width:110px}.ayna-intake-section-label{padding-left:46px}.ayna-segmented{flex-wrap:wrap}.ayna-seg-option{min-width:110px}.ayna-token-line{flex-direction:column}.ayna-token-line button{padding:11px}.ayna-product-card .ayna-segmented{flex-direction:column}.ayna-product-card .ayna-seg-option{width:100%}}
`;

export default function HealthIntakeForm({ onComplete }) {
  const [intake, setIntake] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return EMPTY;
      const parsed = JSON.parse(raw);
      return { ...EMPTY, ...(parsed?.intake || {}) };
    } catch (_) { return EMPTY; }
  });
  const [stepId, setStepId] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw)?.stepId || 'age' : 'age';
    } catch (_) { return 'age'; }
  });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const visibleSteps = useMemo(() => {
    const steps = [
      { id: 'age', section: 'core', title: 'How old are you?', type: 'age', optional: true },
      { id: 'lifeStage', section: 'core', title: 'Which option best describes you right now?', type: 'cards', optional: true },
      { id: 'zip', section: 'core', title: 'What is your ZIP code?', subtitle: 'Optional. This helps us personalize local care and availability.', type: 'text', optional: true },
      { id: 'support', section: 'support', title: 'What are you currently experiencing or looking for support with?', subtitle: 'Choose anything that feels relevant. You can search or browse by category.', type: 'support', optional: true },
      ...(isPeriodRelevant(intake) ? [
        { id: 'periodFlow', section: 'support', title: 'How would you describe your typical period flow?', type: 'flow', optional: true },
        { id: 'periodPain', section: 'support', title: 'How would you describe your typical period pain?', type: 'pain', optional: true },
      ] : []),
      ...(isUtiRelevant(intake) ? [{ id: 'utiFrequency', section: 'support', title: 'How often do you experience UTI-like symptoms?', type: 'timeline', optional: true }] : []),
      ...(isTtcRelevant(intake) ? [{ id: 'ttcDuration', section: 'support', title: 'How long have you been trying to conceive?', type: 'timeline', optional: true }] : []),
      ...(isPostpartumRelevant(intake) ? [{ id: 'postpartumTiming', section: 'support', title: 'How long ago did you give birth?', type: 'timeline', optional: true }] : []),
      ...(isPregnancyRelevant(intake) ? [{ id: 'pregnancyTrimester', section: 'support', title: 'How far along are you?', type: 'timeline', optional: true }] : []),
      { id: 'conditions', section: 'safety', title: 'Have you been diagnosed with any of the following?', subtitle: 'This is different from what you are experiencing. It helps us separate a diagnosed condition from a symptom or goal.', type: 'conditions', optional: false },
      { id: 'allergies', section: 'safety', title: 'What are you allergic or sensitive to, if anything?', subtitle: 'Select all that apply.', type: 'allergies', optional: false },
      { id: 'medications', section: 'safety', title: 'Are you currently taking any medications, supplements, vitamins, or hormonal birth control?', subtitle: 'This helps us avoid duplicate ingredients and flag possible compatibility issues.', type: 'medications', optional: false },
      { id: 'products', section: 'history', title: 'Which health or wellness products have you already used?', subtitle: 'Start typing a product name, then choose a suggestion or add your own. This helps prevent repeat recommendations.', type: 'products', optional: true },
      { id: 'avoidRepeat', section: 'history', title: 'Are there any products or brands you definitely do not want recommended again?', type: 'tokens', optional: true },
      { id: 'safety', section: 'safety', title: 'Are any symptoms you are experiencing new, rapidly worsening, or concerning to you right now?', type: 'safety', optional: false },
      { id: 'formats', section: 'preferences', title: 'Which product formats do you prefer?', type: 'formats', optional: true },
      { id: 'priceRange', section: 'preferences', title: 'What price range do you usually prefer for health and wellness products?', type: 'price', optional: true },
      { id: 'largePurchaseFrequency', section: 'preferences', title: 'How often do you make larger health or wellness purchases of $75 or more?', subtitle: 'This is about purchase frequency, not your usual preferred price per product.', type: 'largeSpend', optional: true },
      { id: 'brandOpenness', section: 'preferences', title: 'How do you feel about trying new brands?', type: 'brand', optional: true },
      ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [{ id: 'trustedBrands', section: 'preferences', title: 'Which brands do you already trust?', type: 'tokens', optional: true }] : []),
      { id: 'avoidIngredients', section: 'preferences', title: 'Are there any ingredients or materials you prefer to avoid?', subtitle: 'This is a shopping preference. Allergies and sensitivities were captured separately for safety.', type: 'avoidIngredients', optional: true },
      { id: 'fsaHsa', section: 'preferences', title: 'Do you have an FSA or HSA you would like to use?', type: 'fsa', optional: true },
      { id: 'trust', section: 'trust', title: 'What matters most to you when deciding whether to trust a product?', subtitle: 'Drag to rank, or use the arrows. You can also skip this.', type: 'trust', optional: true },
      { id: 'anythingElse', section: 'trust', title: 'Anything else you want Ayna to know?', subtitle: 'Share anything else that could help us personalize your recommendations.', type: 'textarea', optional: true },
    ];
    return steps;
  }, [intake]);

  useEffect(() => {
    if (!visibleSteps.some((step) => step.id === stepId)) setStepId(visibleSteps[0]?.id || 'age');
  }, [visibleSteps, stepId]);

  const currentIndex = Math.max(0, visibleSteps.findIndex((step) => step.id === stepId));
  const step = visibleSteps[currentIndex] || visibleSteps[0];
  const sectionIndex = Math.max(0, SECTION_ORDER.indexOf(step.section));

  useEffect(() => {
    try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ intake, stepId })); } catch (_) {}
  }, [intake, stepId]);

  useEffect(() => {
    if (currentIndex <= 0) return undefined;
    const handler = (event) => { event.preventDefault(); event.returnValue = ''; return ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [currentIndex]);

  const set = (key, value) => setIntake((prev) => ({ ...prev, [key]: value }));
  const toggleExclusive = (key, value, exclusiveValues = []) => setIntake((prev) => {
    const current = Array.isArray(prev[key]) ? prev[key] : (prev[key] ? [prev[key]] : []);
    let next;
    if (current.includes(value)) next = current.filter((x) => x !== value);
    else if (exclusiveValues.includes(value)) next = [value];
    else next = [...current.filter((x) => !exclusiveValues.includes(x)), value];
    return { ...prev, [key]: next };
  });

  const goBack = () => {
    if (currentIndex <= 0) return;
    setSearch('');
    setStepId(visibleSteps[currentIndex - 1].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = async () => {
    setSaving(true); setSaveError('');
    const snapshot = buildSnapshot(intake);
    try {
      const result = await saveHealthIntakeForCurrentUser(snapshot);
      if (result?.saved === false && result?.localSaved !== true && result?.reason !== 'no_authenticated_user') throw new Error(result?.reason || 'save_failed');
      onComplete(mapIntakeToLegacyQuizProfile(snapshot));
    } catch (error) {
      console.error('[Ayna] intake save failed:', error);
      setSaveError("Couldn't save yet. Try Finish again.");
      setSaving(false);
    }
  };

  const goNext = () => {
    if (!requiredReady(step.id, intake) || saving) return;
    if (currentIndex >= visibleSteps.length - 1) { finish(); return; }
    setSearch('');
    setStepId(visibleSteps[currentIndex + 1].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBody = () => {
    if (step.type === 'age') {
      const numeric = intake.age ? Number(intake.age) : 28;
      return <div className="ayna-white-card ayna-age-card"><div className="ayna-age-top"><button type="button" className="ayna-age-btn" onClick={() => set('age', String(Math.max(13, (intake.age ? Number(intake.age) : 28) - 1)))}>−</button><div className={`ayna-age-value${intake.age ? '' : ' empty'}`}>{intake.age || 'Select'}</div><button type="button" className="ayna-age-btn" onClick={() => set('age', String(Math.min(90, (intake.age ? Number(intake.age) : 27) + 1)))}>+</button></div><input className={`ayna-age-range${intake.age ? '' : ' unset'}`} type="range" min="13" max="90" value={numeric} onChange={(e) => set('age', e.target.value)} /><div className="ayna-range-labels"><span>13</span><span>90</span></div></div>;
    }
    if (step.type === 'cards' && step.id === 'lifeStage') return <><div className="ayna-choice-grid">{LIFE_STAGES.map((option) => <ChoiceCard key={option} label={option} selected={intake.lifeStage === option} onClick={() => set('lifeStage', option)} />)}</div>{intake.lifeStage === 'Other' && <div className="ayna-other-box"><label>Tell us what best describes you</label><input className="ayna-text-input" value={intake.lifeStageOther} onChange={(e) => set('lifeStageOther', e.target.value)} placeholder="Type your answer..." /></div>}</>;
    if (step.type === 'text' && step.id === 'zip') return <input className="ayna-text-input" inputMode="numeric" maxLength={5} value={intake.zipcode} onChange={(e) => set('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 10001" />;
    if (step.type === 'support') return <><SearchableGroups groups={SUPPORT_GROUPS} selected={intake.supportSelections} search={search} onSearch={setSearch} onToggle={(item) => toggleExclusive('supportSelections', item, ['Nothing right now'])} />{intake.supportSelections.includes('Something else') && <div className="ayna-other-box"><label>Tell us what else you are looking for support with</label><input className="ayna-text-input" value={intake.supportOtherText} onChange={(e) => set('supportOtherText', e.target.value)} placeholder="Type your answer..." /></div>}</>;
    if (step.type === 'flow') return <Scale options={PERIOD_FLOW} value={intake.periodFlow} onChange={(value) => set('periodFlow', value)} kind="flow" />;
    if (step.type === 'pain') return <Scale options={PERIOD_PAIN} value={intake.periodPain} onChange={(value) => set('periodPain', value)} kind="pain" />;
    if (step.type === 'timeline') {
      const config = step.id === 'utiFrequency' ? ['utiFrequency', UTI_FREQUENCY] : step.id === 'ttcDuration' ? ['ttcDuration', TTC_DURATION] : step.id === 'postpartumTiming' ? ['postpartumTiming', POSTPARTUM_TIMING] : ['pregnancyTrimester', PREGNANCY_TRIMESTER];
      return <Timeline options={config[1]} value={intake[config[0]]} onChange={(value) => set(config[0], value)} />;
    }
    if (step.type === 'conditions') return <><div className="ayna-list-panel">{CONDITIONS.map((option) => <RowChoice key={option} label={option} selected={intake.diagnosisSelections.includes(option)} onClick={() => toggleExclusive('diagnosisSelections', option, ['None that I know of', 'Prefer not to say'])} square />)}</div>{intake.diagnosisSelections.includes('Other / not listed') && <div className="ayna-other-box"><label>What condition was diagnosed?</label><input className="ayna-text-input" value={intake.conditionOtherText} onChange={(e) => set('conditionOtherText', e.target.value)} placeholder="Type the condition..." /></div>}</>;
    if (step.type === 'allergies') return <><div className="ayna-list-panel ayna-allergy-list">{ALLERGIES.map((option) => <RowChoice key={option} label={option} selected={intake.allergySelections.includes(option)} onClick={() => toggleExclusive('allergySelections', option, ['None known', 'Not sure'])} square />)}</div>{intake.allergySelections.includes('Other') && <div className="ayna-other-box"><label>Tell us what you are allergic or sensitive to</label><input className="ayna-text-input" value={intake.allergyOtherText} onChange={(e) => set('allergyOtherText', e.target.value)} placeholder="Type your answer..." /></div>}</>;
    if (step.type === 'medications') return <><Segmented options={['Yes', 'No', 'Prefer not to say']} value={intake.takesCurrent} onChange={(value) => set('takesCurrent', value)} />{intake.takesCurrent === 'Yes' && <div style={{ marginTop: 14 }}><TokenInput values={intake.currentMedicationItems} onChange={(values) => set('currentMedicationItems', values)} placeholder="Start typing a medication, supplement, vitamin, or birth control" suggestions={MEDICATION_SUGGESTIONS} /></div>}<div className="ayna-mini-note">Always consult a clinician before starting a new supplement or medication. Ayna surfaces options relevant to the profile you shared, but you should still check product ingredients, labels, and instructions.</div></>;
    if (step.type === 'products') return <ProductHistoryBuilder products={intake.productHistory} onChange={(products) => set('productHistory', products)} />;
    if (step.type === 'tokens' && step.id === 'avoidRepeat') return <TokenInput values={intake.avoidRepeat} onChange={(values) => set('avoidRepeat', values)} placeholder="Start typing a product or brand" suggestions={PRODUCT_OR_BRAND_SUGGESTIONS} />;
    if (step.type === 'tokens' && step.id === 'trustedBrands') return <TokenInput values={intake.trustedBrands} onChange={(values) => set('trustedBrands', values)} placeholder="Start typing a brand" suggestions={BRAND_SUGGESTIONS} />;
    if (step.type === 'safety') return <><Segmented options={['Yes', 'No', 'Not sure']} value={intake.safetyConcern} onChange={(value) => set('safetyConcern', value)} />{['Yes', 'Not sure'].includes(intake.safetyConcern) && <div className="ayna-mini-note">Some new or worsening symptoms may need evaluation by a healthcare professional. Ayna helps with product discovery and education and does not diagnose medical conditions or replace professional medical care. If symptoms feel urgent or severe, seek appropriate medical care promptly.</div>}</>;
    if (step.type === 'formats') return <><div className="ayna-choice-grid">{PRODUCT_FORMATS.map((option) => <ChoiceCard key={option} label={option} selected={intake.preferredFormats.includes(option)} onClick={() => toggleExclusive('preferredFormats', option, ['No preference'])} />)}</div>{intake.preferredFormats.includes('Other') && <div className="ayna-other-box"><label>What format do you prefer?</label><input className="ayna-text-input" value={intake.formatOtherText} onChange={(e) => set('formatOtherText', e.target.value)} placeholder="Type your answer..." /></div>}</>;
    if (step.type === 'price') { const selectedPrices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []); return <div className="ayna-pills">{PRICE_RANGES.map((option) => <Pill key={option} label={option} selected={selectedPrices.includes(option)} onClick={() => toggleExclusive('priceRange', option, ['Price is not a major factor for me'])} />)}</div>; }
    if (step.type === 'largeSpend') return <Timeline options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(value) => set('largePurchaseFrequency', value)} />;
    if (step.type === 'brand') return <BrandSpectrum value={intake.brandOpenness} onChange={(value) => set('brandOpenness', value)} />;
    if (step.type === 'avoidIngredients') return <><div className="ayna-pills">{AVOID_INGREDIENTS.map((option) => <Pill key={option} label={option} selected={intake.avoidIngredients.includes(option)} onClick={() => toggleExclusive('avoidIngredients', option, ['None'])} />)}</div>{intake.avoidIngredients.includes('Other') && <div className="ayna-other-box"><label>What else would you prefer to avoid?</label><input className="ayna-text-input" value={intake.avoidIngredientsOtherText} onChange={(e) => set('avoidIngredientsOtherText', e.target.value)} placeholder="Type your answer..." /></div>}</>;
    if (step.type === 'fsa') return <div className="ayna-pills">{FSA_HSA.map((option) => <Pill key={option} label={option} selected={intake.fsaHsaAnswer === option} onClick={() => set('fsaHsaAnswer', option)} />)}</div>;
    if (step.type === 'trust') return <TrustRanker order={intake.trustRanking} onChange={(order) => set('trustRanking', order)} onTouch={() => set('trustRankingTouched', true)} />;
    if (step.type === 'textarea') return <textarea className="ayna-textarea" value={intake.anythingElse} onChange={(e) => set('anythingElse', e.target.value)} placeholder="Share anything else that could help us personalize your recommendations." />;
    return null;
  };

  const countForStep = step.id === 'support' ? intake.supportSelections.length : step.id === 'conditions' ? intake.diagnosisSelections.length : step.id === 'allergies' ? intake.allergySelections.length : step.id === 'formats' ? intake.preferredFormats.length : step.id === 'avoidIngredients' ? intake.avoidIngredients.length : 0;
  const ready = requiredReady(step.id, intake);
  const isLast = currentIndex === visibleSteps.length - 1;

  return (
    <div className="ayna-intake-root">
      <style>{STYLES}</style>
      <div className="ayna-intake-glow g1" /><div className="ayna-intake-glow g2" /><div className="ayna-intake-glow g3" />
      <div className="ayna-intake-shell">
        <div className="ayna-intake-top">
          {currentIndex > 0 && <button type="button" className="ayna-intake-back" onClick={goBack} aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>}
          <div className="ayna-intake-segments">{SECTION_ORDER.map((section, index) => <span key={section} className={`ayna-intake-segment${index <= sectionIndex ? ' on' : ''}`} />)}</div>
        </div>
        <div className="ayna-intake-section-label">{SECTION_LABELS[step.section]}</div>
        <div className="ayna-intake-question">
          <SectionIcon section={step.section} />
          <h1>{step.title}</h1>
          {step.subtitle && <p className="ayna-intake-subtitle">{step.subtitle}</p>}
          {!step.optional && <p className="ayna-intake-hint">Required for safety</p>}
          <div className="ayna-intake-stage">{renderBody()}</div>
          <div className="ayna-continue-wrap">
            <button type="button" className="ayna-continue" onClick={goNext} disabled={!ready || saving}>{saving ? 'Saving...' : isLast ? 'Finish profile' : 'Continue'}{countForStep > 0 && <span className="ayna-count">{countForStep}</span>}<span aria-hidden="true">→</span></button>
            {step.optional && <button type="button" className="ayna-skip" onClick={goNext}>Skip this step</button>}
          </div>
          {step.id === 'products' && intake.productHistory.length > 0 && !ready && <div className="ayna-saving">Finish the three quick questions for each product before continuing.</div>}
          {saveError && <div className="ayna-error">{saveError}</div>}
        </div>
      </div>
    </div>
  );
}
