import { canonicalize, needIdForOption } from '../matching/ontology.js';

export const FLOW_LEVELS = ['light', 'medium', 'heavy', 'very heavy'];

export const CYCLE_STATUSES = ['yes', 'no', 'irregular'];

export const CYCLE_SYMPTOMS = [
  'cramps',
  'severe cramps',
  'bloating',
  'headaches',
  'migraines',
  'mood changes',
  'anxiety before period',
  'depression before period',
  'fatigue',
  'brain fog',
  'clots',
  'spotting between periods',
  'breast tenderness',
  'back pain',
  'nausea',
  'diarrhea during period',
  'insomnia before period',
];

export const DIAGNOSED_CONDITIONS = [
  'PCOS',
  'endometriosis',
  'fibroids',
  'adenomyosis',
  'perimenopause',
  'menopause',
  'thyroid disorder (hypothyroid)',
  'thyroid disorder (hyperthyroid)',
  'anemia / iron deficiency',
  'vaginismus',
  'vulvodynia',
  'interstitial cystitis',
  'PMDD',
  'chronic pelvic pain',
  'ovarian cysts',
  'hypothalamic amenorrhea',
  'premature ovarian insufficiency',
  'MTHFR gene variant',
  'none',
  'other',
];

export const PRODUCT_PREFERENCES = [
  'organic',
  'fragrance-free',
  'dye-free',
  'paraben-free',
  'BPA-free',
  'vegan',
  'cruelty-free',
  'sustainable/eco-friendly',
  'budget-conscious',
  'clinically studied ingredients',
  'third-party tested',
  'minimal ingredients',
];

export const PREFERRED_PRODUCT_TYPES = [
  'pads',
  'tampons',
  'menstrual cups',
  'discs',
  'period underwear',
  'supplements',
  'devices',
  'telehealth',
  'apps',
];

export const INSURANCE_TYPES = [
  { value: 'employer_ppo', label: 'Insurance from my job (PPO — can see any doctor)' },
  { value: 'employer_hmo', label: 'Insurance from my job (HMO — pick a main doctor first)' },
  { value: 'marketplace_aca', label: 'Insurance I bought myself (ACA / healthcare.gov plan)' },
  { value: 'medicaid', label: 'Medicaid (free or low-cost insurance)' },
  { value: 'medicare', label: 'Medicare (insurance for people 65+)' },
  { value: 'student', label: 'Student health insurance' },
  { value: 'military', label: 'Military insurance (Tricare)' },
  { value: 'uninsured', label: "I don't have insurance / I pay myself" },
  { value: 'other', label: 'Other' },
];

export const FSA_HSA_OPTIONS = [
  { value: 'fsa', label: 'FSA (Flexible Spending Account)' },
  { value: 'hsa', label: 'HSA (Health Savings Account)' },
  { value: 'both', label: 'Both FSA and HSA' },
  { value: 'none', label: 'Neither' },
  { value: 'unsure', label: 'Not sure' },
];

export const GOALS = [
  'find safer products',
  'manage symptoms',
  'track my cycle',
  'understand my condition',
  'find a provider or specialist',
  'build my health routine',
  'reduce chemical exposure',
  'support fertility / TTC',
  'manage perimenopause or menopause',
  'improve my gut or vaginal health',
  'find mental health support for cycle symptoms',
  'learn what ingredients to avoid for my conditions',
];

// Shared between the quiz (HealthIntakeForm.jsx) and the profile editor
// (HealthProfileEditor.jsx) — the editor used to re-implement these two
// fields as free-text inputs holding the literal word "Yes"/"yes" instead
// of a real select, easy to enter garbage into and easy to misread (found
// live, 2026-08-24 bug bash). One shared vocabulary now, not two that can
// drift apart.
export const CYCLE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'irregular_perimenopause', label: 'Irregular (Perimenopause)' },
  { value: 'no_menopause', label: 'No (Menopause)' },
];
export const TTC_OPTIONS = ['Yes', 'No', 'Not right now'];

export const CONCERN_AREAS = [
  'Period care (pads, tampons, cups, discs, underwear)',
  'Cramp and pain relief (devices, supplements, heat)',
  'Hormone balance (supplements, lifestyle)',
  'Hormonal bloating',
  'PCOS management (supplements, telehealth, apps)',
  'Endometriosis management (supplements, devices, telehealth)',
  'Fertility and conception (supplements, trackers, telehealth)',
  'Pregnancy support (prenatal vitamins, trackers, comfort)',
  'Postpartum recovery (nursing, healing, comfort)',
  'UTI support',
  'STI support',
  'Gut and vaginal health (probiotics, pH balance)',
  'Perimenopause and menopause support',
  'Sexual health and comfort (lubricants, pelvic floor)',
  'Mental health and cycle mood support',
  'Sleep and energy',
  'Skin and hair (hormone-related)',
  'Telehealth and provider matching',
];

export const OTHER_CONCERN_OPTION = 'Other (type your own)';

// Legacy "frustration" labels are still read by older screens (care links,
// articles, check-ins). UI categories are navigation, not causes (ASK2), so
// a frustration is only derived when the answer NAMES that exact thing:
// "Gut and vaginal health" is not "Recurrent UTIs", "Hormone balance" and
// "Skin and hair" are not "Hormonal bloating", "Sexual health" is not
// "Pelvic pain", and "Night sweats" is not "Menopause symptoms".
const PRIMARY_CONCERN_TO_FRUSTRATION = {
  'Period care (pads, tampons, cups, discs, underwear)': 'Leaks & staining',
  'Cramp and pain relief (devices, supplements, heat)': 'Painful cramps',
  'Hormonal bloating': 'Hormonal bloating',
  'PCOS management (supplements, telehealth, apps)': 'PCOS symptoms',
  'Endometriosis management (supplements, devices, telehealth)': 'Endometriosis',
  'Fertility and conception (supplements, trackers, telehealth)': 'Fertility / TTC',
  'Pregnancy support (prenatal vitamins, trackers, comfort)': 'Pregnancy',
  'Postpartum recovery (nursing, healing, comfort)': 'Postpartum recovery',
  'UTI support': 'Recurrent UTIs',
  'Perimenopause and menopause support': 'Menopause symptoms',
};

// Current "What needs support?" answers, one specific need each. Only exact
// equivalents get a legacy label; everything else stays unlabeled.
const SUPPORT_ITEM_TO_FRUSTRATION = {
  'Heavy periods': 'Heavy flow',
  'Cramps or period pain': 'Painful cramps',
  'Cycle-related bloating': 'Hormonal bloating',
  'Irregular periods': 'Irregular cycles',
  'Recurrent UTI-like symptoms': 'Recurrent UTIs',
  'PCOS support': 'PCOS symptoms',
  'Pelvic pain': 'Pelvic pain',
  'Menopause-related body changes': 'Menopause symptoms',
  'Endometriosis support': 'Endometriosis',
  'Trying to conceive': 'Fertility / TTC',
  'Fertility support': 'Fertility / TTC',
  'Prenatal or pregnancy support': 'Pregnancy',
  'Pregnancy-related discomfort': 'Pregnancy',
  'Postpartum recovery': 'Postpartum recovery',
  'Bladder leakage or incontinence': 'Urinary incontinence',
};
// The same, by engine need id (for typed concerns).
const NEED_TO_FRUSTRATION = {
  'period.heavy': 'Heavy flow', 'pain.menstrual_cramp': 'Painful cramps', 'bloating.cycle_related': 'Hormonal bloating',
  'cycle.irregular': 'Irregular cycles', 'urinary.recurrent_uti': 'Recurrent UTIs', 'condition_support.pcos': 'PCOS symptoms',
  'pain.pelvic': 'Pelvic pain', 'menopause.body_changes': 'Menopause symptoms', 'condition_support.endometriosis': 'Endometriosis',
  'fertility.ttc': 'Fertility / TTC', 'fertility.support': 'Fertility / TTC', 'pregnancy.prenatal': 'Pregnancy', 'pregnancy.discomfort': 'Pregnancy',
  'postpartum.recovery': 'Postpartum recovery', 'urinary.incontinence': 'Urinary incontinence',
};
const STAGE_TO_FRUSTRATION = { perimenopause: 'Menopause symptoms', menopause: 'Menopause symptoms', postmenopause: 'Menopause symptoms' };

const GOAL_TO_FRUSTRATION = {
  'find safer products': 'General discomfort',
  'manage symptoms': 'General discomfort',
  'track my cycle': 'Irregular cycles',
  'understand my condition': 'General discomfort',
  'find a provider or specialist': 'General discomfort',
  'build my health routine': 'General discomfort',
};

/**
 * Typed concerns -> legacy frustration labels, through the matching
 * ontology (specific needs and explicit life stages only). "vaginal",
 * "gut", "pain" or "cycle" alone no longer map to UTIs, cramps or
 * irregular cycles.
 */
function inferFrustrationsFromFreeTextConcerns(textItems = []) {
  const out = new Set();
  for (const text of textItems) {
    const c = canonicalize(text, { kinds: ['need', 'condition', 'life_stage'] });
    if (!c.canonical_id || c.confidence < 0.85 || c.contextual_only) continue;
    if (c.kind === 'need' && NEED_TO_FRUSTRATION[c.canonical_id]) out.add(NEED_TO_FRUSTRATION[c.canonical_id]);
    if (c.kind === 'condition' && c.canonical_id === 'pcos') out.add('PCOS symptoms');
    if (c.kind === 'condition' && c.canonical_id === 'endometriosis') out.add('Endometriosis');
    if (c.kind === 'life_stage' && STAGE_TO_FRUSTRATION[c.canonical_id]) out.add(STAGE_TO_FRUSTRATION[c.canonical_id]);
  }
  return [...out];
}

export function mapIntakeToLegacyQuizProfile(intake) {
  const frustrations = new Set();
  const concerns = Array.isArray(intake?.primaryConcerns)
    ? intake.primaryConcerns
    : (intake?.primaryConcern ? [intake.primaryConcern] : []);
  const support = Array.isArray(intake?.supportSelections) ? intake.supportSelections.filter(Boolean) : [];
  if (support.length) {
    // Current intake: each answer is its own need. The broad concern areas
    // generated from it (buildSnapshot) are UI groupings and are not used.
    support.forEach((item) => {
      if (SUPPORT_ITEM_TO_FRUSTRATION[item]) frustrations.add(SUPPORT_ITEM_TO_FRUSTRATION[item]);
      else if (!needIdForOption(item)) inferFrustrationsFromFreeTextConcerns([item]).forEach((f) => frustrations.add(f));
    });
    (Array.isArray(intake?.lifeStageSelections) ? intake.lifeStageSelections : []).forEach((stage) => {
      if (/perimenopause|menopause|post-menopause/i.test(stage)) frustrations.add('Menopause symptoms');
    });
  } else {
    concerns.forEach((c) => {
      if (PRIMARY_CONCERN_TO_FRUSTRATION[c]) frustrations.add(PRIMARY_CONCERN_TO_FRUSTRATION[c]);
    });
  }
  (intake?.customConcerns || []).forEach((txt) => {
    if (support.includes(txt)) return;
    inferFrustrationsFromFreeTextConcerns([txt]).forEach((f) => frustrations.add(f));
  });
  (intake?.goals || []).forEach((g) => {
    if (GOAL_TO_FRUSTRATION[g]) frustrations.add(GOAL_TO_FRUSTRATION[g]);
  });
  if ((intake?.conditions || []).includes('PCOS')) frustrations.add('PCOS symptoms');
  if ((intake?.conditions || []).includes('endometriosis')) frustrations.add('Endometriosis');
  if ((intake?.flowLevel || '').toLowerCase().includes('heavy')) frustrations.add('Heavy flow');
  if ((intake?.symptoms || []).includes('cramps')) frustrations.add('Painful cramps');
  // The generated "bloating" token covers digestive bloating too; only the
  // first quiz's cycle-symptom list (no current support answers) means cycle bloating.
  if (!support.length && (intake?.symptoms || []).includes('bloating')) frustrations.add('Hormonal bloating');

  return {
    age: intake?.age == null || String(intake.age).trim() === '' || Number(intake.age) === 0 ? null : intake.age,
    frustrations: [...frustrations],
    preference: intake?.productPreferences || [],
    currentUse: intake?.preferredProductTypes || [],
    currentProductBrands: intake?.currentProducts || [],
    productsToAvoid: intake?.dislikedProducts || [],
    productsAvoidReason: intake?.dislikedReason || '',
    sensitivities: (intake?.productPreferences || []).includes('fragrance-free') ? ['Fragrance sensitivity'] : [],
    contraceptionUse: intake?.hormonalBirthControl || '',
    contraceptionPreference: intake?.hormonalBirthControlType ? [intake.hormonalBirthControlType] : [],
    primaryConcern: concerns[0] || intake?.primaryConcern || '',
    primaryConcerns: concerns,
    customConcerns: intake?.customConcerns || [],
    personalizationCompleted: intake?.personalizationCompleted === true,
    personalizationCompletedAt: intake?.personalizationCompletedAt || null,
    fullHealthIntake: intake,
  };
}

export function validateHealthIntake(intake) {
  const errors = {};
  if (!intake?.age || Number.isNaN(Number(intake.age))) errors.age = 'Age is required.';
  const concerns = Array.isArray(intake?.primaryConcerns)
    ? intake.primaryConcerns
    : (intake?.primaryConcern ? [intake.primaryConcern] : []);
  if (concerns.length === 0) errors.primaryConcerns = 'Select at least one concern.';
  if (concerns.includes(OTHER_CONCERN_OPTION) && (!Array.isArray(intake?.customConcerns) || intake.customConcerns.length === 0)) {
    errors.customConcernsText = 'Please type your other concern(s).';
  }
  if ((intake?.conditions || []).includes('other') && !String(intake?.conditionOtherText || '').trim()) {
    errors.conditionOtherText = 'Please type your other diagnosed condition.';
  }
  return errors;
}

function concernSlug(concern) {
  return String(concern || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Builds a concise multi-line summary from quiz intake for display and editing in the health profile.
 * @param {object|null|undefined} quizResults - Legacy quiz profile including `fullHealthIntake` when available.
 * @returns {string}
 */
export function buildQuizIntakeSummaryText(quizResults) {
  const intake = quizResults?.fullHealthIntake;
  if (!intake || typeof intake !== 'object') {
    const fr = quizResults?.frustrations;
    if (Array.isArray(fr) && fr.length) {
      return `Focus areas from your assessment: ${fr.join('; ')}.`;
    }
    return '';
  }

  const lines = [];
  const push = (s) => {
    const t = String(s || '').trim();
    if (t) lines.push(t);
  };

  if (intake.age) push(`Age: ${intake.age}.`);
  if (intake.location) push(`Location: ${intake.location}.`);

  const concerns = Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns.filter(Boolean) : [];
  if (concerns.length) push(`Primary focus areas: ${concerns.join('; ')}.`);

  if (Array.isArray(intake.customConcerns) && intake.customConcerns.length) {
    push(`Additional concerns: ${intake.customConcerns.join('; ')}.`);
  }

  const cf = intake.concernFollowups && typeof intake.concernFollowups === 'object' ? intake.concernFollowups : {};
  Object.entries(cf).forEach(([slug, data]) => {
    if (!data || typeof data !== 'object') return;
    const label = concerns.find((c) => concernSlug(c) === slug) || slug.replace(/-/g, ' ');
    const parts = [];
    const sym = data.symptoms;
    if (Array.isArray(sym) && sym.length) {
      const cleaned = sym.filter((s) => s && s !== 'None' && s !== 'Other (type your own)');
      if (cleaned.length) parts.push(`Symptoms: ${cleaned.join(', ')}`);
    }
    if (data.symptomsOtherText) parts.push(`Other symptoms: ${String(data.symptomsOtherText).trim()}`);
    const hist = data.history;
    if (hist && hist !== 'None') parts.push(`Symptom history: ${hist}`);
    if (parts.length) push(`• ${label}: ${parts.join('. ')}.`);
  });

  if (intake.menstrualCycle) push(`Menstrual cycle: ${intake.menstrualCycle}.`);
  if (intake.averageCycleLength) push(`Average cycle length: ${intake.averageCycleLength}.`);
  if (intake.averagePeriodLength) push(`Average period length: ${intake.averagePeriodLength}.`);
  if (intake.flowLevel) push(`Flow: ${intake.flowLevel}.`);
  if (intake.painLevel) push(`Period pain level: ${intake.painLevel}/10.`);

  const cycSym = Array.isArray(intake.symptoms) ? intake.symptoms.filter((s) => s && s !== 'None') : [];
  if (cycSym.length) push(`Cycle-related symptoms: ${cycSym.join(', ')}.`);

  const cond = Array.isArray(intake.conditions) ? intake.conditions.filter((c) => c && c !== 'none') : [];
  if (cond.length) push(`Diagnosed conditions: ${cond.join(', ')}.`);
  if (intake.conditionOtherText) push(`Other condition details: ${String(intake.conditionOtherText).trim()}.`);

  if (intake.tryingToConceive) push(`Trying to conceive: ${intake.tryingToConceive}.`);
  if (intake.hormonalBirthControl) {
    push(
      `Hormonal birth control: ${intake.hormonalBirthControl}${
        intake.hormonalBirthControlType ? ` (${intake.hormonalBirthControlType})` : ''
      }.`
    );
  }

  const prefs = Array.isArray(intake.productPreferences) ? intake.productPreferences.filter((p) => p && p !== 'None') : [];
  if (prefs.length) push(`Product preferences: ${prefs.join(', ')}.`);

  const ptypes = Array.isArray(intake.preferredProductTypes) ? intake.preferredProductTypes.filter((p) => p && p !== 'None') : [];
  if (ptypes.length) push(`Preferred product types: ${ptypes.join(', ')}.`);

  if (Array.isArray(intake.currentProducts) && intake.currentProducts.length) {
    push(`Currently using: ${intake.currentProducts.join(', ')}.`);
  }
  if (Array.isArray(intake.dislikedProducts) && intake.dislikedProducts.length) {
    push(
      `Products that did not work: ${intake.dislikedProducts.join(', ')}${
        intake.dislikedReason ? ` (${intake.dislikedReason})` : ''
      }.`
    );
  }

  const goals = Array.isArray(intake.goals) ? intake.goals.filter((g) => g && g !== 'None') : [];
  if (goals.length) push(`Goals for using ayna: ${goals.join('; ')}.`);

  return lines.join('\n');
}
