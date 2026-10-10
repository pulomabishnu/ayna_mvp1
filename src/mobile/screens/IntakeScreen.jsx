import { useMemo, useRef, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';
import { getFirstIncompleteStepId, getIncompleteStepIds } from '../utils/profileCompleteness.js';
import { ChipList, StickerGrid, SearchField, ChoiceRows, AgeDial, ZipTicket, LevelMeter, TrackLine, PriceStacks, DotScale, BrandSpectrum, AccountCards, TrustPodium, StickyNote, TopicPicker } from '../components/intake/IntakeControls.jsx';
import IntakeSceneArt from '../components/intake/IntakeSceneArt.jsx';
import { INTAKE_SCENES } from '../components/intake/intakeScenes.js';
import '../intake-play.css';
import RecommendationCountPicker from '../components/RecommendationCountPicker.jsx';
import { normalizeAge, normalizeLifeStages, selectLifeStage } from '../../utils/intakeSelections.js';

// Mirrors the real onboarding form's one-question-per-step wizard from
// src/components/HealthIntakeForm.jsx (a full redesign — SUPPORT_GROUPS,
// LIFE_STAGES, branching helpers, and buildSnapshot() below are ported
// near-verbatim from that file's `intakeVersion: 'beta-redesign-2026-09'`).
// Keep in sync if the real intake changes again.
//
// MobileApp owns account persistence when onComplete receives this snapshot.
// The wizard itself keeps draft edits separate until completion.

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
  { label: 'Skin + hair', items: ['Acne', 'Hair thinning or hair loss', 'Excess facial or body hair', 'Hormone-related skin concerns'] },
  { label: 'Metabolic + physical wellness', items: ['Metabolism or weight support', 'Strength or fitness', 'Bone health'] },
  { label: 'Care access', items: ['Finding a doctor or specialist', 'Finding a telehealth provider'] },
  { label: 'Right now', items: ['Nothing right now'] },
];

const LIFE_STAGES = [
  'I get periods regularly', 'My periods are irregular', 'I do not currently get periods',
  'I use hormonal birth control', 'I am trying to conceive', 'I am pregnant', 'I am postpartum',
  'I am in perimenopause', 'I am in menopause', 'I am post-menopause',
];
const LIFE_STAGE_LABELS = {
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
// Abstract "phase" marks (CSS-drawn) so each stage reads at a glance
// without leaning on clip-art icons.
const LIFE_STAGE_GLYPHS = {
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
const MIDLIFE_LIFE_STAGES = ['I am in perimenopause', 'I am in menopause', 'I am post-menopause'];

const PERIOD_FLOW = ['Very light', 'Light', 'Moderate', 'Heavy', 'Very heavy', 'It varies', 'I do not currently get periods', 'Not sure'];
const PERIOD_PAIN = ['None', 'Mild', 'Moderate', 'Severe', 'Very severe', 'It varies', 'Not sure'];
const UTI_FREQUENCY = ['This is the first time', 'Rarely', 'A few times a year', 'About monthly', 'More than once a month', 'I am experiencing them right now', 'Not sure'];
const POSTPARTUM_TIMING = ['Less than 6 weeks ago', '6 weeks–3 months ago', '3–6 months ago', '6–12 months ago', 'More than 12 months ago'];
const PREGNANCY_TRIMESTER = ['First trimester', 'Second trimester', 'Third trimester', 'Not sure', 'Prefer not to say'];
const PERIMENOPAUSE_LAST_PERIOD = ['Within the past 3 months', '3–6 months ago', '6–12 months ago', 'More than 12 months ago', "I'm not sure", 'Prefer not to say'];

const CONDITIONS = [
  'PCOS', 'Endometriosis', 'Fibroids', 'Adenomyosis', 'PMS', 'PMDD', 'Infertility', 'Thyroid condition',
  'Diabetes', 'Insulin resistance', 'High blood pressure', 'Migraine with aura', 'Anemia or iron deficiency',
  'IBS or another digestive condition', 'Autoimmune condition', 'Anxiety', 'Depression',
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
  'Suppositories', 'Devices or wearables', 'Period-care products', 'No preference',
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
};
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
  'Sensitive skin', 'Unscented', 'No preference',
];
const FSA_HSA = ['FSA', 'HSA', 'Both', 'No', 'Not sure'];
const TRUST_ITEMS = ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'];
const STOP_REASONS = [
  'It did not help', 'It stopped working', 'I had side effects or a reaction', 'It was too expensive',
  'It was inconvenient', 'I did not like the format', 'I found something better',
  'A clinician recommended stopping it', 'I simply did not repurchase it',
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
  'preferredFormats', 'formatOtherText', 'recommendedProductsPerArea', 'priceRange', 'largePurchaseFrequency',
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
  'Fibroid-related concerns': 'Fibroid-related concerns',
  'Adenomyosis-related concerns': 'Adenomyosis-related concerns',
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
    ttcDuration: '',
    postpartumTiming: isPostpartumRelevant(intake) ? intake.postpartumTiming : '',
    pregnancyTrimester: isPregnancyRelevant(intake) ? intake.pregnancyTrimester : '',
    breastfeedingStatus: hasLifeStage(intake, 'I am postpartum') ? intake.breastfeedingStatus : '',
    perimenopauseLastPeriod: hasLifeStage(intake, 'I am in perimenopause') ? intake.perimenopauseLastPeriod : '',
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
    tryingToConceive: isTtcRelevant(intake) ? 'Yes' : 'No',
    productHistory: intake.productHistory,
    currentProducts: usedNames,
    avoidRepeat: intake.avoidRepeat,
    dislikedProducts,
    dislikedReason,
    brandSupportPreferences: intake.brandSupportPreferences,
    safetyConcern: intake.safetyConcern,
    preferredFormats: intake.preferredFormats,
    formatOtherText: [...new Set([...customFormats, intake.formatOtherText.trim()].filter(Boolean))].join('; '),
    recommendedProductsPerArea: intake.recommendedProductsPerArea,
    preferredProductTypes,
    priceRange: intake.priceRange,
    largePurchaseFrequency: intake.largePurchaseFrequency,
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
// Choice colors use the app tokens so selection remains legible in both themes.
const NAVY = 'var(--ayna-heading)';
const CARD_BG = 'var(--ayna-surface)';
const ROW_BORDER = 'var(--ayna-border)';
const ACCENT_BORDER = 'var(--ayna-accent-dark)';
const ACCENT_BG = 'var(--ayna-accent)';
const PANEL_BG = 'var(--ayna-chip-bg)';
const MUTED = 'var(--ayna-text-faint)';
const LABEL_GOLD = 'var(--ayna-brown)';
const SELECTED_TEXT = 'var(--ayna-color-ink)';
const INK = 'var(--ayna-text)';
const BODY_TEXT = 'var(--ayna-text-muted)';


/* ------------------------------ Shared widgets ------------------------------ */

// 2-column tile grid (design pattern B1/E1). Callers with real per-option
// icon art (currently just product formats — see FORMAT_ICONS above) pass an
// `icons` map to render a small rounded-square badge above the label;
// callers without one (life stages, which have no matching icon set) get the
// plain label-only tile exactly as before.
function ChoiceGrid({ items, selected = [], onToggle, icons, labels, glyphs }) {
  return <StickerGrid items={items} selected={selected} onToggle={onToggle} icons={icons} labels={labels} glyphs={glyphs} />;
}

// Chip spec (design pattern C1/G1) — flex-wrapped pills, not vertical rows.
// Used both flat (conditions) and grouped under a label (SearchableGroups).
function RowChoiceList({ items, selected = [], onToggle }) {
  return <ChipList items={items} selected={selected} onToggle={onToggle} />;
}

// Shared search-bar chrome (design rule: "search on every list over ~12
// options") — same pill-shaped input used by SearchableGroups, TokenInput
// and ProductHistoryBuilder, factored out so conditions/avoidIngredients
// (previously ungrouped flat lists with no filtering at all) can use it too.
function SearchBar({ value, onChange, placeholder }) {
  return <SearchField value={value} onChange={onChange} placeholder={placeholder} />;
}

function AddCustomChoice({ query, options, onAdd }) {
  const value = query.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || options.some((item) => item.toLowerCase() === value.toLowerCase())) return null;
  return <button type="button" className="ip-chip is-dashed ip-add" onClick={() => onAdd(value)}>+ Add “{value}”</button>;
}

function SearchableChoices({ items, selected, onToggle, search, onSearch, onAdd, placeholder, layout = 'chips', icons, labels, glyphs, searchable = true }) {
  const query = search.trim().toLowerCase();
  const filtered = query ? items.filter((item) => item.toLowerCase().includes(query) || String(labels?.[item] || '').toLowerCase().includes(query)) : items;
  const custom = selected.filter((item) => !items.includes(item));
  return <div className="ip-picker">
    {searchable && <SearchBar value={search} onChange={onSearch} placeholder={placeholder} />}
    <AddCustomChoice query={search} options={[...items, ...selected]} onAdd={onAdd} />
    {filtered.length > 0 ? layout === 'grid' ? <ChoiceGrid items={filtered} selected={selected} onToggle={onToggle} icons={icons} labels={labels} glyphs={glyphs} /> : <RowChoiceList items={filtered} selected={selected} onToggle={onToggle} /> : <p className="ip-empty">No matches</p>}
    {custom.length > 0 && <div className="ip-custom"><small>Added by you</small><RowChoiceList items={custom} selected={selected} onToggle={onToggle} /></div>}
  </div>;
}

// Same chip spec as RowChoiceList — kept as a separate component since
// callers pass a single non-array `selected` list built differently (some
// single-select via toggleExclusive, some genuinely multi), and the
// `compact`/`left` nested-context variants (inside ProductHistoryBuilder)
// need a smaller size without becoming a third visual language.
function Pills({ options, selected, onToggle, compact, exclusiveValues = [] }) {
  return <ChipList items={options} selected={selected} onToggle={onToggle} compact={compact} muted={exclusiveValues} />;
}

// Vertical single-select radio list (design pattern F1) — the workhorse
// pattern for every Yes/No/Not-sure-style question, replacing the old
// horizontal segmented-button bar.
function Segmented({ options, value, onChange }) {
  return <ChoiceRows options={options} value={value} onChange={onChange} />;
}

// Pattern K1: price bands as a vertical row list rather than chips — a
// Playfair price label on the left, a descriptive subtitle right-aligned,
// and a trailing checkmark instead of a leading radio circle.


// Under-18 gate (Ayna_Minor_Gate.html design reference) — a fixed warm
// warning tone rather than a --ayna-* var, same reasoning as SELECTED_TEXT
// above: the reference keeps this specific color regardless of theme, and
// there's no existing token for it.
const MINOR_AGE_LIMIT = 18;
const WARNING_BORDER = '#B4402A';
const WARNING_BG = '#FAEDE8';
const WARNING_BORDER_SOFT = '#E8C6B8';
const WARNING_TITLE = '#8A2F1D';
const WARNING_BODY = '#7A4234';

function isMinorAge(value) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n < MINOR_AGE_LIMIT;
}

// A native age picker keeps the first intake step easy to complete without
// opening the keyboard. Age is optional, but under-18 selections remain gated.

// Five real per-digit inputs (the standard OTP-input pattern), not one
// invisible input overlaid on decorative boxes — that overlay trick proved
// unreliable for actually opening the keyboard/accepting taps on real
// mobile browsers, where each digit box here is itself a genuine,
// correctly-sized, tappable, typeable <input>.


// Pattern D2: rising bars for the first up-to-5 ordered levels; any
// trailing non-ordinal options (e.g. "It varies", "Not sure") render as
// plain chips below instead of getting an arbitrary bar height — same
// options, just not force-fit onto a severity scale they don't belong on.

// Timeline questions (UTI recurrence, postpartum timing, trimester, large-
// purchase frequency) are single-select among ordered options — pattern F1
// (the same vertical radio list as Yes/No questions), not a distinct
// visual language of their own.

// Brand openness is a single-select among ordered options too — F1 again,
// swapping in only the option order it already had.

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
          aria-label={placeholder}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 'max(16px, calc(13px * var(--ayna-text-scale, 1)))', minWidth: 0 }}
        />
      </div>
      {draft.trim().length > 0 && (
        <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
          <button type="button" className="ayna-intake-control" onClick={() => addValue(draft)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: INK, fontWeight: 600, cursor: 'pointer', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontFamily: "var(--ayna-font-ui)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span>Add "{draft.trim()}"</span>
          </button>
          {matches.map((option) => (
            <button type="button" className="ayna-intake-control" key={option} onClick={() => addValue(option)} style={{ padding: '13px 14px', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>
              {option}
            </button>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {values.map((value, i) => (
            <div key={`${value}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: ACCENT_BG, border: '1px solid ' + ACCENT_BORDER, flex: 'none' }} />
              <span style={{ flex: 1, fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK }}>{value}</span>
              <button type="button" className="ayna-intake-control" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
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
              <span style={{ flex: 1, fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK }}>{value}</span>
              <button type="button" className="ayna-intake-control" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button type="button" className="ayna-intake-control"
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            padding: '15px', borderRadius: 16, border: '1.5px dashed #F7BADD', background: '#FCFBFB',
            fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: '#1D1A2B',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F7BADD" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add a product or brand
        </button>
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
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 'max(16px, calc(13px * var(--ayna-text-scale, 1)))', minWidth: 0 }}
            />
            <button type="button" className="ayna-intake-control" aria-label="Close search" onClick={() => { setAdding(false); setDraft(''); }} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          {draft.trim().length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
              <button type="button" className="ayna-intake-control" onClick={() => addValue(draft)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: INK, fontWeight: 600, cursor: 'pointer', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontFamily: "var(--ayna-font-ui)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span>Add "{draft.trim()}"</span>
              </button>
              {matches.map((option) => (
                <button type="button" className="ayna-intake-control" key={option} onClick={() => addValue(option)} style={{ padding: '13px 14px', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {quickAdd.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.1px', textTransform: 'uppercase', color: '#F7BADD', marginBottom: 10 }}>From your history</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {quickAdd.map((name) => (
              <button type="button" className="ayna-intake-control"
                key={name}
                onClick={() => addValue(name)}
                style={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', padding: '9px 13px', borderRadius: 99,
                  background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, color: INK,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={LABEL_GOLD} strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {footerText && (
        <p style={{ margin: '18px 0 0', fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'rgba(255,249,242,.6)' }}>{footerText}</p>
      )}
    </div>
  );
}

// Pattern C1: search bar + grouped chips, each group header showing a live
// "n/m" selected count.

function ProductHistoryBuilder({ products, onChange }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [stopSearch, setStopSearch] = useState('');
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
        <button type="button" className="ayna-intake-control"
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            padding: '15px', borderRadius: 16, border: '1.5px dashed #F7BADD', background: '#FCFBFB',
            fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: '#1D1A2B',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F7BADD" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add a product or brand
        </button>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CARD_BG, border: '1.5px solid ' + ACCENT_BORDER, borderRadius: 99, padding: '11px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) addProduct(query); }} placeholder="Search products" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: INK, fontSize: 'max(16px, calc(13px * var(--ayna-text-scale, 1)))', minWidth: 0 }} />
            <button type="button" className="ayna-intake-control" aria-label="Close search" onClick={() => { setAdding(false); setQuery(''); }} style={{ cursor: 'pointer', opacity: 0.55, flex: 'none', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          {query.trim().length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 16, background: CARD_BG, border: '1.5px solid ' + ROW_BORDER, overflow: 'hidden' }}>
              <button type="button" className="ayna-intake-control" onClick={() => addProduct(query)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', color: INK, fontWeight: 600, cursor: 'pointer', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontFamily: "var(--ayna-font-ui)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                <span>Add "{query.trim()}"</span>
              </button>
              {suggestions.map((name) => (
                <button type="button" className="ayna-intake-control" key={name} onClick={() => addProduct(name)} style={{ padding: '13px 14px', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK, cursor: 'pointer', borderTop: '1px solid ' + ROW_BORDER }}>{name}</button>
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
                <button type="button" className="ayna-intake-control" aria-expanded={expanded} onClick={() => { setExpandedIndex(expanded ? null : index); setStopSearch(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{summary.length ? summary.join(' · ') : 'Optional details'}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flex: 'none', color: MUTED, transform: expanded ? 'rotate(180deg)' : 'rotate(-90deg)', transition: 'transform .2s' }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {expanded && (
                  <div style={{ padding: '0 14px 16px', borderTop: '1px solid ' + ROW_BORDER, paddingTop: 14 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: INK, marginBottom: 8 }}>Currently using it?</div>
                      <Segmented options={['Yes', 'No']} value={product.current} onChange={(v) => updateProduct(index, { current: v })} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: INK, marginBottom: 8 }}>How well did it work?</div>
                      <Pills options={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={product.worked ? [product.worked] : []} onToggle={(v) => updateProduct(index, { worked: v })} left compact />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: INK, marginBottom: 8 }}>Any side effects or reactions?</div>
                      <Pills options={['No', 'Mild', 'Serious', 'Not sure']} selected={product.reaction ? [product.reaction] : []} onToggle={(v) => updateProduct(index, { reaction: v })} left compact />
                    </div>

                    {['Mild', 'Serious'].includes(product.reaction) && (
                      <div style={{ marginBottom: 14, padding: '12px 13px', borderRadius: 14, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
                        <input value={product.reactionText} onChange={(e) => updateProduct(index, { reactionText: e.target.value })} placeholder="What happened? (optional)" style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'transparent', outline: 'none', fontSize: 'max(16px, calc(12.5px * var(--ayna-text-scale, 1)))', color: INK, fontFamily: 'inherit' }} />
                      </div>
                    )}

                    {product.current === 'No' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: INK, marginBottom: 8 }}>Why did you stop?</div>
                        <SearchableChoices
                          items={STOP_REASONS}
                          selected={product.stopReasons || []}
                          onToggle={(reason) => updateProduct(index, {
                            stopReasons: (product.stopReasons || []).includes(reason) ? product.stopReasons.filter((x) => x !== reason) : [...(product.stopReasons || []), reason],
                          })}
                          search={stopSearch}
                          onSearch={setStopSearch}
                          onAdd={(value) => { updateProduct(index, { stopReasons: [...new Set([...(product.stopReasons || []), value])] }); setStopSearch(''); }}
                          placeholder="Search why you stopped"
                        />
                      </div>
                    )}

                    <button type="button" className="ayna-intake-control" onClick={() => removeProduct(index)} style={{ marginTop: 10, color: LABEL_GOLD, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, cursor: 'pointer' }}>Remove product</button>
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

// Pattern M1 — textarea plus dashed "inspiration only" prompt chips: tapping
// one appends its starter phrase rather than committing an answer, since
// unlike every selectable option elsewhere in this form, these never
// represent a stored choice.
const FREE_TEXT_PROMPTS = ['A goal', "What hasn't worked", 'Something I missed'];


// Under-18 gate, terminal screen (Ayna_Minor_Gate.html design reference).
// Deliberately not styled with the rest of the quiz's dark hero-gradient
// chrome — this is a policy/stop screen, not another question card, so it
// keeps its own light card look from the reference. No progress bar, no
// Skip, and nothing about the intake carries forward from here: leaving
// (Browse the reading library) unmounts this screen entirely the same as
// every other exit from this file, and Change my birthday just returns to
// the still-populated birthday question — nothing was ever cleared.
function MinorGateScreen({ onChangeAge, onBrowseLibrary }) {
  const whatYouCanDo = [
    ['01', 'Talk to someone who can help', 'A parent, guardian, school nurse or your own doctor can look at symptoms with your full history in front of them.'],
    ['02', 'Read, without a profile', 'Our explainers on cycles, sleep and nutrition stay open to everyone. Nothing personalized, nothing stored.'],
    ['03', 'Come back at 18', "We'll still be here, and the quiz takes about six minutes."],
  ];
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', color: INK, fontFamily: "var(--ayna-font-ui)" }}>
      <div style={{ flex: 'none', padding: 'max(16px, env(safe-area-inset-top)) 20px 12px', borderBottom: '1px solid ' + ROW_BORDER, background: CARD_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="ayna-intake-control" aria-label="Change age" onClick={onChangeAge} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid ' + ROW_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: LABEL_GOLD }}>About you</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.8px', color: MUTED, marginTop: 2 }}>Quiz paused</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ padding: '38px 24px 30px', background: `linear-gradient(170deg, ${WARNING_BG}, ${CARD_BG})` }}>
          <div style={{ width: 54, height: 54, borderRadius: 99, background: CARD_BG, border: '1.5px solid ' + WARNING_BORDER_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -10px rgba(180,64,42,.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={WARNING_BORDER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4v5c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V7l8-4z" /><path d="M12 10v3.5" /><path d="M12 16.5h.01" /></svg>
          </div>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: LABEL_GOLD, marginTop: 20 }}>Age requirement</div>
          <div style={{ fontFamily: "var(--ayna-font-display)", fontSize: 'calc(31px * var(--ayna-text-scale, 1))', lineHeight: 1.12, color: INK, marginTop: 9 }}>We can't take you through the quiz</div>
          <p style={{ fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: BODY_TEXT, margin: '12px 0 0' }}>
            ayna is built for people 18 and over. Because the quiz leads to supplement and product guidance, we don't create profiles for minors — that's a conversation for a parent, guardian or clinician who knows your history.
          </p>
        </div>

        <div style={{ padding: '26px 24px 30px' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: INK }}>What you can do now</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13 }}>
            {whatYouCanDo.map(([num, title, body]) => (
              <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '15px 16px', borderRadius: 18, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
                <div style={{ fontFamily: "var(--ayna-font-display)", fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: LABEL_GOLD, flex: 'none', lineHeight: 1.1 }}>{num}</div>
                <div>
                  <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: INK }}>{title}</div>
                  <div style={{ fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: BODY_TEXT, marginTop: 3 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: '15px 16px', borderRadius: 18, background: CARD_BG, border: '1px solid ' + ROW_BORDER }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>Entered the wrong birthday?</div>
            <div style={{ fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: BODY_TEXT, marginTop: 4 }}>Go back one screen and change it — nothing has been saved yet.</div>
          </div>

          <p style={{ fontFamily: 'var(--ayna-font-ui)', fontSize: 'calc(11px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: MUTED, margin: '16px 0 0' }}>
            If you're in immediate distress, contact a local emergency service or a crisis line rather than waiting on an answer here.
          </p>
        </div>
      </div>

      <div style={{ flex: 'none', padding: '14px 20px max(20px, env(safe-area-inset-bottom))', borderTop: '1px solid ' + ROW_BORDER, background: CARD_BG }}>
        <button type="button" className="ayna-intake-control" onClick={onBrowseLibrary} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', textAlign: 'center', padding: 15, borderRadius: 99, cursor: 'pointer', background: NAVY, color: '#FFFFFF', boxShadow: '0 14px 28px -14px rgba(36,42,82,.65)' }}>
          Browse the reading library
        </button>
        <button type="button" className="ayna-intake-control" onClick={onChangeAge} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', textAlign: 'center', padding: 14, borderRadius: 99, cursor: 'pointer', color: NAVY, border: '1.5px solid ' + NAVY, marginTop: 9 }}>
          Change my birthday
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Main screen --------------------------------- */

export default function IntakeScreen({ onBack, onComplete, initialSnapshot = null, startAtBeginning = false }) {
  const [intake, setIntake] = useState(() => reconstructIntakeFromSnapshot(initialSnapshot));
  const [stepId, setStepId] = useState(() => (import.meta.env.DEV && new URLSearchParams(window.location.search).get('step')) || (startAtBeginning ? 'age' : getFirstIncompleteStepId(initialSnapshot) || 'age'));
  const [search, setSearch] = useState('');
  // Computed once, from how things stood when this resume started — not
  // re-derived as answers change, so a step's flag clears only by actually
  // reaching and completing it, not by something else on the page changing.
  const [flaggedStepIds] = useState(() => new Set(getIncompleteStepIds(initialSnapshot)));
  const [minorGate, setMinorGate] = useState(false);
  const [direction, setDirection] = useState('forward');

  const visibleSteps = useMemo(() => {
    const steps = [
      { id: 'age', section: 'core', title: 'Your age', type: 'age', optional: true },
      { id: 'lifeStage', section: 'core', title: 'Your life stage', type: 'lifeStage', optional: true },
      { id: 'zip', section: 'core', title: 'ZIP code', type: 'zip', optional: true },
      { id: 'support', section: 'support', title: 'What needs support?', type: 'support', optional: true },
      ...(isPeriodRelevant(intake) ? [
        { id: 'periodFlow', section: 'support', title: 'Your period flow', type: 'flow', optional: true },
        { id: 'periodPain', section: 'support', title: 'Your period pain', type: 'pain', optional: true },
      ] : []),
      ...(isUtiRelevant(intake) ? [{ id: 'utiFrequency', section: 'support', title: 'How often?', type: 'utiFrequency', optional: true }] : []),
      ...(isPostpartumRelevant(intake) ? [{ id: 'postpartumTiming', section: 'support', title: 'How long ago?', type: 'postpartumTiming', optional: true }] : []),
      ...(isPregnancyRelevant(intake) ? [{ id: 'pregnancyTrimester', section: 'support', title: 'How far along are you?', type: 'pregnancyTrimester', optional: true }] : []),
      { id: 'conditions', section: 'safety', title: 'Diagnosed with?', subtitle: 'Clinician diagnosed only', type: 'conditions', optional: false },
      { id: 'allergies', section: 'safety', title: 'Allergies or sensitivities?', type: 'allergies', optional: false },
      { id: 'medications', section: 'safety', title: 'Taking anything?', subtitle: 'Medicines + supplements', type: 'medications', optional: false },
      { id: 'products', section: 'history', title: 'What have you tried?', type: 'products', optional: true },
      { id: 'avoidRepeat', section: 'history', title: 'What should we avoid?', type: 'avoidRepeat', optional: true },
      { id: 'safety', section: 'safety', title: 'Anything urgent?', subtitle: 'New or rapidly worsening symptoms', type: 'safety', optional: false },
      { id: 'formats', section: 'preferences', title: 'Preferred formats', type: 'formats', optional: true },
      { id: 'recommendationCount', section: 'preferences', title: 'How many picks?', type: 'recommendationCount', optional: true },
      { id: 'priceRange', section: 'preferences', title: 'Your budget', type: 'price', optional: true },
      { id: 'brandOpenness', section: 'preferences', title: 'New brands?', type: 'brand', optional: true },
      ...(intake.brandOpenness === 'I mostly stick with brands I already trust' || intake.brandOpenness === 'I prefer trusted brands but am open to something new' ? [{ id: 'trustedBrands', section: 'preferences', title: 'Trusted brands', type: 'trustedBrands', optional: true }] : []),
      { id: 'avoidIngredients', section: 'preferences', title: 'On the label', type: 'avoidIngredients', optional: true },
      { id: 'fsaHsa', section: 'preferences', title: 'FSA or HSA?', type: 'fsa', optional: true },
      { id: 'trust', section: 'trust', title: 'Your trust order', type: 'trust', optional: false },
      { id: 'anythingElse', section: 'trust', title: 'Anything else?', type: 'textarea', optional: true },
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
    const next = selectLifeStage(current, value);
    return { ...prev, lifeStageSelections: next, lifeStage: next[0] || '' };
  });
  const addCustomSelection = (key, raw, exclusiveValues = []) => {
    const value = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (value.length < 2) return;
    setIntake((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      const next = [...current.filter((item) => !exclusiveValues.includes(item)), value];
      return key === 'lifeStageSelections' ? { ...prev, [key]: next, lifeStage: next[0] || '' } : { ...prev, [key]: next };
    });
    setSearch('');
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setSearch('');
      setDirection('back');
      setStepId(visibleSteps[currentIndex - 1].id);
    } else if (onBack) onBack();
  };
  const goNext = () => {
    if (step.id === 'age' && isMinorAge(intake.age)) return;
    if (!requiredReady(step.id, intake)) return;
    if (currentIndex >= visibleSteps.length - 1) {
      onComplete(mapIntakeToLegacyQuizProfile(buildSnapshot(intake)));
      return;
    }
    setSearch('');
    setDirection('forward');
    setStepId(visibleSteps[currentIndex + 1].id);
  };

  const selectedLifeStages = getLifeStages(intake);
  const showMidlifeFirst = intake.age !== '' && Number(intake.age) >= 40;
  const lifeStageOptions = showMidlifeFirst
    ? [...MIDLIFE_LIFE_STAGES, ...LIFE_STAGES.filter((item) => !MIDLIFE_LIFE_STAGES.includes(item))]
    : LIFE_STAGES;

  const renderBody = () => {
    if (step.type === 'age') return (
      <AgeDial value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />
    );

    if (step.type === 'lifeStage') return (
      <>
        {showMidlifeFirst && <p className="ip-hint">Midlife stages moved up. Pick only what fits.</p>}
        <SearchableChoices items={lifeStageOptions} selected={selectedLifeStages} onToggle={toggleLifeStage} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('lifeStageSelections', value)} placeholder="Search life stages" layout="grid" labels={LIFE_STAGE_LABELS} glyphs={LIFE_STAGE_GLYPHS} searchable={false} />
        {selectedLifeStages.includes('I am postpartum') && (
          <div className="ip-followup">
            <strong>Breastfeeding right now?</strong>
            <ChipList items={['Yes', 'No', 'Prefer not to say']} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} compact />
          </div>
        )}
        {selectedLifeStages.includes('I am in perimenopause') && (
          <div className="ip-followup">
            <strong>When was your last period?</strong>
            <ChipList items={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => set('perimenopauseLastPeriod', v)} compact />
          </div>
        )}
      </>
    );

    if (step.type === 'zip') return <ZipTicket value={intake.zipcode} onChange={(v) => set('zipcode', v.replace(/\D/g, '').slice(0, 5))} />;

    if (step.type === 'support') return (
      <TopicPicker groups={SUPPORT_GROUPS} selected={intake.supportSelections} search={search} onSearch={setSearch} onToggle={(item) => toggleExclusive('supportSelections', item, ['Nothing right now'])} onAdd={(value) => addCustomSelection('supportSelections', value, ['Nothing right now'])} />
    );

    if (step.type === 'flow') return <LevelMeter options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} shape="drop" />;
    if (step.type === 'pain') return <LevelMeter options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} shape="bar" />;
    if (step.type === 'utiFrequency') return <TrackLine options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
    if (step.type === 'postpartumTiming') return <TrackLine options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />;
    if (step.type === 'pregnancyTrimester') return <TrackLine options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;

    if (step.type === 'conditions') {
      return (
        <SearchableChoices items={['None that I know of', 'Prefer not to say', ...CONDITIONS.filter((item) => !['None that I know of', 'Prefer not to say'].includes(item))]} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('diagnosisSelections', value, ['None that I know of', 'Prefer not to say'])} placeholder="Search conditions" />
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
          <div className="ip-gap">
            <TokenInput values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Type an allergy or sensitivity" suggestions={ALLERGIES} suggestionLimit={8} />
          </div>
        )}
      </>
    );

    if (step.type === 'medications') return (
      <>
        <Segmented options={['Yes', 'No', 'Prefer not to say']} value={intake.takesCurrent} onChange={(v) => set('takesCurrent', v)} />
        {intake.takesCurrent === 'Yes' && (
          <div className="ip-gap">
            <TokenInput values={intake.currentMedicationItems} onChange={(v) => set('currentMedicationItems', v)} placeholder="Medication, supplement, or birth control" suggestions={MEDICATION_SUGGESTIONS} suggestionLimit={10} />
          </div>
        )}
        <p className="ip-callout">Check with a clinician before starting anything new.</p>
      </>
    );

    if (step.type === 'products') return <ProductHistoryBuilder products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
    if (step.type === 'avoidRepeat') return (
      <AddProductBuilder
        values={intake.avoidRepeat}
        onChange={(v) => set('avoidRepeat', v)}
        suggestions={PRODUCT_OR_BRAND_SUGGESTIONS}
        historyNames={[...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))]}
        footerText="These never show up in your picks."
      />
    );
    if (step.type === 'trustedBrands') return <TokenInput values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Type a brand" suggestions={BRAND_SUGGESTIONS} />;

    if (step.type === 'safety') return (
      <>
        <Segmented options={['Yes', 'No', 'Not sure']} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && (
          <div className="ip-alert" role="note">
            <strong><span aria-hidden="true">!</span>Worth a closer look</strong>
            <p>Some new or worsening symptoms need a clinician. ayna helps you discover products and doesn’t diagnose. If it feels urgent or severe, get care promptly.</p>
          </div>
        )}
      </>
    );

    if (step.type === 'formats') return (
      <SearchableChoices items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('preferredFormats', value, ['No preference'])} placeholder="Search formats" layout="grid" icons={FORMAT_ICONS} searchable={false} />
    );

    if (step.type === 'price') {
      const selectedPrices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
      const notAFactor = 'Price is not a major factor for me';
      return (
        <>
          <PriceStacks options={PRICE_RANGES.filter((opt) => opt !== notAFactor)} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <ChipList items={[notAFactor]} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} compact />
          <DotScale label="How often do you spend $75+?" options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(v) => set('largePurchaseFrequency', v)} />
        </>
      );
    }
    if (step.type === 'brand') return <BrandSpectrum options={BRAND_OPENNESS} value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
    if (step.type === 'avoidIngredients') {
      return (
        <SearchableChoices items={AVOID_INGREDIENTS} selected={intake.avoidIngredients} onToggle={(v) => toggleExclusive('avoidIngredients', v, ['No preference'])} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('avoidIngredients', value, ['No preference'])} placeholder="Search ingredients or qualities" />
      );
    }
    if (step.type === 'fsa') return <AccountCards options={FSA_HSA} value={intake.fsaHsaAnswer} onChange={(v) => set('fsaHsaAnswer', v)} />;
    if (step.type === 'recommendationCount') return <RecommendationCountPicker value={intake.recommendedProductsPerArea} onChange={(count) => set('recommendedProductsPerArea', count)} />;
    if (step.type === 'trust') return <TrustPodium order={intake.trustRanking} onChange={(order) => set('trustRanking', order)} onTouch={() => set('trustRankingTouched', true)} />;
    if (step.type === 'textarea') return <StickyNote value={intake.anythingElse} onChange={(v) => set('anythingElse', v)} placeholder="A goal, a worry, something that didn’t work…" prompts={FREE_TEXT_PROMPTS} />;

    return null;
  };

  const countForStep =
    step.id === 'support' ? intake.supportSelections.length :
    step.id === 'conditions' ? intake.diagnosisSelections.length :
    step.id === 'allergies' ? intake.allergyItems.length :
    step.id === 'formats' ? intake.preferredFormats.length :
    step.id === 'avoidIngredients' ? intake.avoidIngredients.length : 0;
  const minorBlocked = step.id === 'age' && isMinorAge(intake.age);
  const ready = requiredReady(step.id, intake) && !minorBlocked;
  const storyTouch = useRef(null);
  const storyWheel = useRef(0);
  const storyAdvance = (direction) => {
    if (direction > 0 && ready) goNext();
    if (direction < 0) goBack();
  };
  const onStoryTouchStart = (event) => {
    storyTouch.current = { x: event.touches[0]?.clientX, y: event.touches[0]?.clientY, target: event.target };
  };
  const onStoryTouchEnd = (event) => {
    const start = storyTouch.current;
    storyTouch.current = null;
    if (!start || start.y == null || start.target?.closest('input, textarea, select, button, .ayna-intake-timeline, [role="slider"], [contenteditable]')) return;
    const deltaX = start.x - event.changedTouches[0]?.clientX;
    const delta = start.y - event.changedTouches[0]?.clientY;
    if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > Math.abs(delta) * 1.3) { storyAdvance(Math.sign(deltaX)); return; }
    const body = event.currentTarget.querySelector('.ip-body');
    if (!body || Math.abs(delta) < 100) return;
    if (delta > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 8) storyAdvance(1);
    if (delta < 0 && body.scrollTop <= 8) storyAdvance(-1);
  };
  const onStoryWheel = (event) => {
    if (event.target.closest('input, textarea, select, [role="listbox"]')) return;
    const body = event.currentTarget.querySelector('.ip-body');
    if (!body) return;
    const atEnd = event.deltaY > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 8;
    const atStart = event.deltaY < 0 && body.scrollTop <= 8;
    if (!atEnd && !atStart) { storyWheel.current = 0; return; }
    storyWheel.current += event.deltaY;
    if (Math.abs(storyWheel.current) > 220) {
      storyAdvance(Math.sign(storyWheel.current));
      storyWheel.current = 0;
    }
  };

  if (minorGate) {
    return <MinorGateScreen onChangeAge={() => setMinorGate(false)} onBrowseLibrary={onBack} />;
  }

  const scene = INTAKE_SCENES[step.id] || { tone: 'peri', art: null };

  return (
    <div className={`ayna-play-intake ip-tone--${scene.tone}`} data-section={step.section} data-step={step.id} data-direction={direction}
      onTouchStart={onStoryTouchStart} onTouchEnd={onStoryTouchEnd} onWheel={onStoryWheel}>
      <IntakeSceneArt art={scene.art} key={`art-${step.id}`} />
      <header className="ip-head">
        <div className="ip-head-row">
          <button type="button" className="ip-round" aria-label="Go back" onClick={goBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          <span className="ip-count" aria-label={`Question ${currentIndex + 1} of ${visibleSteps.length}`}>{String(currentIndex + 1).padStart(2, '0')}<i>/{String(visibleSteps.length).padStart(2, '0')}</i></span>
          {step.optional ? <button type="button" className="ip-skip" onClick={goNext}>Skip</button> : <span className="ip-skip-spacer" />}
        </div>
        <div className="ip-progress" aria-hidden="true">
          {visibleSteps.map((s, i) => <span key={s.id} className={i < currentIndex ? 'is-done' : i === currentIndex ? 'is-now' : ''} />)}
        </div>
      </header>

      <div className="ip-body">
        <div className="ip-question" key={`q-${step.id}`}>
          {scene.label && <span className="ip-label">{scene.label}</span>}
          <h1 className="ip-title">{step.title}</h1>
          {step.subtitle && <p className="ip-subtitle">{step.subtitle}</p>}
          {flaggedStepIds.has(step.id) && <span className="ip-flag">Not answered yet</span>}
          <div className="ip-answer">{renderBody()}</div>
        </div>
      </div>

      <footer className="ip-foot">
        <button type="button" className="ip-next" onClick={goNext} disabled={!ready}>
          <span>{isLast ? 'See my results' : 'Next'}</span>
          {countForStep > 0 && <b>{countForStep}</b>}
          <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
        </button>
      </footer>
    </div>
  );
}
