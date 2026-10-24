/**
 * Intervention classes for the first wedge: recurring period pain, PMS and
 * cycle-linked sleep (master prompt sections 3, 15, 16).
 *
 * The health side decides whether a CLASS is reasonable for her (this file +
 * decisionEngine.js). Shop only ever picks products inside a class that was
 * approved here, through `productMatchesClass` (the firewall in section 15).
 *
 * Pure data and pure functions. No network, no storage, no model.
 *
 * Safety gates return one of:
 *   'pass'  nothing we know of rules it out
 *   'ask'   something that matters is unknown, so we ask first (never "safe")
 *   'block' remove the class for her, with the reason and its source
 *
 * Wording rules: plain words, sentence case, no em dashes, no numbers or
 * claims that the cited page does not make.
 */

// ─── Sources (every user-facing claim below comes from one of these) ───────
export const SOURCES = {
  nhsPeriodPain: { label: 'NHS: Period pain', url: 'https://www.nhs.uk/conditions/period-pain/' },
  medlinePeriodPain: { label: 'MedlinePlus: Painful menstrual periods', url: 'https://medlineplus.gov/ency/article/003150.htm' },
  cochraneExercise: { label: 'Cochrane: Exercise for dysmenorrhoea (Armour 2019)', url: 'https://www.cochrane.org/CD004142/MENSTR_exercise-dysmenorrhoea' },
  cochraneNsaids: { label: 'Cochrane: NSAIDs for dysmenorrhoea (Marjoribanks 2015)', url: 'https://www.cochrane.org/CD001751/MENSTR_nonsteroidal-anti-inflammatory-drugs-for-dysmenorrhoea' },
  nhsIbuprofen: { label: 'NHS: Who can and cannot take ibuprofen', url: 'https://www.nhs.uk/medicines/ibuprofen-for-adults/who-can-and-cannot-take-ibuprofen' },
  fdaNsaidPregnancy: { label: 'FDA: Avoid NSAIDs at 20 weeks of pregnancy or later', url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-recommends-avoiding-use-nsaids-pregnancy-20-weeks-or-later-because-they-can-result-low-amniotic' },
  nhsPms: { label: 'NHS: Premenstrual syndrome (PMS)', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' },
  nhsInsomnia: { label: 'NHS: Insomnia', url: 'https://www.nhs.uk/conditions/insomnia/' },
  nhsPregnancyBleeding: { label: 'nidirect (adapted from NHS): Bleeding and pain in pregnancy', url: 'https://www.nidirect.gov.uk/node/12609' },
  nhsPostmenopausalBleeding: { label: 'NHS: Postmenopausal bleeding', url: 'https://www.nhs.uk/conditions/post-menopausal-bleeding/' },
};

// Needs the wedge serves. Ids are internal; labels are what she reads.
export const NEEDS = {
  period_pain: { id: 'period_pain', label: 'period pain' },
  pms: { id: 'pms', label: 'PMS' },
  cycle_sleep: { id: 'cycle_sleep', label: 'sleep around your cycle' },
};

// Intake need ids (src/matching/ontology.js NEEDS) that she chose herself and
// that map to a wedge need. Only explicit choices count (section 39).
export const INTAKE_NEED_MAP = {
  'pain.menstrual_cramp': 'period_pain',
  'pain.pelvic': 'period_pain',
  'condition_support.endometriosis': 'period_pain',
  'cycle.pms': 'pms',
  'mood.pmdd': 'pms',
  'mood.cycle_related': 'pms',
  'sleep.trouble': 'cycle_sleep',
};

// ─── Safety context ────────────────────────────────────────────────────────

const NSAID_CONDITIONS = {
  kidney_disease: 'a kidney condition',
  stomach_ulcer: 'a stomach ulcer now or in the past',
  bleeding_disorder: 'a bleeding or clotting problem',
  heart_disease: 'a heart condition',
  liver_disease: 'a liver condition',
  hypertension: 'high blood pressure',
  asthma: 'asthma',
};
// Medicine classes (src/matching/medications.js) the NHS ibuprofen page says
// may not mix well: anticoagulants, antidepressants, blood pressure medicines,
// and other NSAIDs (aspirin, naproxen) as duplicate therapy.
const NSAID_MED_CLASSES = {
  anticoagulant: 'a blood thinner',
  vitamin_k_antagonist: 'a blood thinner',
  antidepressant: 'an antidepressant',
  blood_pressure: 'a blood pressure medicine',
  nsaid: 'another anti-inflammatory pain reliever',
  antiplatelet_salicylate: 'aspirin',
};
const NSAID_ALLERGIES = new Set(['nsaids', 'aspirin']);
const UNKNOWN_STATES = new Set(['skipped', 'not_sure', 'prefer_not', 'unknown', undefined, null]);

/**
 * Flatten a profile from buildUserProfile (src/matching/userProfile.js) into
 * the few facts the gates read. A missing profile means everything unknown.
 */
export function safetyContextFrom(profile) {
  const s = profile?.safety || null;
  const phys = profile?.physiology || {};
  const meds = Array.isArray(s?.medications) ? s.medications : [];
  return {
    known: Boolean(s),
    pregnancy: s?.pregnancyStatus || 'unknown', // pregnant | reported | not_indicated | unknown
    ttc: Boolean(s?.ttc),
    breastfeeding: s?.breastfeeding || 'unknown', // yes | no | unknown
    postpartum: Array.isArray(phys.lifeStages) && phys.lifeStages.includes('postpartum'),
    menopause: Array.isArray(phys.lifeStages) && phys.lifeStages.some((st) => st === 'menopause' || st === 'postmenopause'),
    allergyStatus: s?.allergyStatus || 'unknown', // yes | no | unsure | prefer_not | unknown
    allergyIds: new Set((s?.allergies || []).map((a) => a?.id).filter(Boolean)),
    medicationsState: s?.medicationsState || 'skipped',
    medClasses: new Set(meds.flatMap((m) => m?.all_classes || [])),
    unrecognizedMeds: meds.filter((m) => m && m.source !== 'life_stage' && !m.recognized).map((m) => m.raw),
    conditionsState: s?.conditionsState || 'skipped',
    conditionIds: new Set((s?.conditions || []).map((c) => c?.id).filter(Boolean)),
    underSupportedAge: Boolean(s?.underSupportedAge),
    careFirst: Boolean(s?.careFirst),
    careProminent: Boolean(s?.careProminent),
  };
}

const gate = (verdict, code, reason, source = null, field = null) => ({ verdict, code, reason, source, field });

// Pain in pregnancy is not period pain: the period-care classes do not apply,
// and care leads instead (see decisionEngine care rules).
function notInPregnancy(ctx) {
  if (ctx.pregnancy === 'pregnant' || ctx.pregnancy === 'reported') {
    return gate('block', 'pregnancy_not_period_care', 'You said you are pregnant. Pain in pregnancy is something to raise with your midwife or clinician, not treat as period pain.', SOURCES.nhsPregnancyBleeding);
  }
  return gate('pass', 'ok', '');
}

function otcGates(ctx) {
  const out = [];
  if (ctx.underSupportedAge) out.push(gate('block', 'under_supported_age', 'ayna does not give medicine information under 18.'));
  if (ctx.pregnancy === 'pregnant' || ctx.pregnancy === 'reported') {
    out.push(gate('block', 'pregnancy', 'Ibuprofen and similar pain relievers should be avoided in pregnancy unless a doctor or pharmacist advises it.', SOURCES.nhsIbuprofen));
  } else if (ctx.pregnancy === 'unknown') {
    out.push(gate('ask', 'pregnancy_unknown', 'We do not know if you could be pregnant, which changes which pain relievers are suitable.', SOURCES.nhsIbuprofen, 'pregnancy'));
  }
  if (ctx.ttc) out.push(gate('ask', 'ttc', 'You are trying to conceive. The NHS says ibuprofen may not be suitable, so check with a pharmacist first.', SOURCES.nhsIbuprofen, 'ttc'));
  if (ctx.breastfeeding === 'yes') out.push(gate('ask', 'breastfeeding', 'You are breastfeeding. Check with a pharmacist or doctor before using ibuprofen.', SOURCES.nhsIbuprofen, 'breastfeeding'));
  else if (ctx.postpartum && ctx.breastfeeding === 'unknown') out.push(gate('ask', 'breastfeeding_unknown', 'We do not know if you are breastfeeding, which changes this.', SOURCES.nhsIbuprofen, 'breastfeeding'));

  const allergic = [...ctx.allergyIds].filter((id) => NSAID_ALLERGIES.has(id));
  if (allergic.length) out.push(gate('block', 'nsaid_allergy', 'You have reacted to ibuprofen, aspirin or a similar pain reliever before.', SOURCES.nhsIbuprofen));
  else if (ctx.allergyStatus !== 'yes' && ctx.allergyStatus !== 'no') out.push(gate('ask', 'allergies_unknown', 'We do not know if you have reacted to pain relievers before.', SOURCES.nhsIbuprofen, 'allergies'));

  const meds = [...new Set(Object.keys(NSAID_MED_CLASSES).filter((c) => ctx.medClasses.has(c)).map((c) => NSAID_MED_CLASSES[c]))];
  if (meds.length) out.push(gate('block', 'medication_interaction', `You take ${meds.join(' and ')}, which may not mix well with ibuprofen. Ask a pharmacist.`, SOURCES.nhsIbuprofen));
  else if (UNKNOWN_STATES.has(ctx.medicationsState)) out.push(gate('ask', 'medications_unknown', 'We do not know which medicines you take, and some do not mix with ibuprofen.', SOURCES.nhsIbuprofen, 'medications'));
  else if (ctx.unrecognizedMeds.length) out.push(gate('ask', 'medications_unrecognized', 'We could not check one of your medicines, so ask a pharmacist first.', SOURCES.nhsIbuprofen, 'medications'));

  const conds = Object.keys(NSAID_CONDITIONS).filter((c) => ctx.conditionIds.has(c)).map((c) => NSAID_CONDITIONS[c]);
  if (conds.length) out.push(gate('block', 'condition', `You have ${conds.join(' and ')}. Ibuprofen may not be suitable, so ask a doctor or pharmacist.`, SOURCES.nhsIbuprofen));
  else if (UNKNOWN_STATES.has(ctx.conditionsState)) out.push(gate('ask', 'conditions_unknown', 'We do not know about conditions like stomach ulcers, kidney or heart problems, which change this.', SOURCES.nhsIbuprofen, 'conditions'));
  return out;
}

// ─── The classes ───────────────────────────────────────────────────────────
// catalog: which products may sit under the class. A product must match the
// category list AND (when given) the name pattern. productsAllowed false means
// Shop must never attach products, even if some match.

export const INTERVENTION_CLASSES = {
  // Sources: NHS period pain (heat pad or hot water bottle on the tummy,
  // wrapped in a towel; warm bath); MedlinePlus 003150 (heating pad on the
  // lower belly, never fall asleep with it on).
  heat: {
    id: 'heat',
    label: 'Heat',
    summary: 'A heat pad or hot water bottle on your lower belly can ease period cramps. A warm bath or shower can help too.',
    caution: 'Wrap it in a towel and never fall asleep with it on.',
    needs: ['period_pain'],
    sources: [SOURCES.nhsPeriodPain, SOURCES.medlinePeriodPain],
    followUpDays: 35, // one cycle
    productsAllowed: true,
    catalog: { categories: ['cramp-relief'], nameRegex: /heat|thermacare/i },
    gates: (ctx) => [notInPregnancy(ctx)],
  },

  // Information only. Sources: NHS period pain (ibuprofen or aspirin; not
  // for asthma, stomach, kidney or liver problems); MedlinePlus 003150 (start
  // the day before your period is expected); Cochrane CD001751 (NSAIDs work
  // for period pain); NHS ibuprofen (who cannot take it, interactions,
  // pregnancy, breastfeeding); FDA 2020 (NSAIDs at 20 weeks or later).
  otc_pain_relief: {
    id: 'otc_pain_relief',
    label: 'Pain relievers from a pharmacy',
    summary: 'Anti-inflammatory pain relievers such as ibuprofen are a common first option for period pain. Some people start the day before their period is due.',
    caution: 'Follow the label, and ask a pharmacist if you take other medicines or have a health condition.',
    needs: ['period_pain', 'pms'],
    sources: [SOURCES.nhsPeriodPain, SOURCES.medlinePeriodPain, SOURCES.cochraneNsaids, SOURCES.nhsIbuprofen, SOURCES.fdaNsaidPregnancy],
    followUpDays: 35,
    informationOnly: true,
    productsAllowed: false,
    catalog: { categories: ['medication'], nameRegex: /ibuprofen|naproxen|advil|aleve/i },
    gates: (ctx) => [notInPregnancy(ctx), ...otcGates(ctx)],
  },

  // Sources: Cochrane CD004142 (exercise may reduce period pain, low
  // certainty; often 45 to 60 minutes, 3 times a week); NHS period pain
  // (keeping active, yoga or pilates); NHS PMS (exercise regularly, yoga);
  // NHS insomnia (exercise during the day, not within 4 hours of bed).
  movement: {
    id: 'movement',
    label: 'Regular movement',
    summary: 'Regular exercise may ease period pain and PMS. Gentle options like walking, yoga or pilates count.',
    caution: null,
    needs: ['period_pain', 'pms', 'cycle_sleep'],
    sources: [SOURCES.cochraneExercise, SOURCES.nhsPeriodPain, SOURCES.nhsPms],
    followUpDays: 70, // two cycles
    productsAllowed: false,
    catalog: null,
    gates: (ctx) => [notInPregnancy(ctx)],
  },

  // Sources: NHS insomnia (same bed and wake time, relax an hour before bed,
  // dark and quiet room, no caffeine or alcohol in the hours before, no
  // screens right before bed); NHS PMS (get plenty of sleep).
  sleep_routine: {
    id: 'sleep_routine',
    label: 'A steady sleep routine',
    summary: 'Going to bed and waking up at the same time, winding down for an hour before bed and keeping the room dark and quiet can help sleep.',
    caution: null,
    needs: ['cycle_sleep', 'pms'],
    sources: [SOURCES.nhsInsomnia, SOURCES.nhsPms],
    followUpDays: 35,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },

  // Source: NHS PMS (keep a diary of your symptoms for at least 2 cycles).
  tracking: {
    id: 'tracking',
    label: 'Track it for two cycles',
    summary: 'Logging symptoms for at least two cycles shows whether they follow your cycle, and gives a clinician something clear to look at.',
    caution: null,
    needs: ['period_pain', 'pms', 'cycle_sleep'],
    sources: [SOURCES.nhsPms],
    followUpDays: 56,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },

  // Care is an action that competes with everything else (section 18).
  // Sources: NHS period pain (see a GP for severe pain, a change in pattern,
  // bleeding between periods, or when painkillers do not work); MedlinePlus
  // 003150 (call if treatment has not helped after 3 months); NHS PMS (see a
  // GP if lifestyle changes have not helped or it affects daily life); NHS
  // insomnia (see a GP if habit changes have not worked or it has lasted
  // months). Red flags: src/data/matching/redFlags.research.json.
  care: {
    id: 'care',
    label: 'See a clinician',
    summary: 'A GP, gynecologist or nurse can look for a cause and offer treatments you cannot get on your own.',
    caution: null,
    needs: ['period_pain', 'pms', 'cycle_sleep'],
    sources: [SOURCES.nhsPeriodPain, SOURCES.medlinePeriodPain, SOURCES.nhsPms, SOURCES.nhsInsomnia],
    followUpDays: 28,
    productsAllowed: false,
    // Care services (telehealth) are listed by careResources, not attached as products here.
    catalog: null,
    gates: () => [],
  },
};

export const CLASS_IDS = Object.keys(INTERVENTION_CLASSES);

/** Order classes are offered in per need (most broadly suitable first). */
export const CLASS_ORDER_BY_NEED = {
  period_pain: ['heat', 'movement', 'otc_pain_relief', 'tracking', 'care'],
  pms: ['tracking', 'movement', 'sleep_routine', 'otc_pain_relief', 'care'],
  cycle_sleep: ['sleep_routine', 'movement', 'tracking', 'care'],
};

export function classesForNeed(need) {
  return (CLASS_ORDER_BY_NEED[need] || []).map((id) => INTERVENTION_CLASSES[id]).filter(Boolean);
}

/**
 * Run a class's gates. Returns { verdict: 'pass'|'ask'|'block', blocks, asks }.
 * Any block wins over any ask; any ask wins over pass.
 */
export function evaluateClassSafety(classId, ctxOrProfile) {
  const cls = INTERVENTION_CLASSES[classId];
  if (!cls) return { verdict: 'block', blocks: [gate('block', 'unknown_class', 'Unknown intervention class.')], asks: [] };
  const ctx = ctxOrProfile && ctxOrProfile.allergyIds instanceof Set ? ctxOrProfile : safetyContextFrom(ctxOrProfile);
  const results = cls.gates(ctx).filter(Boolean);
  const blocks = results.filter((r) => r.verdict === 'block');
  const asks = results.filter((r) => r.verdict === 'ask');
  return { verdict: blocks.length ? 'block' : asks.length ? 'ask' : 'pass', blocks, asks };
}

/** Whether a catalog product may sit under this class. */
export function productMatchesClass(product, classId) {
  const cls = INTERVENTION_CLASSES[classId];
  if (!cls || !cls.productsAllowed || !cls.catalog || !product) return false;
  const cat = String(product.category || '').toLowerCase();
  if (!cls.catalog.categories.includes(cat)) return false;
  return cls.catalog.nameRegex ? cls.catalog.nameRegex.test(String(product.name || '')) : true;
}

/** Products from a list that may be attached under this class (empty when the class allows none). */
export function productsForClass(products, classId, limit = 3) {
  return (Array.isArray(products) ? products : []).filter((p) => productMatchesClass(p, classId)).slice(0, limit);
}
