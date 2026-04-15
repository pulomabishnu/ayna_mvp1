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
  'Gut and vaginal health (probiotics, pH balance)',
  'Perimenopause and menopause support',
  'Sexual health and comfort (lubricants, pelvic floor)',
  'Mental health and cycle mood support',
  'Sleep and energy',
  'Skin and hair (hormone-related)',
  'Telehealth and provider matching',
];

const PRIMARY_CONCERN_TO_FRUSTRATION = {
  'Period care (pads, tampons, cups, discs, underwear)': 'Heavy flow',
  'Cramp and pain relief (devices, supplements, heat)': 'Painful cramps',
  'Hormone balance (supplements, lifestyle)': 'Hormonal bloating',
  'PCOS management (supplements, telehealth, apps)': 'PCOS symptoms',
  'Endometriosis management (supplements, devices, telehealth)': 'Endometriosis',
  'Fertility and conception (supplements, trackers, telehealth)': 'Fertility / TTC',
  'Gut and vaginal health (probiotics, pH balance)': 'Recurrent UTIs',
  'Perimenopause and menopause support': 'Menopause symptoms',
  'Sexual health and comfort (lubricants, pelvic floor)': 'Pelvic pain',
  'Mental health and cycle mood support': 'General discomfort',
  'Sleep and energy': 'General discomfort',
  'Skin and hair (hormone-related)': 'Hormonal bloating',
  'Telehealth and provider matching': 'Not sure if products are safe',
};

const GOAL_TO_FRUSTRATION = {
  'find safer products': 'Not sure if products are safe',
  'manage symptoms': 'Painful cramps',
  'track my cycle': 'Irregular cycles',
  'understand my condition': 'General discomfort',
  'find a provider': 'General discomfort',
  'build my health routine': 'General discomfort',
};

export function mapIntakeToLegacyQuizProfile(intake) {
  const frustrations = new Set();
  if (intake?.primaryConcern && PRIMARY_CONCERN_TO_FRUSTRATION[intake.primaryConcern]) {
    frustrations.add(PRIMARY_CONCERN_TO_FRUSTRATION[intake.primaryConcern]);
  }
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
    primaryConcern: intake?.primaryConcern || '',
    fullHealthIntake: intake,
  };
}

export function validateHealthIntake(intake) {
  const errors = {};
  if (!intake?.age || Number.isNaN(Number(intake.age))) errors.age = 'Age is required.';
  if (!intake?.primaryConcern) errors.primaryConcern = 'Primary concern is required.';
  return errors;
}
