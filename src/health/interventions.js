/**
 * Intervention classes for the first wedge: recurring period pain, PMS,
 * cycle-linked sleep, plus pain in pregnancy (which is never treated as
 * period cramps). Master prompt sections 3, 15, 16; founder clinical review
 * (Oct 24 2026, binding).
 *
 * The health side decides whether a CLASS is reasonable for her. Shop only
 * ever picks products inside an approved class, through `productsForClass`,
 * and each product must also pass its own label (`productSafety`).
 *
 * Pure data and pure functions. No network, no storage, no model.
 *
 * Gate verdicts, strongest first:
 *   'block'    do not offer it (a "do not use" on the label, FDA advice, or
 *              an ayna safety policy). Removed, with the reason.
 *   'ask'      something that matters is unknown, so we ask first. Unknown
 *              is never treated as safe.
 *   'consult'  the label says "ask a doctor or pharmacist before use".
 *              Shown as information only, led by that instruction.
 *   'pass'     nothing we know of rules it out.
 *
 * Copy rules: plain words, sentence case, no em dashes, no claim the cited
 * page does not make. All care wording needs clinician review
 * (CLINICAL_REVIEW_REQUIRED in decisionEngine.js).
 */

// ─── Sources ──────────────────────────────────────────────────────────────
// Founder rule (Oct 24 2026): clinical claims are checked only against .gov
// sources (MedlinePlus, NIH, NLM/DailyMed, FDA, CDC, womenshealth.gov).
// Product facts and label warnings come from the brand's own official site,
// recorded as the brand's label, never as evidence it works. Every page here
// was re-read on Oct 24 2026 (scratchpad GOV_SOURCES.md has the claim table).
export const SOURCES = {
  medlinePeriodPain: { label: 'MedlinePlus: Painful menstrual periods', url: 'https://medlineplus.gov/ency/article/003150.htm' },
  owhPeriodProblems: { label: 'womenshealth.gov: Period problems', url: 'https://womenshealth.gov/menstrual-cycle/period-problems' },
  ibuprofenLabel: { label: 'DailyMed: Motrin IB (ibuprofen 200 mg) Drug Facts label', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d21129f8-4d96-4e36-bc39-a534306dd77e' },
  // The DailyMed page exists; its Warnings text did not render when checked,
  // so NSAID gate wording is taken from the ibuprofen label and the FDA page.
  naproxenLabel: { label: 'DailyMed: Aleve (naproxen sodium 220 mg) label', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=00ef5b30-71d0-4cb4-84a3-48c67d1cea2a' },
  acetaminophenLabel: { label: 'DailyMed: Tylenol Extra Strength (acetaminophen 500 mg) Drug Facts label', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=fba711c1-4e69-49b0-8994-97c455aebcb2' },
  medlineIbuprofen: { label: 'MedlinePlus: Ibuprofen', url: 'https://medlineplus.gov/druginfo/meds/a682159.html' },
  fdaNsaidPregnancy: { label: 'FDA: Avoid NSAIDs at 20 weeks of pregnancy or later', url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-recommends-avoiding-use-nsaids-pregnancy-20-weeks-or-later-because-they-can-result-low-amniotic' },
  // Brand's own label (not on DailyMed, which lists drugs; FDA only lists
  // device recalls for it). A label, not evidence.
  thermacareLabel: { label: 'ThermaCare HeatWraps Menstrual label (thermacare.com)', url: 'https://www.thermacare.com/product-labels/LBL-00000248-WEB-READY-THERMACARE-MENSTRUAL.PDF' },
  owhExercisePregnancy: { label: 'womenshealth.gov: Staying healthy and safe in pregnancy', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what/staying-healthy-and-safe' },
  cdcMaternalWarningSigns: { label: 'CDC: Urgent maternal warning signs', url: 'https://www.cdc.gov/hearher/maternal-warning-signs/index.html' },
  owhPms: { label: 'womenshealth.gov: Premenstrual syndrome (PMS)', url: 'https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome' },
  medlinePms: { label: 'MedlinePlus: Premenstrual syndrome', url: 'https://medlineplus.gov/ency/article/001505.htm' },
  nhlbiInsomnia: { label: 'NIH NHLBI: Insomnia treatment', url: 'https://www.nhlbi.nih.gov/health/insomnia/treatment' },
  medlineSleepHabits: { label: 'MedlinePlus: Changing your sleep habits', url: 'https://medlineplus.gov/ency/patientinstructions/000757.htm' },
  cdcHeavyBleeding: { label: 'CDC: About heavy menstrual bleeding', url: 'https://www.cdc.gov/female-blood-disorders/about/heavy-menstrual-bleeding.html' },
  medlinePregnancyBleeding: { label: 'MedlinePlus: Vaginal bleeding in pregnancy', url: 'https://medlineplus.gov/ency/article/003264.htm' },
  medlineVaginalBleeding: { label: 'MedlinePlus: Vaginal or uterine bleeding', url: 'https://medlineplus.gov/ency/article/007496.htm' },
  medlineEctopic: { label: 'MedlinePlus: Ectopic pregnancy', url: 'https://medlineplus.gov/ency/article/000895.htm' },
};

// Needs the wedge serves. Ids are internal; labels are what she reads.
export const NEEDS = {
  period_pain: { id: 'period_pain', label: 'period pain' },
  pms: { id: 'pms', label: 'PMS' },
  cycle_sleep: { id: 'cycle_sleep', label: 'sleep around your cycle' },
  // Belly or pelvic pain while pregnant. Never "cramps"; triage comes first.
  pregnancy_pain: { id: 'pregnancy_pain', label: 'pain in pregnancy' },
};

// Intake need ids (src/matching/ontology.js) she chose herself that map to a
// wedge need. Only explicit choices count (section 39).
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
const UNKNOWN_STATES = new Set(['skipped', 'not_sure', 'prefer_not', 'unknown', undefined, null]);
// Steroids and diuretics have no class in src/matching/medications.js, so we
// match common names (ibuprofen label: ask a doctor first with a steroid
// drug or a diuretic).
const STEROID_RE = /\b(prednisone|prednisolone|methylprednisolone|dexamethasone|hydrocortisone|medrol|deltasone|steroid)\b/i;
const DIURETIC_RE = /\b(furosemide|lasix|hydrochlorothiazide|hctz|chlorthalidone|bumetanide|torsemide|diuretic|water pill)\b/i;

// Rheumatoid arthritis has no intake option: free text such as "rheumatoid
// arthritis" maps to the broader 'autoimmune' id. Add a specific id only when
// her own words name it, so a label that says "ask a doctor with rheumatoid
// arthritis" can be checked without treating every autoimmune condition as RA.
const RA_RE = /\brheumatoid\b/i;
function conditionIdsFrom(conditions) {
  const list = Array.isArray(conditions) ? conditions : [];
  const ids = new Set(list.map((c) => c?.id).filter(Boolean));
  if (list.some((c) => RA_RE.test(String(c?.raw || '')))) ids.add('rheumatoid_arthritis');
  return ids;
}

/**
 * Flatten a profile from buildUserProfile (src/matching/userProfile.js) into
 * the facts the gates read. A missing profile means everything is unknown.
 */
export function safetyContextFrom(profile) {
  const s = profile?.safety || null;
  const phys = profile?.physiology || {};
  const meds = Array.isArray(s?.medications) ? s.medications : [];
  const stages = Array.isArray(phys.lifeStages) ? phys.lifeStages : [];
  const rawMeds = meds.map((m) => `${m?.raw || ''} ${m?.generic || ''}`).join(' ');
  const medClasses = new Set(meds.flatMap((m) => m?.all_classes || []));
  if (STEROID_RE.test(rawMeds)) medClasses.add('steroid');
  if (DIURETIC_RE.test(rawMeds)) medClasses.add('diuretic');
  return {
    known: Boolean(s),
    pregnancy: s?.pregnancyStatus || 'unknown', // pregnant | reported | not_indicated | unknown
    trimester: s?.trimester ?? null, // 1 | 2 | 3 | null
    ttc: Boolean(s?.ttc),
    breastfeeding: s?.breastfeeding || 'unknown', // yes | no | unknown
    postpartum: stages.includes('postpartum'),
    menopause: stages.some((st) => st === 'menopause' || st === 'postmenopause'),
    allergyStatus: s?.allergyStatus || 'unknown',
    allergyIds: new Set((s?.allergies || []).map((a) => a?.id).filter(Boolean)),
    medicationsState: s?.medicationsState || 'skipped',
    medClasses,
    medGenerics: new Set(meds.map((m) => m?.generic).filter(Boolean)),
    unrecognizedMeds: meds.filter((m) => m && m.source !== 'life_stage' && !m.recognized && !STEROID_RE.test(m.raw || '') && !DIURETIC_RE.test(m.raw || '')).map((m) => m.raw),
    conditionsState: s?.conditionsState || 'skipped',
    conditionIds: conditionIdsFrom(s?.conditions),
    age: s?.age ?? null,
    underSupportedAge: Boolean(s?.underSupportedAge),
    careFirst: Boolean(s?.careFirst),
    careProminent: Boolean(s?.careProminent),
  };
}
export const isPregnant = (ctx) => ctx.pregnancy === 'pregnant' || ctx.pregnancy === 'reported';

const gate = (verdict, code, reason, source = null, field = null) => ({ verdict, code, reason, source, field });

// ayna safety policy, NOT a regulatory cutoff: OTC labels give directions
// from age 12 ("children under 12: ask a doctor"). ayna adds its own
// boundary of no proactive medicine suggestions under 18.
export const AYNA_POLICY_MIN_AGE_FOR_MEDICINE_INFO = 18;
function underAgePolicy(ctx) {
  return ctx.underSupportedAge
    ? gate('block', 'ayna_policy_under_18', 'ayna safety policy: we do not suggest medicines to anyone under 18. A parent, school nurse, pharmacist or doctor can help.')
    : null;
}
function pregnancyPainGate(ctx, need) {
  return need === 'pregnancy_pain'
    ? gate('block', 'pregnancy_pain_clinician', 'With pain in pregnancy, your midwife or clinician should say which pain relief is right.', SOURCES.medlineIbuprofen)
    : null;
}
function unknownGates(ctx) {
  const out = [];
  if (ctx.pregnancy === 'unknown') out.push(gate('ask', 'pregnancy_unknown', 'We do not know if you could be pregnant, which changes which pain relievers are suitable.', null, 'pregnancy'));
  if (UNKNOWN_STATES.has(ctx.medicationsState)) out.push(gate('ask', 'medications_unknown', 'We do not know which medicines you take, and some do not mix with pain relievers.', null, 'medications'));
  else if (ctx.unrecognizedMeds.length) out.push(gate('consult', 'medications_unrecognized', 'We could not check one of your medicines, so ask a pharmacist first.'));
  if (UNKNOWN_STATES.has(ctx.conditionsState)) out.push(gate('ask', 'conditions_unknown', 'We do not know about health conditions that change which pain relievers are suitable.', null, 'conditions'));
  if (ctx.allergyStatus !== 'yes' && ctx.allergyStatus !== 'no') out.push(gate('ask', 'allergies_unknown', 'We do not know if you have reacted to a pain reliever before.', null, 'allergies'));
  return out;
}

// NSAIDs (ibuprofen, naproxen). Ibuprofen Drug Facts (DailyMed, Motrin IB,
// Oct 2025): "Do not use" if you have ever had an allergic reaction to
// ibuprofen or any other pain reliever/fever reducer; "Ask a doctor before
// use if" the stomach bleeding warning applies (ulcers or bleeding problems,
// a blood thinner or steroid, other NSAIDs) or you have high blood pressure,
// heart disease, liver cirrhosis, kidney disease or asthma, or take a
// diuretic; "Ask a doctor or pharmacist before use if you are" taking aspirin
// for heart attack or stroke, or "taking any other drug" (this covers blood
// pressure medicines); "If pregnant or breast-feeding, ask a health
// professional before use", and not at 20 weeks or later unless a doctor
// directs it. FDA 2020: avoid NSAIDs at 20 weeks or later unless advised.
// MedlinePlus ibuprofen: tell your doctor if you take SSRI or SNRI
// antidepressants, or if you plan to become pregnant.
const NSAID_CONSULT_CONDITIONS = {
  stomach_ulcer: 'a stomach ulcer or stomach bleeding',
  bleeding_disorder: 'a bleeding problem',
  hypertension: 'high blood pressure',
  heart_disease: 'heart disease',
  liver_disease: 'a liver condition',
  kidney_disease: 'kidney disease',
  asthma: 'asthma',
};
const NSAID_CONSULT_MEDS = {
  anticoagulant: { words: 'a blood thinner', source: SOURCES.ibuprofenLabel },
  vitamin_k_antagonist: { words: 'a blood thinner', source: SOURCES.ibuprofenLabel },
  steroid: { words: 'a steroid medicine', source: SOURCES.ibuprofenLabel },
  nsaid: { words: 'another NSAID', source: SOURCES.ibuprofenLabel },
  antiplatelet_salicylate: { words: 'aspirin', source: SOURCES.ibuprofenLabel },
  diuretic: { words: 'a diuretic (water pill)', source: SOURCES.ibuprofenLabel },
  blood_pressure: { words: 'a blood pressure medicine', source: SOURCES.ibuprofenLabel },
  antidepressant: { words: 'an antidepressant', source: SOURCES.medlineIbuprofen },
};
function nsaidGates(ctx, need) {
  const out = [underAgePolicy(ctx), pregnancyPainGate(ctx, need)];
  if (ctx.allergyIds.has('nsaids') || ctx.allergyIds.has('aspirin') || ctx.allergyIds.has('acetaminophen')) {
    out.push(gate('block', 'do_not_use_allergy', 'The label says do not use it if you have ever reacted to a pain reliever or fever reducer.', SOURCES.ibuprofenLabel));
  }
  if (isPregnant(ctx)) {
    if (ctx.trimester === 1) out.push(gate('consult', 'pregnancy_early', 'If pregnant, ask a health professional before use. The FDA says to avoid NSAIDs from 20 weeks unless advised.', SOURCES.fdaNsaidPregnancy));
    // Later or unknown stage: treat as 20 weeks or more (unknown is never safe).
    else out.push(gate('block', 'pregnancy_20_weeks', 'The FDA says to avoid NSAIDs from 20 weeks of pregnancy unless a health professional advises it.', SOURCES.fdaNsaidPregnancy));
  }
  if (ctx.breastfeeding === 'yes') out.push(gate('consult', 'breastfeeding', 'If breastfeeding, ask a health professional before use.', SOURCES.ibuprofenLabel));
  else if (ctx.postpartum && ctx.breastfeeding === 'unknown') out.push(gate('ask', 'breastfeeding_unknown', 'We do not know if you are breastfeeding, which changes this.', null, 'breastfeeding'));
  if (ctx.ttc) out.push(gate('consult', 'ttc', 'You are trying to conceive. MedlinePlus says to tell your doctor if you plan to become pregnant before taking ibuprofen, so ask first.', SOURCES.medlineIbuprofen));
  const conds = Object.keys(NSAID_CONSULT_CONDITIONS).filter((c) => ctx.conditionIds.has(c));
  if (conds.length) out.push(gate('consult', 'ask_doctor_condition', `You have ${listWords(conds.map((c) => NSAID_CONSULT_CONDITIONS[c]))}. The label says ask a doctor before use.`, SOURCES.ibuprofenLabel));
  const meds = Object.keys(NSAID_CONSULT_MEDS).filter((c) => ctx.medClasses.has(c));
  if (meds.length) {
    const words = [...new Set(meds.map((c) => NSAID_CONSULT_MEDS[c].words))];
    out.push(gate('consult', 'ask_doctor_medicine', `You take ${listWords(words)}, which may not mix well with NSAIDs. Ask a doctor or pharmacist first.`, NSAID_CONSULT_MEDS[meds[0]].source));
  }
  out.push(...unknownGates(ctx));
  return out.filter(Boolean);
}

// Acetaminophen (paracetamol). Drug Facts (DailyMed, Tylenol Extra
// Strength, Jul 2025): liver warning (severe liver damage
// with more than directed, with other acetaminophen products, or with 3 or
// more alcoholic drinks a day); "Do not use with any other drug containing
// acetaminophen"; allergy alert; "Ask a doctor before use if you have liver
// disease"; "Ask a doctor or pharmacist before use if you are taking the
// blood thinning drug warfarin"; "If pregnant or breast-feeding, ask a health
// professional before use."
function acetaminophenGates(ctx, need) {
  const out = [underAgePolicy(ctx), pregnancyPainGate(ctx, need)];
  if (ctx.allergyIds.has('acetaminophen')) out.push(gate('block', 'do_not_use_allergy', 'You have reacted to acetaminophen before.', SOURCES.acetaminophenLabel));
  if (ctx.medGenerics.has('acetaminophen')) out.push(gate('block', 'do_not_use_duplicate', 'You already take acetaminophen. The label says do not use it with any other product that contains it.', SOURCES.acetaminophenLabel));
  if (isPregnant(ctx)) out.push(gate('consult', 'pregnancy', 'If pregnant, ask a health professional before use.', SOURCES.acetaminophenLabel));
  if (ctx.breastfeeding === 'yes') out.push(gate('consult', 'breastfeeding', 'If breastfeeding, ask a health professional before use.', SOURCES.acetaminophenLabel));
  if (ctx.conditionIds.has('liver_disease')) out.push(gate('consult', 'ask_doctor_condition', 'You have a liver condition. The label says ask a doctor before use.', SOURCES.acetaminophenLabel));
  if (ctx.medGenerics.has('warfarin') || ctx.medClasses.has('vitamin_k_antagonist')) out.push(gate('consult', 'ask_doctor_medicine', 'You take warfarin. The label says ask a doctor or pharmacist before use.', SOURCES.acetaminophenLabel));
  out.push(...unknownGates(ctx));
  return out.filter(Boolean);
}

// ─── The classes ───────────────────────────────────────────────────────────
// catalog: which products may sit under the class (category list AND, when
// given, the name pattern). productsAllowed false: Shop never attaches any.

export const INTERVENTION_CLASSES = {
  // Source: MedlinePlus 003150 ("Apply a heating pad to your lower belly
  // area"; "Take warm showers or baths"; "Never fall asleep with the heating
  // pad on"). "Hot water bottle" was dropped from the summary (no .gov page
  // we found). "Wrap it in a towel" is kept as ayna policy (a burn
  // precaution), not evidence.
  // Pregnancy: left out as advice. The review allows only low-temperature
  // heat after triage, and we could not verify that guidance ourselves, so
  // we leave it out ("or leave it out if unsure"). Heat PRODUCTS also follow
  // their own label (productSafety).
  heat: {
    id: 'heat',
    label: 'Heat',
    drugClass: null,
    summary: 'A heating pad on your lower belly can ease period cramps. A warm bath or shower can help too.',
    caution: 'Wrap it in a towel and never fall asleep with it on.',
    needs: ['period_pain'],
    sources: [SOURCES.medlinePeriodPain],
    followUpDays: 28,
    productsAllowed: true,
    catalog: { categories: ['cramp-relief'], nameRegex: /heat|thermacare/i },
    gates: (ctx) => [isPregnant(ctx) ? gate('block', 'pregnancy_heat_not_reviewed', 'We leave heat suggestions out in pregnancy until a clinician has reviewed them. Your midwife can advise.') : null].filter(Boolean),
  },

  // Information only, never products. Sources: MedlinePlus 003150 (try an
  // OTC anti-inflammatory such as ibuprofen or naproxen; start the day before
  // your period is expected); womenshealth.gov period problems ("A majority
  // of period pain can be relieved by" OTC NSAIDs); ibuprofen Drug Facts;
  // FDA 2020; MedlinePlus ibuprofen. The Cochrane NSAID review (Marjoribanks
  // 2015, PubMed 26224322) is not cited: PubMed could not be read to verify it.
  nsaid_pain_relief: {
    id: 'nsaid_pain_relief',
    label: 'Ibuprofen or naproxen (NSAIDs)',
    drugClass: 'nsaid',
    summary: 'NSAID pain relievers such as ibuprofen and naproxen are a common first option for period pain. Some people start the day before their period is due.',
    caution: 'Follow the label. Do not take two NSAIDs together.',
    needs: ['period_pain', 'pms', 'pregnancy_pain'],
    sources: [SOURCES.medlinePeriodPain, SOURCES.owhPeriodProblems, SOURCES.ibuprofenLabel, SOURCES.naproxenLabel, SOURCES.fdaNsaidPregnancy, SOURCES.medlineIbuprofen],
    followUpDays: 28,
    informationOnly: true,
    productsAllowed: false,
    catalog: { categories: ['medication'], nameRegex: /ibuprofen|naproxen|advil|aleve|motrin/i },
    gates: nsaidGates,
  },

  // Information only, never products. Source: acetaminophen Drug Facts
  // (DailyMed). The old line "tends to work less well than ibuprofen for
  // period pain" (NHS) was removed: no .gov page we could read says it.
  acetaminophen_pain_relief: {
    id: 'acetaminophen_pain_relief',
    label: 'Acetaminophen (paracetamol)',
    drugClass: 'acetaminophen',
    summary: 'Acetaminophen can ease pain.',
    caution: 'Follow the label, and do not take it with any other product that contains acetaminophen. If you have 3 or more alcoholic drinks a day, ask a doctor first.',
    needs: ['period_pain', 'pms', 'pregnancy_pain'],
    sources: [SOURCES.acetaminophenLabel],
    followUpDays: 28,
    informationOnly: true,
    productsAllowed: false,
    catalog: { categories: ['medication'], nameRegex: /acetaminophen|paracetamol|tylenol/i },
    gates: acetaminophenGates,
  },

  // Sources: MedlinePlus 003150 ("Walk or exercise regularly, including
  // pelvic rocking exercises"); womenshealth.gov PMS ("Get regular aerobic
  // physical activity throughout the month"); MedlinePlus PMS (regular
  // exercise helps). "Yoga or pilates" as examples is ayna wording, not a
  // .gov claim. The Cochrane exercise review (Armour 2019, PMC6753056) is not
  // cited: PMC could not be read to verify it.
  // Pregnancy: womenshealth.gov ("For most healthy moms-to-be who do not have
  // any pregnancy-related problems, exercise is a safe and valuable habit";
  // walking as an example; stop and contact your provider for vaginal
  // bleeding, fluid leaking, contractions, dizziness or abdominal pain).
  // Replaces the Tommy's summary of ACOG Committee Opinion 804. In pregnancy
  // it is offered only after triage.
  movement: {
    id: 'movement',
    label: 'Gentle movement',
    drugClass: null,
    summary: 'Regular exercise may ease period pain and PMS. Gentle options like walking count.',
    summaryPregnancy: 'Gentle activity like walking is generally safe in an uncomplicated pregnancy and may help you feel better.',
    caution: null,
    cautionPregnancy: 'Stop if it makes the pain worse. Stop and contact your midwife if you get bleeding, leaking fluid, contractions, dizziness or belly pain.',
    needs: ['period_pain', 'pms', 'cycle_sleep', 'pregnancy_pain'],
    sources: [SOURCES.medlinePeriodPain, SOURCES.owhPms, SOURCES.medlinePms],
    sourcesPregnancy: [SOURCES.owhExercisePregnancy],
    followUpDays: 56,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },

  // Sources: NIH NHLBI insomnia ("Go to sleep and wake up around the same
  // time"; "Follow a routine that helps you wind down and relax before bed";
  // "Sleep in a cool, quiet, dark place"); MedlinePlus sleep habits (same);
  // womenshealth.gov PMS ("about eight hours of sleep each night"). Neither
  // page gives "for an hour", so that was removed from the summary.
  sleep_routine: {
    id: 'sleep_routine',
    label: 'A steady sleep routine',
    drugClass: null,
    summary: 'Going to bed and waking up at the same time, winding down before bed and keeping the room dark and quiet can help sleep.',
    caution: null,
    needs: ['cycle_sleep', 'pms'],
    sources: [SOURCES.nhlbiInsomnia, SOURCES.medlineSleepHabits, SOURCES.owhPms],
    followUpDays: 28,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },

  // Sources: womenshealth.gov PMS (PMS is likely when symptoms happen "for at
  // least three menstrual cycles in a row"); MedlinePlus PMS ("Keep a daily
  // diary or log for at least 3 months"). Changed from two cycles (NHS),
  // which the .gov pages contradict.
  tracking: {
    id: 'tracking',
    label: 'Track it for three cycles',
    drugClass: null,
    summary: 'Logging symptoms for at least three cycles shows whether they follow your cycle, and gives a clinician something clear to look at.',
    summaryPregnancy: 'Noting when the pain comes, how strong it is and anything that comes with it gives your midwife something clear to look at.',
    caution: null,
    needs: ['period_pain', 'pms', 'cycle_sleep', 'pregnancy_pain'],
    sources: [SOURCES.owhPms, SOURCES.medlinePms],
    followUpDays: 84,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },

  // Care competes as an action (section 18). Its rules live in decisionEngine.js.
  care: {
    id: 'care',
    label: 'See a clinician',
    drugClass: null,
    summary: 'A GP, gynecologist or nurse can look for a cause and offer treatments you cannot get on your own.',
    caution: null,
    needs: ['period_pain', 'pms', 'cycle_sleep', 'pregnancy_pain'],
    sources: [SOURCES.medlinePeriodPain, SOURCES.owhPeriodProblems, SOURCES.medlinePms, SOURCES.medlineSleepHabits],
    followUpDays: 28,
    productsAllowed: false,
    catalog: null,
    gates: () => [],
  },
};

export const CLASS_IDS = Object.keys(INTERVENTION_CLASSES);

/** Order classes are offered in per need. */
export const CLASS_ORDER_BY_NEED = {
  period_pain: ['heat', 'movement', 'nsaid_pain_relief', 'acetaminophen_pain_relief', 'tracking', 'care'],
  pms: ['tracking', 'movement', 'sleep_routine', 'nsaid_pain_relief', 'acetaminophen_pain_relief', 'care'],
  cycle_sleep: ['sleep_routine', 'movement', 'tracking', 'care'],
  // Heat and medicines are evaluated so the reason is recorded; they are always removed here.
  pregnancy_pain: ['movement', 'tracking', 'heat', 'nsaid_pain_relief', 'acetaminophen_pain_relief', 'care'],
};

export function classesForNeed(need) {
  return (CLASS_ORDER_BY_NEED[need] || []).map((id) => INTERVENTION_CLASSES[id]).filter(Boolean);
}

const RANK = { block: 3, ask: 2, consult: 1, pass: 0 };
/**
 * Run a class's gates for a need. Returns
 *   { verdict: 'pass'|'consult'|'ask'|'block', blocks, asks, consults }.
 */
export function evaluateClassSafety(classId, ctxOrProfile, need = null) {
  const cls = INTERVENTION_CLASSES[classId];
  if (!cls) return { verdict: 'block', blocks: [gate('block', 'unknown_class', 'Unknown intervention class.')], asks: [], consults: [] };
  const ctx = toCtx(ctxOrProfile);
  const results = cls.gates(ctx, need).filter(Boolean);
  const verdict = results.reduce((v, r) => (RANK[r.verdict] > RANK[v] ? r.verdict : v), 'pass');
  return {
    verdict,
    blocks: results.filter((r) => r.verdict === 'block'),
    asks: results.filter((r) => r.verdict === 'ask'),
    consults: results.filter((r) => r.verdict === 'consult'),
  };
}

// ─── Product labels ────────────────────────────────────────────────────────
// What a specific product's own label says. A product is held back when its
// label says "ask a doctor before use" for something she has, because ayna
// cannot be that doctor. Reasons are label-based, never "heat is unsafe".
export const PRODUCT_LABEL_RULES = {
  'p-thermacare': {
    source: SOURCES.thermacareLabel,
    // Brand label, re-confirmed on thermacare.com Oct 24 2026: "Ask a doctor
    // before use if you have: DIABETES; poor circulation or heart disease;
    // rheumatoid arthritis; or are pregnant." Poor circulation and rheumatoid
    // arthritis have no intake option, so they come from her typed conditions
    // only (ontology 'poor_circulation'; 'rheumatoid_arthritis' above).
    askDoctorIf: { pregnant: true, conditions: ['diabetes', 'heart_disease', 'poor_circulation', 'rheumatoid_arthritis'] },
    notes: 'Do not wear while sleeping. Do not wear for more than 8 hours in any 24-hour period.',
  },
};

/** { ok, code, reason, source } for one product and her context. */
export function productSafety(product, ctxOrProfile) {
  const ctx = toCtx(ctxOrProfile);
  const rule = PRODUCT_LABEL_RULES[product?.id];
  if (rule) {
    if (rule.askDoctorIf.pregnant && isPregnant(ctx)) return { ok: false, code: 'product_label_pregnancy', reason: 'This product’s label says to ask a doctor before use if pregnant.', source: rule.source };
    const hit = (rule.askDoctorIf.conditions || []).find((c) => ctx.conditionIds.has(c));
    if (hit) return { ok: false, code: 'product_label_condition', reason: 'This product’s label says to ask a doctor before use with a condition you have.', source: rule.source };
    return { ok: true, code: 'ok', reason: '', source: rule.source };
  }
  // A label we have not checked: in pregnancy, leave the product out.
  if (isPregnant(ctx)) return { ok: false, code: 'product_label_not_checked', reason: 'We have not checked this product’s label for pregnancy, so we leave it out.', source: null };
  return { ok: true, code: 'ok', reason: '', source: null };
}

/** Whether a catalog product may sit under this class (category and name only). */
export function productMatchesClass(product, classId) {
  const cls = INTERVENTION_CLASSES[classId];
  if (!cls || !cls.productsAllowed || !cls.catalog || !product) return false;
  const cat = String(product.category || '').toLowerCase();
  if (!cls.catalog.categories.includes(cat)) return false;
  return cls.catalog.nameRegex ? cls.catalog.nameRegex.test(String(product.name || '')) : true;
}

/**
 * Products that may be attached under this class for her: inside the class
 * and passing their own label. `removed` collects label-based removals.
 */
export function productsForClass(products, classId, { ctx = null, limit = 3, removed = null } = {}) {
  const safeCtx = toCtx(ctx);
  const out = [];
  for (const p of Array.isArray(products) ? products : []) {
    if (!productMatchesClass(p, classId)) continue;
    const s = productSafety(p, safeCtx);
    if (!s.ok) {
      if (removed) removed.push({ id: `product:${p.id}`, productId: p.id, classId, reasons: [{ code: s.code, reason: s.reason, source: s.source }] });
      continue;
    }
    if (out.length < limit) out.push(p);
  }
  return out;
}

function toCtx(x) {
  return x && x.allergyIds instanceof Set ? x : safetyContextFrom(x);
}
function listWords(words) {
  const w = words.filter(Boolean);
  if (w.length <= 1) return w[0] || '';
  return `${w.slice(0, -1).join(', ')} and ${w.at(-1)}`;
}
