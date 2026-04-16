export const FLOW_LEVELS = ['light', 'medium', 'heavy', 'very heavy'];

export const CYCLE_STATUSES = ['yes', 'no', 'irregular'];

export const CYCLE_SYMPTOMS = [
  'cramps',
  'bloating',
  'headaches',
  'mood changes',
  'fatigue',
  'clots',
  'spotting',
];

export const DIAGNOSED_CONDITIONS = [
  'PCOS',
  'endometriosis',
  'fibroids',
  'adenomyosis',
  'perimenopause',
  'menopause',
  'thyroid disorder',
  'anemia',
  'vaginismus',
  'vulvodynia',
  'interstitial cystitis',
  'none',
  'other',
];

export const PRODUCT_PREFERENCES = [
  'organic',
  'fragrance-free',
  'vegan',
  'cruelty-free',
  'sustainable/eco-friendly',
  'budget-conscious',
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

export const GOALS = [
  'find safer products',
  'manage symptoms',
  'track my cycle',
  'understand my condition',
  'find a provider',
  'build my health routine',
];

export const CONCERN_AREAS = [
  'Period care (pads, tampons, cups, discs, underwear)',
  'Cramp and pain relief (devices, supplements, heat)',
  'Hormone balance (supplements, lifestyle)',
  'PCOS management (supplements, telehealth, apps)',
  'Endometriosis management (supplements, devices, telehealth)',
  'Fertility and conception (supplements, trackers, telehealth)',
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

const PRIMARY_CONCERN_TO_FRUSTRATION = {
  'Period care (pads, tampons, cups, discs, underwear)': 'Leaks & staining',
  'Cramp and pain relief (devices, supplements, heat)': 'Painful cramps',
  'Hormone balance (supplements, lifestyle)': 'Hormonal bloating',
  'PCOS management (supplements, telehealth, apps)': 'PCOS symptoms',
  'Endometriosis management (supplements, devices, telehealth)': 'Endometriosis',
  'Fertility and conception (supplements, trackers, telehealth)': 'Fertility / TTC',
  'UTI support': 'Recurrent UTIs',
  'STI support': 'General discomfort',
  'Gut and vaginal health (probiotics, pH balance)': 'Recurrent UTIs',
  'Perimenopause and menopause support': 'Menopause symptoms',
  'Sexual health and comfort (lubricants, pelvic floor)': 'Pelvic pain',
  'Mental health and cycle mood support': 'General discomfort',
  'Sleep and energy': 'General discomfort',
  'Skin and hair (hormone-related)': 'Hormonal bloating',
  'Telehealth and provider matching': 'General discomfort',
};

const GOAL_TO_FRUSTRATION = {
  'find safer products': 'General discomfort',
  'manage symptoms': 'General discomfort',
  'track my cycle': 'Irregular cycles',
  'understand my condition': 'General discomfort',
  'find a provider': 'General discomfort',
  'build my health routine': 'General discomfort',
};

function inferFrustrationsFromFreeTextConcerns(textItems = []) {
  const joined = textItems.join(' ').toLowerCase();
  const out = new Set();
  if (/heavy|bleeding a lot|flooding/.test(joined)) out.add('Heavy flow');
  if (/leak|stain|spot through|bleed through/.test(joined)) out.add('Leaks & staining');
  if (/cramp|pain/.test(joined)) out.add('Painful cramps');
  if (/bloat/.test(joined)) out.add('Hormonal bloating');
  if (/irregular|cycle/.test(joined)) out.add('Irregular cycles');
  if (/pcos/.test(joined)) out.add('PCOS symptoms');
  if (/endo/.test(joined)) out.add('Endometriosis');
  if (/fertility|conceive|ttc/.test(joined)) out.add('Fertility / TTC');
  if (/uti|vaginal|gut|ph/.test(joined)) out.add('Recurrent UTIs');
  if (/sti|std|sexual infection/.test(joined)) out.add('General discomfort');
  if (/menopause|perimenopause/.test(joined)) out.add('Menopause symptoms');
  if (/pelvic|sex|comfort|vaginismus|vulvodynia/.test(joined)) out.add('Pelvic pain');
  if (/provider|doctor|telehealth/.test(joined)) out.add('General discomfort');
  return [...out];
}

export function mapIntakeToLegacyQuizProfile(intake) {
  const frustrations = new Set();
  const concerns = Array.isArray(intake?.primaryConcerns)
    ? intake.primaryConcerns
    : (intake?.primaryConcern ? [intake.primaryConcern] : []);
  concerns.forEach((c) => {
    if (PRIMARY_CONCERN_TO_FRUSTRATION[c]) frustrations.add(PRIMARY_CONCERN_TO_FRUSTRATION[c]);
  });
  (intake?.customConcerns || []).forEach((txt) => {
    inferFrustrationsFromFreeTextConcerns([txt]).forEach((f) => frustrations.add(f));
  });
  (intake?.goals || []).forEach((g) => {
    if (GOAL_TO_FRUSTRATION[g]) frustrations.add(GOAL_TO_FRUSTRATION[g]);
  });
  if ((intake?.conditions || []).includes('PCOS')) frustrations.add('PCOS symptoms');
  if ((intake?.conditions || []).includes('endometriosis')) frustrations.add('Endometriosis');
  if ((intake?.flowLevel || '').toLowerCase().includes('heavy')) frustrations.add('Heavy flow');
  if ((intake?.symptoms || []).includes('cramps')) frustrations.add('Painful cramps');
  if ((intake?.symptoms || []).includes('bloating')) frustrations.add('Hormonal bloating');

  return {
    age: intake?.age || '',
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
  if (goals.length) push(`Goals for using Ayna: ${goals.join('; ')}.`);

  return lines.join('\n');
}
