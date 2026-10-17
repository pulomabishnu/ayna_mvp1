// ayna matching ontology.
//
// The single list of canonical ids the matching engine reasons about:
// health needs (one per "What needs support?" option, never collapsed into a
// broad bucket), conditions, life stages, product formats, values
// ("Should be"), leave-out attributes, allergens.
//
// Plus a deterministic canonicalization pipeline for custom text entries:
//   raw text -> normalization -> rule/synonym match -> ontology id -> confidence
// No network or LLM calls. Every rule is in a readable table below so a
// clinician or PM can review it.
//
// Pure module: no imports from the catalog or UI. Intake option strings are
// copied verbatim from src/mobile/data/intakeModel.js; ontology.test.js
// asserts every intake option is mapped so the two cannot drift silently.

// ─── Health needs ───────────────────────────────────────────────────────────
// id: '<family>.<sub_need>'. `option` is the exact intake answer string.
// `phrase` is used inside user-facing explanations ("Matches the period
// cramps you selected"). `extra: true` marks sub-needs only reachable through
// custom text.
//
// UI CATEGORIES ARE NAVIGATION ONLY. The intake groups options under headers
// such as "Perimenopause + menopause"; those headers have no meaning here.
// `family` is a neutral body-system family (never a cause) and `kind` says
// what sort of answer the option is (see NEED_KINDS). Night sweats is
// 'vasomotor.night_sweats', a symptom, not a menopause need.
export const NEEDS = [
  // Period + cycle
  { id: 'period.product_support', option: 'Period product support', phrase: 'period care', family: 'period' },
  { id: 'pain.menstrual_cramp', option: 'Cramps or period pain', phrase: 'period cramps', family: 'pain' },
  { id: 'pain.pelvic', option: 'Pelvic pain', phrase: 'pelvic pain', family: 'pain' },
  { id: 'period.heavy', option: 'Heavy periods', phrase: 'heavy periods', family: 'period' },
  { id: 'period.light', option: 'Light periods', phrase: 'light periods', family: 'period' },
  { id: 'cycle.irregular', option: 'Irregular periods', phrase: 'irregular periods', family: 'cycle' },
  { id: 'cycle.missed', option: 'Missed periods', phrase: 'missed periods', family: 'cycle' },
  { id: 'cycle.spotting', option: 'Spotting between periods', phrase: 'spotting between periods', family: 'cycle' },
  { id: 'cycle.pms', option: 'PMS symptoms', phrase: 'PMS symptoms', family: 'cycle' },
  { id: 'mood.pmdd', option: 'PMDD symptoms', phrase: 'PMDD symptoms', family: 'mood' },
  { id: 'cycle.breast_tenderness', option: 'Breast tenderness', phrase: 'breast tenderness', family: 'cycle' },
  { id: 'pain.cycle_headache', option: 'Cycle-related headaches or migraines', phrase: 'cycle-related headaches', family: 'pain' },
  // Hormonal + reproductive
  { id: 'condition_support.pcos', option: 'PCOS support', phrase: 'PCOS support', family: 'condition_support' },
  { id: 'condition_support.endometriosis', option: 'Endometriosis support', phrase: 'endometriosis support', family: 'condition_support' },
  { id: 'condition_support.fibroids', option: 'Fibroid-related concerns', phrase: 'fibroid-related concerns', family: 'condition_support' },
  { id: 'condition_support.adenomyosis', option: 'Adenomyosis-related concerns', phrase: 'adenomyosis-related concerns', family: 'condition_support' },
  { id: 'hormonal.general', option: 'Hormone-related symptoms', phrase: 'hormone-related symptoms', family: 'hormonal' },
  { id: 'bloating.cycle_related', option: 'Cycle-related bloating', phrase: 'cycle-related bloating', family: 'bloating' },
  { id: 'digestive.nausea', option: 'Nausea', phrase: 'nausea', family: 'digestive' },
  // Fertility
  { id: 'fertility.support', option: 'Fertility support', phrase: 'fertility support', family: 'fertility' },
  { id: 'fertility.ttc', option: 'Trying to conceive', phrase: 'trying to conceive', family: 'fertility' },
  { id: 'fertility.ovulation_tracking', option: 'Ovulation tracking or support', phrase: 'ovulation tracking', family: 'fertility' },
  // Pregnancy
  { id: 'pregnancy.prenatal', option: 'Prenatal or pregnancy support', phrase: 'prenatal support', family: 'pregnancy' },
  { id: 'pregnancy.discomfort', option: 'Pregnancy-related discomfort', phrase: 'pregnancy discomfort', family: 'pregnancy' },
  { id: 'pregnancy.safe_discovery', option: 'Pregnancy-safe product discovery', phrase: 'pregnancy-focused products', family: 'pregnancy' },
  // Postpartum
  { id: 'postpartum.recovery', option: 'Postpartum recovery', phrase: 'postpartum recovery', family: 'postpartum' },
  { id: 'postpartum.lactation', option: 'Breastfeeding or lactation support', phrase: 'breastfeeding support', family: 'postpartum' },
  { id: 'postpartum.body_skin', option: 'Postpartum body or skin changes', phrase: 'postpartum body and skin changes', family: 'postpartum' },
  // Vaginal health
  { id: 'vaginal.dryness', option: 'Vaginal dryness', phrase: 'vaginal dryness', family: 'vaginal' },
  { id: 'vaginal.irritation', option: 'Vaginal itching or irritation', phrase: 'vaginal itching or irritation', family: 'vaginal' },
  { id: 'vaginal.discharge', option: 'Unusual vaginal discharge', phrase: 'unusual discharge', family: 'vaginal' },
  { id: 'vaginal.odor', option: 'Vaginal odor', phrase: 'vaginal odor', family: 'vaginal' },
  { id: 'vaginal.bv', option: 'BV concerns', phrase: 'BV concerns', family: 'vaginal' },
  { id: 'vaginal.yeast', option: 'Yeast infection concerns', phrase: 'yeast infection concerns', family: 'vaginal' },
  // Urinary health
  { id: 'urinary.burning', option: 'Burning with urination', phrase: 'burning with urination', family: 'urinary' },
  { id: 'urinary.frequency', option: 'Frequent urination', phrase: 'frequent urination', family: 'urinary' },
  { id: 'urinary.urgency', option: 'Urinary urgency', phrase: 'urinary urgency', family: 'urinary' },
  { id: 'urinary.recurrent_uti', option: 'Recurrent UTI-like symptoms', phrase: 'recurrent UTI-like symptoms', family: 'urinary' },
  { id: 'urinary.incontinence', option: 'Bladder leakage or incontinence', phrase: 'bladder leaks', family: 'urinary' },
  // Sexual + reproductive health
  { id: 'pain.sexual', option: 'Pain or discomfort during sex', phrase: 'pain during sex', family: 'pain' },
  { id: 'sexual.libido', option: 'Low libido or libido changes', phrase: 'libido changes', family: 'sexual' },
  { id: 'sexual.wellness', option: 'Sexual wellness or comfort', phrase: 'sexual wellness', family: 'sexual' },
  { id: 'sexual.contraception', option: 'Contraception', phrase: 'contraception', family: 'sexual' },
  { id: 'sexual.sti', option: 'STI-related concerns', phrase: 'STI concerns', family: 'sexual' },
  // Perimenopause + menopause + post-menopause
  { id: 'vasomotor.hot_flashes', option: 'Hot flashes', phrase: 'hot flashes', family: 'vasomotor' },
  { id: 'vasomotor.night_sweats', option: 'Night sweats', phrase: 'night sweats', family: 'vasomotor' },
  { id: 'pain.joint', option: 'Joint aches', phrase: 'joint aches', family: 'pain' },
  { id: 'menopause.body_changes', option: 'Menopause-related body changes', phrase: 'menopause-related body changes', family: 'menopause' },
  // Mood + mental wellbeing
  { id: 'mood.swings', option: 'Mood swings', phrase: 'mood swings', family: 'mood' },
  { id: 'mood.irritability', option: 'Irritability', phrase: 'irritability', family: 'mood' },
  { id: 'mood.general_anxiety', option: 'Anxiety', phrase: 'anxiety', family: 'mood' },
  { id: 'mood.low', option: 'Low mood', phrase: 'low mood', family: 'mood' },
  { id: 'mood.cycle_related', option: 'Cycle-related mood changes', phrase: 'cycle-related mood changes', family: 'mood' },
  // Sleep + energy + cognition
  { id: 'energy.fatigue', option: 'Fatigue or low energy', phrase: 'low energy', family: 'energy' },
  { id: 'sleep.trouble', option: 'Trouble sleeping', phrase: 'trouble sleeping', family: 'sleep' },
  { id: 'cognition.brain_fog', option: 'Brain fog', phrase: 'brain fog', family: 'cognition' },
  { id: 'cognition.concentration', option: 'Difficulty concentrating', phrase: 'trouble concentrating', family: 'cognition' },
  // Digestive health
  { id: 'digestive.constipation', option: 'Constipation', phrase: 'constipation', family: 'digestive' },
  { id: 'digestive.diarrhea', option: 'Diarrhea', phrase: 'diarrhea', family: 'digestive' },
  { id: 'digestive.gas', option: 'Gas', phrase: 'gas', family: 'digestive' },
  { id: 'pain.abdominal', option: 'Abdominal discomfort', phrase: 'abdominal discomfort', family: 'pain' },
  { id: 'bloating.digestive', option: 'Digestive bloating', phrase: 'digestive bloating', family: 'bloating' },
  // Skin + hair
  { id: 'skin.acne', option: 'Acne', phrase: 'acne', family: 'skin' },
  { id: 'hair.loss', option: 'Hair thinning or hair loss', phrase: 'hair thinning', family: 'hair' },
  { id: 'hair.excess', option: 'Excess facial or body hair', phrase: 'excess hair', family: 'hair' },
  { id: 'skin.hormonal', option: 'Hormone-related skin concerns', phrase: 'hormone-related skin concerns', family: 'skin' },
  // Metabolic + physical wellness
  { id: 'metabolic.weight', option: 'Metabolism or weight support', phrase: 'metabolism support', family: 'metabolic' },
  { id: 'fitness.strength', option: 'Strength or fitness', phrase: 'strength and fitness', family: 'fitness' },
  { id: 'bone.health', option: 'Bone health', phrase: 'bone health', family: 'bone' },
  // Care access
  { id: 'care.find_doctor', option: 'Finding a doctor or specialist', phrase: 'finding a doctor', family: 'care' },
  { id: 'care.telehealth', option: 'Finding a telehealth provider', phrase: 'telehealth care', family: 'care' },
  // Sub-needs reachable only through custom text (spec examples).
  { id: 'bloating.pregnancy_related', option: null, phrase: 'pregnancy bloating', family: 'bloating', extra: true },
  { id: 'bloating.unspecified', option: null, phrase: 'bloating', family: 'bloating', extra: true },
  { id: 'pain.postpartum', option: null, phrase: 'postpartum pain', family: 'pain', extra: true },
];

// Intake answers that are not needs.
export const NON_NEED_OPTIONS = new Set(['Nothing right now', 'Something else']);
// Older saved intakes used a different label for the same option.
export const LEGACY_NEED_OPTION_ALIASES = { 'Other hormone-related skin concerns': 'Hormone-related skin concerns' };

// Older saved profiles (the first quiz and the first web intake) only carry
// broad answers. Each maps to the specific needs it NAMED, never to a whole
// family and never to a symptom the answer did not name (UI categories are
// navigation, not causes). Used only when the intake has no current "What
// needs support?" answers, so a current answer is never widened by its
// generated legacy copy. 'General discomfort', 'Not sure if products are
// safe' and broad areas that name no specific need map to nothing.
export const LEGACY_FRUSTRATION_NEEDS = {
  'Heavy flow': ['period.heavy'],
  'Painful cramps': ['pain.menstrual_cramp'],
  'Hormonal bloating': ['bloating.cycle_related'],
  'Irregular cycles': ['cycle.irregular'],
  'Leaks & staining': ['period.product_support'],
  'Recurrent UTIs': ['urinary.recurrent_uti'],
  'PCOS symptoms': ['condition_support.pcos'],
  'Pelvic pain': ['pain.pelvic'],
  // "Menopause symptoms" names menopause, not hot flashes or any other symptom.
  'Menopause symptoms': ['menopause.body_changes'],
  Endometriosis: ['condition_support.endometriosis'],
  'Fertility / TTC': ['fertility.ttc'],
  Pregnancy: ['pregnancy.prenatal'],
  'Postpartum recovery': ['postpartum.recovery'],
  'Urinary incontinence': ['urinary.incontinence'],
  'Bladder leakage': ['urinary.incontinence'],
};
// First web intake "primary concerns" (also generated by buildSnapshot for
// older screens). Keys copied verbatim from recommendationEngine CONCERN_CONFIG.
// Only needs a concern names explicitly. "Gut and vaginal health" names no
// specific need (it used to become BV + odor), so it maps to nothing.
export const LEGACY_CONCERN_NEEDS = {
  'Period care (pads, tampons, cups, discs, underwear)': ['period.product_support'],
  'Cramp and pain relief (devices, supplements, heat)': ['pain.menstrual_cramp'],
  'Hormone balance (supplements, lifestyle)': ['hormonal.general'],
  'Hormonal bloating': ['bloating.cycle_related'],
  'PCOS management (supplements, telehealth, apps)': ['condition_support.pcos'],
  'Endometriosis management (supplements, devices, telehealth)': ['condition_support.endometriosis'],
  'Fertility and conception (supplements, trackers, telehealth)': ['fertility.ttc'],
  'Pregnancy support (prenatal vitamins, trackers, comfort)': ['pregnancy.prenatal'],
  'Postpartum recovery (nursing, healing, comfort)': ['postpartum.recovery'],
  'UTI support': ['urinary.recurrent_uti'],
  'STI support': ['sexual.sti'],
  'Gut and vaginal health (probiotics, pH balance)': [],
  'Perimenopause and menopause support': ['menopause.body_changes'],
  'Sexual health and comfort (lubricants, pelvic floor)': ['sexual.wellness'],
  'Mental health and cycle mood support': ['mood.cycle_related'],
  'Sleep and energy': ['sleep.trouble', 'energy.fatigue'],
  'Skin and hair (hormone-related)': ['skin.hormonal'],
  'Telehealth and provider matching': ['care.telehealth'],
};
// First-quiz symptom tokens. "bloating" does not say cycle or digestive.
export const LEGACY_SYMPTOM_NEEDS = {
  cramps: ['pain.menstrual_cramp'], bloating: ['bloating.unspecified'], nausea: ['digestive.nausea'],
  fatigue: ['energy.fatigue'], 'brain fog': ['cognition.brain_fog'], 'breast tenderness': ['cycle.breast_tenderness'],
};
// First-quiz shopping preferences.
export const LEGACY_PREFERENCE = {
  'Organic/Natural only': { value: 'organic' },
  'Non-hormonal / hormone-free': { leaveOut: 'hormones' },
  'Sustainability/Zero-waste': { value: 'eco_friendly' },
};
// First-quiz sensitivities: allergy-equivalent leave-outs.
export const LEGACY_SENSITIVITY_ALLERGEN = {
  'Fragrance sensitivity': 'fragrance', 'Fragrance / scented products': 'fragrance', 'Essential oils': 'essential_oils',
  'Latex allergy': 'latex', Latex: 'latex',
};

export const NEED_BY_ID = Object.fromEntries(NEEDS.map((n) => [n.id, n]));
export const NEED_ID_BY_OPTION = Object.fromEntries(NEEDS.filter((n) => n.option).map((n) => [n.option, n.id]));
// Ids used before night sweats and hot flashes stopped being filed under
// menopause. Stored seeds / shelves may still carry them.
export const NEED_ID_ALIASES = { 'menopause.hot_flashes': 'vasomotor.hot_flashes', 'menopause.night_sweats': 'vasomotor.night_sweats' };
export function canonicalNeedId(id) { return NEED_ID_ALIASES[id] || id; }

export function needIdForOption(option) {
  const label = LEGACY_NEED_OPTION_ALIASES[option] || option;
  return NEED_ID_BY_OPTION[label] || null;
}
export function needPhrase(needId) {
  const id = canonicalNeedId(needId);
  return NEED_BY_ID[id]?.phrase || String(id || '').split('.').pop().replace(/_/g, ' ');
}

// ─── Answer kinds and contexts ──────────────────────────────────────────────
// What sort of answer each support option is. Symptoms are observations;
// diagnosed conditions (CONDITIONS) and life stages (LIFE_STAGES) are
// separate kinds and are only ever set by an explicit answer.
export const NEED_KINDS = {
  symptom: 'An observation she reported. Never implies a cause, diagnosis or life stage.',
  goal: 'Something she wants to do or get (period products, contraception, fitness).',
  condition_support: 'Support related to a named condition. Not a diagnosis unless she also selected it under "Diagnosed with?".',
  life_stage_need: 'A need she tied to a life stage herself (pregnancy, postpartum, menopause-related body changes).',
  care_access: 'Finding a clinician or telehealth service.',
};

// CONTEXTS: explicit answers that can unlock CONTEXTUAL product
// relationships ("a menopause supplement for night sweats") or add a context
// bonus. A context is active only when she gave it: a life stage she
// selected, a diagnosis she selected, an answer that states it (a pregnancy
// trimester), or a first-person free-text statement. Never from symptoms,
// age, behavior or the UI section an option sits in.
//   stages / conditions: explicit selections that activate it (strength 1)
//   needs: support options that name the context themselves (lower strength,
//          e.g. "Menopause-related body changes" names menopause)
//   phrase: used in explanations ("... and the perimenopause stage you shared")
export const CONTEXTS = {
  menopause_transition: { stages: ['perimenopause', 'menopause', 'postmenopause'], needs: { 'menopause.body_changes': 0.8 }, freeText: ['perimenopause', 'menopause', 'postmenopause'], phrase: 'menopause transition' },
  pregnancy: { stages: ['pregnant'], needs: { 'pregnancy.discomfort': 0.7, 'pregnancy.safe_discovery': 0.6, 'bloating.pregnancy_related': 0.7 }, freeText: ['pregnant'], phrase: 'pregnancy' },
  postpartum: { stages: ['postpartum'], needs: { 'postpartum.recovery': 0.7, 'postpartum.body_skin': 0.7, 'postpartum.lactation': 0.6, 'pain.postpartum': 0.7 }, freeText: ['postpartum'], phrase: 'postpartum' },
  breastfeeding: { stages: ['breastfeeding'], needs: { 'postpartum.lactation': 0.8 }, freeText: ['breastfeeding'], phrase: 'breastfeeding' },
  ttc: { stages: ['ttc'], needs: { 'fertility.ttc': 1 }, freeText: [], phrase: 'trying to conceive' },
  pcos: { conditions: ['pcos'], needs: { 'condition_support.pcos': 0.5 }, freeText: [], phrase: 'PCOS' },
  endometriosis: { conditions: ['endometriosis'], needs: { 'condition_support.endometriosis': 0.5 }, freeText: [], phrase: 'endometriosis' },
  anemia: { conditions: ['anemia'], needs: {}, freeText: [], phrase: 'iron deficiency' },
};

// PER-OPTION AUDIT (founder spec A.18). Every support option, by need id:
//   kind         NEED_KINDS
//   unlocks      contexts that may unlock CONTEXTUAL products for this need
//                (only when she explicitly gave the context)
//   boosts       explicit contexts / diagnoses that may add a small relevance
//                bonus to products relevant to BOTH (never create relevance)
//   prohibited   causes, diagnoses or life stages that must never be inferred
//                from this answer (it stays a symptom: cause = unknown)
//   care         'check' = care information shown more prominently
// Possible real-world contexts (environment, medicines, infection, hormones,
// ...) are deliberately not listed per symptom: they are never assigned.
// Direct / contextual / adjacent product relationships live in
// productProfile.js RELEVANCE_RULES; ENGINE.md has the full table.
const SYM = (o = {}) => ({ kind: 'symptom', unlocks: [], boosts: [], prohibited: [], care: null, ...o });
const GOAL = (o = {}) => ({ kind: 'goal', unlocks: [], boosts: [], prohibited: [], care: null, ...o });
const COND = (o = {}) => ({ kind: 'condition_support', unlocks: [], boosts: [], prohibited: [], care: null, ...o });
const STAGE = (o = {}) => ({ kind: 'life_stage_need', unlocks: [], boosts: [], prohibited: [], care: null, ...o });
export const NEED_POLICY = {
  'period.product_support': GOAL({ prohibited: ['heavy periods', 'any condition'] }),
  'pain.menstrual_cramp': SYM({ boosts: ['endometriosis', 'adenomyosis', 'fibroids'], prohibited: ['endometriosis', 'adenomyosis', 'fibroids'], care: 'severe_pain' }),
  'pain.pelvic': SYM({ unlocks: ['pregnancy'], boosts: ['endometriosis', 'adenomyosis', 'fibroids'], prohibited: ['endometriosis', 'pelvic floor dysfunction', 'infection'], care: 'check' }),
  'period.heavy': SYM({ boosts: ['fibroids', 'adenomyosis', 'endometriosis', 'anemia'], prohibited: ['fibroids', 'adenomyosis', 'iron deficiency'], care: 'very_heavy_flow' }),
  'period.light': SYM({ prohibited: ['pregnancy', 'menopause transition'] }),
  'cycle.irregular': SYM({ unlocks: ['menopause_transition'], boosts: ['pcos', 'menopause_transition'], prohibited: ['pcos', 'perimenopause', 'thyroid condition', 'pregnancy'] }),
  'cycle.missed': SYM({ boosts: ['pcos'], prohibited: ['pregnancy', 'pcos', 'menopause'] }),
  'cycle.spotting': SYM({ prohibited: ['pregnancy', 'any condition'], care: 'check' }),
  'cycle.pms': SYM({ boosts: ['pms'], prohibited: ['pmdd'] }),
  'mood.pmdd': SYM({ boosts: ['pmdd'], prohibited: ['pmdd diagnosis'] }),
  'cycle.breast_tenderness': SYM({ boosts: ['pms'], prohibited: ['pregnancy'] }),
  'pain.cycle_headache': SYM({ prohibited: ['migraine with aura'] }),
  'condition_support.pcos': COND({ boosts: ['pcos'], prohibited: ['pcos diagnosis (unless selected under Diagnosed with?)'] }),
  'condition_support.endometriosis': COND({ boosts: ['endometriosis'], prohibited: ['endometriosis diagnosis'] }),
  'condition_support.fibroids': COND({ prohibited: ['fibroids diagnosis'] }),
  'condition_support.adenomyosis': COND({ prohibited: ['adenomyosis diagnosis'] }),
  'hormonal.general': SYM({ prohibited: ['any condition', 'any life stage'] }),
  'bloating.cycle_related': SYM({ boosts: ['pms', 'endometriosis'], prohibited: ['digestive condition', 'pms', 'endometriosis'] }),
  'digestive.nausea': SYM({ unlocks: ['pregnancy'], prohibited: ['pregnancy'] }),
  'fertility.support': GOAL({ boosts: ['pcos', 'infertility', 'endometriosis'], prohibited: ['infertility'] }),
  'fertility.ttc': GOAL({ boosts: ['pcos', 'infertility', 'endometriosis'], prohibited: ['infertility'] }),
  'fertility.ovulation_tracking': GOAL({ boosts: ['pcos', 'infertility'], prohibited: ['infertility', 'trying to conceive'] }),
  'pregnancy.prenatal': STAGE({ unlocks: ['pregnancy'], prohibited: ['pregnant (may be planning)'] }),
  'pregnancy.discomfort': STAGE({ unlocks: ['pregnancy'] }),
  'pregnancy.safe_discovery': STAGE({ unlocks: ['pregnancy'], prohibited: ['pregnant (may be planning)'] }),
  'postpartum.recovery': STAGE({ unlocks: ['postpartum'] }),
  'postpartum.lactation': STAGE({ unlocks: ['postpartum', 'breastfeeding'] }),
  'postpartum.body_skin': STAGE({ unlocks: ['postpartum'] }),
  'vaginal.dryness': SYM({ unlocks: ['menopause_transition'], boosts: ['menopause_transition'], prohibited: ['menopause', 'perimenopause'] }),
  'vaginal.irritation': SYM({ prohibited: ['yeast infection', 'BV', 'STI'] }),
  'vaginal.discharge': SYM({ prohibited: ['BV', 'yeast infection', 'STI'], care: 'check' }),
  'vaginal.odor': SYM({ prohibited: ['BV', 'infection'] }),
  'vaginal.bv': SYM({ prohibited: ['BV diagnosis'], care: 'check' }),
  'vaginal.yeast': SYM({ prohibited: ['yeast infection diagnosis'] }),
  'urinary.burning': SYM({ prohibited: ['UTI', 'STI'], care: 'check' }),
  'urinary.frequency': SYM({ prohibited: ['UTI', 'diabetes', 'pregnancy', 'overactive bladder'] }),
  'urinary.urgency': SYM({ prohibited: ['UTI', 'overactive bladder'] }),
  'urinary.recurrent_uti': SYM({ prohibited: ['UTI diagnosis'], care: 'uti_frequency' }),
  'urinary.incontinence': SYM({ unlocks: ['postpartum'], prohibited: ['postpartum', 'menopause'] }),
  'pain.sexual': SYM({ boosts: ['endometriosis', 'menopause_transition'], prohibited: ['vaginismus', 'vulvodynia', 'endometriosis', 'menopause'] }),
  'sexual.libido': SYM({ unlocks: ['menopause_transition'], prohibited: ['hormonal issue', 'menopause', 'depression'] }),
  'sexual.wellness': GOAL(),
  'sexual.contraception': GOAL(),
  'sexual.sti': SYM({ prohibited: ['STI diagnosis'], care: 'check' }),
  'vasomotor.hot_flashes': SYM({ unlocks: ['menopause_transition'], prohibited: ['menopause', 'perimenopause', 'thyroid condition'] }),
  'vasomotor.night_sweats': SYM({ unlocks: ['menopause_transition'], prohibited: ['menopause', 'perimenopause', 'infection', 'medication side effect'] }),
  'pain.joint': SYM({ unlocks: ['menopause_transition'], prohibited: ['menopause', 'autoimmune condition'] }),
  'menopause.body_changes': STAGE({ unlocks: ['menopause_transition'] }),
  'mood.swings': SYM({ unlocks: ['menopause_transition'], boosts: ['pmdd', 'pms'], prohibited: ['menopause', 'PMDD', 'mood disorder'] }),
  'mood.irritability': SYM({ boosts: ['pmdd'], prohibited: ['PMDD', 'mood disorder'] }),
  'mood.general_anxiety': SYM({ boosts: ['anxiety'], prohibited: ['anxiety disorder'] }),
  'mood.low': SYM({ boosts: ['depression', 'pmdd'], prohibited: ['depression'] }),
  'mood.cycle_related': SYM({ boosts: ['pmdd', 'pms'], prohibited: ['PMDD'] }),
  'energy.fatigue': SYM({ unlocks: ['anemia'], boosts: ['anemia'], prohibited: ['anemia', 'thyroid condition', 'pregnancy', 'depression', 'menopause'] }),
  'sleep.trouble': SYM({ unlocks: ['menopause_transition', 'pregnancy'], boosts: ['anxiety'], prohibited: ['menopause', 'pregnancy', 'anxiety disorder'] }),
  'cognition.brain_fog': SYM({ unlocks: ['menopause_transition'], prohibited: ['menopause'] }),
  'cognition.concentration': SYM({ unlocks: ['menopause_transition'], prohibited: ['ADHD', 'menopause'] }),
  'digestive.constipation': SYM({ unlocks: ['pregnancy'], boosts: ['ibs_digestive'], prohibited: ['IBS', 'pregnancy'] }),
  'digestive.diarrhea': SYM({ boosts: ['ibs_digestive'], prohibited: ['IBS', 'gut condition'] }),
  'digestive.gas': SYM({ boosts: ['ibs_digestive'], prohibited: ['gut condition'] }),
  'pain.abdominal': SYM({ boosts: ['ibs_digestive'], prohibited: ['endometriosis', 'IBS'] }),
  'bloating.digestive': SYM({ boosts: ['ibs_digestive'], prohibited: ['gut condition', 'IBS'] }),
  'skin.acne': SYM({ unlocks: ['pcos'], boosts: ['pcos'], prohibited: ['pcos', 'hormonal disorder'] }),
  'hair.loss': SYM({ unlocks: ['pcos', 'postpartum', 'menopause_transition'], boosts: ['pcos'], prohibited: ['pcos', 'postpartum', 'menopause', 'thyroid condition', 'iron deficiency'] }),
  'hair.excess': SYM({ unlocks: ['pcos'], boosts: ['pcos'], prohibited: ['pcos'] }),
  'skin.hormonal': SYM({ unlocks: ['pcos'], boosts: ['pcos'], prohibited: ['pcos', 'any condition'] }),
  'metabolic.weight': GOAL({ boosts: ['pcos', 'insulin_resistance', 'diabetes'], prohibited: ['insulin resistance', 'pcos', 'thyroid condition'] }),
  'fitness.strength': GOAL(),
  'bone.health': GOAL({ unlocks: ['menopause_transition'], prohibited: ['menopause', 'osteoporosis'] }),
  'care.find_doctor': { kind: 'care_access', unlocks: [], boosts: [], prohibited: [], care: null },
  'care.telehealth': { kind: 'care_access', unlocks: [], boosts: [], prohibited: [], care: null },
  'bloating.pregnancy_related': STAGE({ unlocks: ['pregnancy'] }),
  'bloating.unspecified': SYM({ prohibited: ['digestive condition', 'cycle-related cause'] }),
  'pain.postpartum': STAGE({ unlocks: ['postpartum'] }),
};
NEEDS.forEach((n) => { n.kind = NEED_POLICY[n.id]?.kind || 'symptom'; });
export function needKind(needId) { return NEED_POLICY[canonicalNeedId(needId)]?.kind || null; }

// Needs where the urinary "How often?" answer applies.
export const URINARY_UTI_NEEDS = new Set(['urinary.burning', 'urinary.frequency', 'urinary.urgency', 'urinary.recurrent_uti']);
// Needs whose products are menstrual products, where flow characteristics apply.
export const MENSTRUAL_PRODUCT_NEEDS = new Set(['period.product_support', 'period.heavy', 'period.light', 'cycle.spotting']);
export const POSTPARTUM_NEEDS = new Set(['postpartum.recovery', 'postpartum.lactation', 'postpartum.body_skin', 'pain.postpartum']);

// ─── Conditions (clinician diagnosed) ──────────────────────────────────────
export const CONDITIONS = [
  { id: 'pcos', option: 'PCOS' },
  { id: 'endometriosis', option: 'Endometriosis' },
  { id: 'fibroids', option: 'Fibroids' },
  { id: 'adenomyosis', option: 'Adenomyosis' },
  { id: 'pms', option: 'PMS' },
  { id: 'pmdd', option: 'PMDD' },
  { id: 'infertility', option: 'Infertility' },
  { id: 'thyroid', option: 'Thyroid condition' },
  { id: 'diabetes', option: 'Diabetes' },
  { id: 'insulin_resistance', option: 'Insulin resistance' },
  { id: 'hypertension', option: 'High blood pressure' },
  { id: 'migraine_with_aura', option: 'Migraine with aura' },
  { id: 'anemia', option: 'Anemia or iron deficiency' },
  { id: 'ibs_digestive', option: 'IBS or another digestive condition' },
  { id: 'autoimmune', option: 'Autoimmune condition' },
  { id: 'anxiety', option: 'Anxiety' },
  { id: 'depression', option: 'Depression' },
  // Safety-relevant conditions (condition research, Oct 17; website intake only).
  { id: 'kidney_disease', option: 'Kidney disease' },
  { id: 'bleeding_disorder', option: 'Bleeding or clotting disorder' },
  { id: 'blood_clot_history', option: 'History of blood clots' },
  { id: 'heart_disease', option: 'Heart disease' },
  { id: 'liver_disease', option: 'Liver disease' },
  { id: 'stomach_ulcer', option: 'Stomach ulcer or stomach bleeding' },
  { id: 'asthma', option: 'Asthma' },
];
export const NON_CONDITION_OPTIONS = new Set(['None that I know of', 'Prefer not to say', 'Other / not listed']);
export const CONDITION_ID_BY_OPTION = Object.fromEntries(CONDITIONS.map((c) => [c.option, c.id]));
// Legacy snapshot `conditions` slugs (buildSnapshot lowercases most options).
export const CONDITION_ID_BY_LEGACY = {
  pcos: 'pcos', endometriosis: 'endometriosis', fibroids: 'fibroids', adenomyosis: 'adenomyosis', pms: 'pms', pmdd: 'pmdd',
  infertility: 'infertility', 'thyroid condition': 'thyroid', diabetes: 'diabetes', 'insulin resistance': 'insulin_resistance',
  'high blood pressure': 'hypertension', 'migraine with aura': 'migraine_with_aura', 'anemia / iron deficiency': 'anemia',
  'anemia or iron deficiency': 'anemia', 'ibs or another digestive condition': 'ibs_digestive',
  'autoimmune condition': 'autoimmune', anxiety: 'anxiety', depression: 'depression',
  'kidney disease': 'kidney_disease',
  'bleeding or clotting disorder': 'bleeding_disorder',
  'history of blood clots': 'blood_clot_history',
  'heart disease': 'heart_disease',
  'liver disease': 'liver_disease',
  'stomach ulcer or stomach bleeding': 'stomach_ulcer',
  'asthma': 'asthma',
};

// Condition-specific need that the condition's own shelf maps to.
export const CONDITION_SUPPORT_NEED = {
  pcos: 'condition_support.pcos',
  endometriosis: 'condition_support.endometriosis',
  fibroids: 'condition_support.fibroids',
  adenomyosis: 'condition_support.adenomyosis',
  pmdd: 'mood.pmdd',
  pms: 'cycle.pms',
};

// CONDITION PATHWAYS (clinician review): "condition + explicit need = high
// relevance". A product that is relevant to BOTH the diagnosed condition and
// the explicitly selected need gets a relevance boost on that need. A
// condition never creates relevance from zero and never creates a shelf.
export const CONDITION_PATHWAYS = {
  pcos: ['skin.acne', 'skin.hormonal', 'hair.loss', 'hair.excess', 'cycle.irregular', 'cycle.missed', 'fertility.ttc', 'fertility.support', 'fertility.ovulation_tracking', 'metabolic.weight'],
  endometriosis: ['pain.menstrual_cramp', 'pain.pelvic', 'pain.sexual', 'period.heavy', 'bloating.cycle_related', 'fertility.ttc'],
  fibroids: ['period.heavy', 'pain.pelvic', 'pain.menstrual_cramp'],
  adenomyosis: ['period.heavy', 'pain.menstrual_cramp', 'pain.pelvic'],
  pmdd: ['mood.cycle_related', 'mood.swings', 'mood.irritability', 'mood.low'],
  pms: ['cycle.pms', 'cycle.breast_tenderness', 'bloating.cycle_related', 'mood.cycle_related'],
  anemia: ['energy.fatigue', 'period.heavy'],
  anxiety: ['mood.general_anxiety', 'sleep.trouble'],
  depression: ['mood.low'],
  ibs_digestive: ['bloating.digestive', 'digestive.constipation', 'digestive.diarrhea', 'digestive.gas', 'pain.abdominal'],
  infertility: ['fertility.support', 'fertility.ttc', 'fertility.ovulation_tracking'],
};

// Cross-answer reinforcement (never a diagnosis): how many PCOS-associated
// needs were selected alongside PCOS support or a PCOS diagnosis.
export const PCOS_REINFORCING_NEEDS = ['skin.acne', 'hair.loss', 'hair.excess', 'cycle.irregular', 'cycle.missed'];

// ─── Life stages ────────────────────────────────────────────────────────────
export const LIFE_STAGES = [
  { id: 'regular_periods', option: 'I get periods regularly', phrase: 'regular periods' },
  { id: 'irregular_periods', option: 'My periods are irregular', phrase: 'irregular periods' },
  { id: 'no_periods', option: 'I do not currently get periods', phrase: 'no current periods' },
  { id: 'hormonal_birth_control', option: 'I use hormonal birth control', phrase: 'hormonal birth control' },
  { id: 'ttc', option: 'I am trying to conceive', phrase: 'trying to conceive' },
  { id: 'pregnant', option: 'I am pregnant', phrase: 'pregnancy' },
  { id: 'postpartum', option: 'I am postpartum', phrase: 'postpartum' },
  { id: 'perimenopause', option: 'I am in perimenopause', phrase: 'perimenopause' },
  { id: 'menopause', option: 'I am in menopause', phrase: 'menopause' },
  { id: 'postmenopause', option: 'I am post-menopause', phrase: 'post-menopause' },
];
export const LIFE_STAGE_ID_BY_OPTION = Object.fromEntries(LIFE_STAGES.map((s) => [s.option, s.id]));
// Short UI labels (LIFE_STAGE_LABELS in intakeModel) also accepted.
Object.assign(LIFE_STAGE_ID_BY_OPTION, {
  'Regular periods': 'regular_periods', 'Irregular periods': 'irregular_periods', 'No periods now': 'no_periods',
  'Hormonal birth control': 'hormonal_birth_control', 'Trying to conceive': 'ttc', Pregnant: 'pregnant',
  Postpartum: 'postpartum', Perimenopause: 'perimenopause', Menopause: 'menopause', 'Post-menopause': 'postmenopause',
});
export const LIFE_STAGE_BY_ID = Object.fromEntries(LIFE_STAGES.map((s) => [s.id, s]));

// LIFE STAGE COMPATIBILITY (clinician review). Pairs not listed are treated
// as compatible. 'needs_clarification' never drops either stage: both are
// kept, stage-based boosts/suppressions for the pair are neutralized, and
// confidence is lowered, so a contradiction cannot produce random picks.
export const LIFE_STAGE_COMPATIBILITY = [
  { stages: ['postpartum', 'breastfeeding'], verdict: 'legit' },
  { stages: ['hormonal_birth_control', 'regular_periods'], verdict: 'legit' },
  { stages: ['hormonal_birth_control', 'no_periods'], verdict: 'legit' },
  { stages: ['ttc', 'irregular_periods'], verdict: 'legit' },
  { stages: ['perimenopause', 'irregular_periods'], verdict: 'legit' },
  { stages: ['pregnant', 'regular_periods'], verdict: 'needs_clarification' },
  { stages: ['menopause', 'regular_periods'], verdict: 'needs_clarification' },
  { stages: ['postmenopause', 'ttc'], verdict: 'needs_clarification' },
  // Same shape as the spec's examples (a stage that rules out the other).
  { stages: ['postmenopause', 'regular_periods'], verdict: 'needs_clarification' },
  { stages: ['menopause', 'ttc'], verdict: 'needs_clarification' },
  { stages: ['regular_periods', 'irregular_periods'], verdict: 'needs_clarification' },
  { stages: ['regular_periods', 'no_periods'], verdict: 'needs_clarification' },
  { stages: ['pregnant', 'ttc'], verdict: 'needs_clarification' },
];

// AGE BANDS (spec Q1). Age is a small prior only; it never infers periods,
// fertility, menopause, sexual activity, pregnancy or PCOS.
export const AGE_BANDS = [
  { id: 'adolescent', min: 13, max: 17 },
  { id: 'emerging_adult', min: 18, max: 24 },
  { id: 'reproductive_age', min: 25, max: 34 },
  { id: 'later_reproductive_transition', min: 35, max: 44 },
  { id: 'midlife_transition', min: 45, max: 54 },
  { id: 'later_midlife', min: 55, max: 64 },
  { id: 'older_adult', min: 65, max: 130 },
];
export function ageBandFor(age) {
  if (!Number.isFinite(age)) return null;
  return AGE_BANDS.find((b) => age >= b.min && age <= b.max)?.id || null;
}
// Age x explicit stage combinations that are unusual (explicit stage still
// wins; this only adds confidenceFlag 'unusual_combination').
export const UNUSUAL_AGE_FOR_STAGE = {
  menopause: (age) => age < 35,
  postmenopause: (age) => age < 35,
  perimenopause: (age) => age < 30,
  pregnant: (age) => age >= 55,
  ttc: (age) => age >= 55,
  regular_periods: (age) => age >= 60,
  postpartum: (age) => age >= 55,
};

// ─── Formats ────────────────────────────────────────────────────────────────
export const FORMATS = [
  { id: 'pill_capsule', option: 'Pills or capsules', phrase: 'pills or capsules' },
  { id: 'gummy', option: 'Gummies', phrase: 'gummies' },
  { id: 'powder', option: 'Powders', phrase: 'powders' },
  { id: 'drink_tea', option: 'Drinks or teas', phrase: 'drinks or teas' },
  { id: 'topical', option: 'Creams, lotions, or gels', phrase: 'creams, lotions, or gels' },
  { id: 'patch', option: 'Patches', phrase: 'patches' },
  { id: 'suppository', option: 'Suppositories', phrase: 'suppositories' },
  { id: 'device', option: 'Devices or wearables', phrase: 'devices or wearables' },
  { id: 'period_care', option: 'Period-care products', phrase: 'period-care products' },
  // Not intake options; used for product profiles.
  { id: 'app_service', option: null, phrase: 'apps and services' },
  { id: 'test_kit', option: null, phrase: 'at-home tests' },
  { id: 'apparel_support', option: null, phrase: 'support garments' },
];
export const FORMAT_ID_BY_OPTION = Object.fromEntries(FORMATS.filter((f) => f.option).map((f) => [f.option, f.id]));
export const FORMAT_BY_ID = Object.fromEntries(FORMATS.map((f) => [f.id, f]));

// ─── "Avoid or must-have?" ──────────────────────────────────────────────────
// Leave out: product attributes (see productProfile SAFETY_ATTRIBUTES).
export const LEAVE_OUT = [
  { option: 'Fragrance', attr: 'fragrance', phrase: 'fragrance' },
  { option: 'Dyes', attr: 'dyes', phrase: 'dyes' },
  { option: 'Parabens', attr: 'parabens', phrase: 'parabens' },
  { option: 'Sulfates', attr: 'sulfates', phrase: 'sulfates' },
  { option: 'Phthalates', attr: 'phthalates', phrase: 'phthalates' },
  { option: 'Latex', attr: 'latex', phrase: 'latex' },
  { option: 'Synthetic materials', attr: 'synthetic_materials', phrase: 'synthetic materials' },
  // intakeModel PREFERENCE_MAP keys this as 'Animal-derived ingredients'
  // while the option is 'Animal-derived', so the legacy pipeline drops it.
  // Both spellings map here.
  { option: 'Animal-derived', attr: 'animal_derived', phrase: 'animal-derived ingredients' },
  { option: 'Animal-derived ingredients', attr: 'animal_derived', phrase: 'animal-derived ingredients' },
  { option: 'Added sugar', attr: 'added_sugar', phrase: 'added sugar' },
  { option: 'Artificial sweeteners', attr: 'artificial_sweeteners', phrase: 'artificial sweeteners' },
  // Legacy "-free" options from AVOID_INGREDIENTS mean the same leave-out.
  { option: 'Fragrance-free', attr: 'fragrance', phrase: 'fragrance' },
  { option: 'Dye-free', attr: 'dyes', phrase: 'dyes' },
  { option: 'Paraben-free', attr: 'parabens', phrase: 'parabens' },
  { option: 'Sulfate-free', attr: 'sulfates', phrase: 'sulfates' },
  { option: 'Latex-free', attr: 'latex', phrase: 'latex' },
];
export const LEAVE_OUT_BY_OPTION = Object.fromEntries(LEAVE_OUT.map((l) => [l.option, l]));
export const ATTRIBUTE_PHRASE = Object.fromEntries(LEAVE_OUT.map((l) => [l.attr, l.phrase]));
Object.assign(ATTRIBUTE_PHRASE, {
  essential_oils: 'essential oils', adhesives: 'adhesives', nickel: 'nickel', preservatives: 'preservatives',
  gluten: 'gluten', soy: 'soy', dairy: 'dairy', hormones: 'hormones', nsaid: 'NSAIDs', aspirin: 'aspirin', acetaminophen: 'acetaminophen',
});

// Should be: values that decide between safe, relevant products.
export const VALUES = [
  { id: 'unscented', option: 'Unscented', phrase: 'unscented' },
  { id: 'organic', option: 'Organic', phrase: 'organic' },
  { id: 'vegan', option: 'Vegan', phrase: 'vegan' },
  { id: 'cruelty_free', option: 'Cruelty-free', phrase: 'cruelty-free' },
  { id: 'minimal_ingredients', option: 'Minimal ingredients', phrase: 'minimal ingredients' },
  { id: 'sensitive_skin', option: 'Sensitive skin', phrase: 'sensitive-skin friendly' },
  { id: 'reusable', option: 'Reusable', phrase: 'reusable' },
  { id: 'eco_friendly', option: 'Eco-friendly', phrase: 'eco-friendly' },
  { id: 'pregnancy_considerations', option: 'Pregnancy considerations', phrase: 'pregnancy considerations' },
  { id: 'black_owned', option: 'Black-owned', phrase: 'Black-owned' },
  { id: 'brown_owned', option: 'Brown-owned', phrase: 'Brown-owned' },
];
export const VALUE_ID_BY_OPTION = Object.fromEntries(VALUES.map((v) => [v.option, v.id]));
export const VALUE_BY_ID = Object.fromEntries(VALUES.map((v) => [v.id, v]));

// ─── Allergies / sensitivities ──────────────────────────────────────────────
// attr: product attribute checked for a hard exclusion. broad: a class too
// vague to exclude on (no single attribute); it lowers confidence and adds a
// "check the label" note on matching formats instead.
export const ALLERGENS = [
  { id: 'latex', option: 'Latex', attr: 'latex' },
  { id: 'fragrance', option: 'Fragrance', attr: 'fragrance' },
  { id: 'adhesives', option: 'Adhesives', attr: 'adhesives' },
  { id: 'nsaids', option: 'NSAIDs such as ibuprofen', attr: 'nsaid' },
  { id: 'acetaminophen', option: 'Acetaminophen', attr: 'acetaminophen' },
  { id: 'aspirin', option: 'Aspirin', attr: 'aspirin' },
  { id: 'antibiotics', option: 'Antibiotics', attr: null, broad: 'prescribed_care' },
  { id: 'hormonal_medications', option: 'Hormonal medications', attr: 'hormones' },
  { id: 'topical_ingredients', option: 'Topical ingredients', attr: null, broad: 'topical' },
  { id: 'supplements_herbal', option: 'Supplements or herbal ingredients', attr: null, broad: 'ingested' },
  { id: 'nickel', option: 'Nickel', attr: 'nickel' },
  { id: 'essential_oils', option: 'Essential oils', attr: 'essential_oils' },
  { id: 'dyes', option: 'Dyes', attr: 'dyes' },
  { id: 'preservatives', option: 'Preservatives', attr: 'preservatives' },
  { id: 'gluten', option: 'Gluten', attr: 'gluten' },
  { id: 'soy', option: 'Soy', attr: 'soy' },
  { id: 'dairy', option: 'Dairy', attr: 'dairy' },
];
export const ALLERGEN_BY_OPTION = Object.fromEntries(ALLERGENS.map((a) => [a.option, a]));
export const ALLERGEN_BY_ID = Object.fromEntries(ALLERGENS.map((a) => [a.id, a]));

// ─── Canonicalization pipeline ──────────────────────────────────────────────

/** Step 1: normalization. Lowercase, unify quotes/dashes, expand common contractions, strip punctuation. */
export function normalizeText(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[–\u2014]/g, '-')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/[^a-z0-9+%$'\-/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Step 2: SYNONYM RULES. Checked in order; first match wins.
// confidence: how sure the mapping is. contextual_only: may inform context
// but never a safety decision or a strong ranking claim. specificity 'low'
// marks vague complaints. Add rules here; keep patterns anchored on words.
export const SYNONYM_RULES = [
  // Conditions
  { re: /^endo$|\bendometriosis\b|\bendo (pain|flare|belly)\b|\bi have endo\b/, kind: 'condition', id: 'endometriosis', confidence: 0.99 },
  { re: /\bpcos\b|\bpolycystic ovar(y|ian)\b|\bpcod\b|\bpmos\b|\bpolyendocrine metabolic ovarian\b/, kind: 'condition', id: 'pcos', confidence: 0.99 },
  { re: /\bpmdd\b|premenstrual dysphoric/, kind: 'condition', id: 'pmdd', confidence: 0.98 },
  { re: /\bfibroids?\b|\bleiomyoma/, kind: 'condition', id: 'fibroids', confidence: 0.97 },
  { re: /\badeno(myosis)?\b/, kind: 'condition', id: 'adenomyosis', confidence: 0.95 },
  { re: /\bhypothyroid|\bhyperthyroid|\bhashimoto|\bgraves\b|\bthyroid\b/, kind: 'condition', id: 'thyroid', confidence: 0.95 },
  { re: /\binsulin resist/, kind: 'condition', id: 'insulin_resistance', confidence: 0.97 },
  { re: /\b(type [12] )?diabet(es|ic)\b/, kind: 'condition', id: 'diabetes', confidence: 0.95 },
  { re: /\bhigh blood pressure\b|\bhypertension\b/, kind: 'condition', id: 'hypertension', confidence: 0.97 },
  { re: /\banemi(a|c)\b|\banaemi|\biron deficien|\blow iron\b|\blow ferritin\b/, kind: 'condition', id: 'anemia', confidence: 0.95 },
  { re: /\bibs\b|irritable bowel|\bcrohn|\bcolitis\b|\bceliac\b/, kind: 'condition', id: 'ibs_digestive', confidence: 0.93 },
  { re: /\blupus\b|\bautoimmune\b|\brheumatoid\b/, kind: 'condition', id: 'autoimmune', confidence: 0.9 },
  // Health needs (sub-need level)
  { re: /\bhair (is )?(falling out|shedding|coming out)\b|\blosing (my )?hair\b|\bhair loss\b|\bthinning hair\b|\bhair thinning\b|\bbald(ing)? spots?\b/, kind: 'need', id: 'hair.loss', confidence: 0.96 },
  { re: /\bchin hair|facial hair|\bhirsut|\bexcess (body )?hair\b/, kind: 'need', id: 'hair.excess', confidence: 0.95 },
  { re: /\b(period |menstrual )?cramps?\b|\bperiod pain\b|\bdysmenorrh/, kind: 'need', id: 'pain.menstrual_cramp', confidence: 0.95 },
  { re: /\bpain(ful)? (during|with|after) sex\b|\bsex (is |was )?(painful|hurts)\b|\bdyspareunia\b|\bvaginismus\b/, kind: 'need', id: 'pain.sexual', confidence: 0.96 },
  { re: /\bpelvic (floor )?pain\b/, kind: 'need', id: 'pain.pelvic', confidence: 0.95 },
  { re: /\bpostpartum (pain|soreness)|\bperineal (pain|tear)|\bc-?section (pain|recovery)/, kind: 'need', id: 'pain.postpartum', confidence: 0.93 },
  { re: /\bjoint (pain|aches?)\b|\bachy joints\b/, kind: 'need', id: 'pain.joint', confidence: 0.94 },
  { re: /\bmigraines?\b|\bheadaches?\b/, kind: 'need', id: 'pain.cycle_headache', confidence: 0.8 },
  { re: /\bbloat(ed|ing)?\b.*\b(period|cycle|pms)\b|\b(period|cycle|pms)\b.*\bbloat/, kind: 'need', id: 'bloating.cycle_related', confidence: 0.92 },
  { re: /\bbloat(ed|ing)?\b.*\bpregnan|\bpregnan.*\bbloat/, kind: 'need', id: 'bloating.pregnancy_related', confidence: 0.9 },
  { re: /\bbloat(ed|ing)?\b.*\b(digest|food|eating|meal|gut)|\b(digest|food|eating|meal|gut).*\bbloat/, kind: 'need', id: 'bloating.digestive', confidence: 0.9 },
  { re: /\bbloat(ed|ing)?\b/, kind: 'need', id: 'bloating.unspecified', confidence: 0.85 },
  { re: /\bcannot keep anything down\b|\bthrowing up\b|\bvomit/, kind: 'need', id: 'digestive.nausea', confidence: 0.79, contextual_only: true },
  { re: /\bnause(a|ous)\b|\bmorning sickness\b/, kind: 'need', id: 'digestive.nausea', confidence: 0.93 },
  { re: /\bconstipat/, kind: 'need', id: 'digestive.constipation', confidence: 0.96 },
  { re: /\bdiarrh?ea\b|\bloose stools?\b/, kind: 'need', id: 'digestive.diarrhea', confidence: 0.95 },
  { re: /\bgassy\b|\bgas\b|\bflatulen/, kind: 'need', id: 'digestive.gas', confidence: 0.85 },
  { re: /\bhot flash(es)?\b|\bhot flush(es)?\b/, kind: 'need', id: 'vasomotor.hot_flashes', confidence: 0.97 },
  { re: /\bnight sweats?\b/, kind: 'need', id: 'vasomotor.night_sweats', confidence: 0.97 },
  { re: /\b(wake|woke|waking) up (drenched|soaked|sweating|sweaty)\b|\bdrenched in sweat\b|\bsweat(ing|y)? (at|during the) night\b|\bnight ?time sweat/, kind: 'need', id: 'vasomotor.night_sweats', confidence: 0.9 },
  { re: /\bvaginal(ly)? dry|\bdryness down there\b|\bdry vagina\b|\bvaginal atrophy\b/, kind: 'need', id: 'vaginal.dryness', confidence: 0.96 },
  { re: /\bbv\b|\bbacterial vaginosis\b/, kind: 'need', id: 'vaginal.bv', confidence: 0.97 },
  { re: /\byeast infection|\bthrush\b|\bcandida/, kind: 'need', id: 'vaginal.yeast', confidence: 0.96 },
  { re: /\b(vaginal )?odou?r\b|\bsmells? (down there|fishy)\b/, kind: 'need', id: 'vaginal.odor', confidence: 0.9 },
  { re: /\bdischarge\b/, kind: 'need', id: 'vaginal.discharge', confidence: 0.92 },
  { re: /\b(vaginal|vulvar) (itch|itching|irritation)|\bitchy down there\b/, kind: 'need', id: 'vaginal.irritation', confidence: 0.93 },
  { re: /\butis?\b|\burinary tract infection/, kind: 'need', id: 'urinary.recurrent_uti', confidence: 0.9 },
  { re: /\bburn(s|ing)? when (i )?pee|\bburning (with|when) urinat|\bpainful urination\b/, kind: 'need', id: 'urinary.burning', confidence: 0.95 },
  { re: /\bleak(s|ing)? (when|if) (i )?(sneeze|cough|laugh|run|jump)|\bbladder leak|\bincontinen|\bpee (a little )?when/, kind: 'need', id: 'urinary.incontinence', confidence: 0.95 },
  { re: /\blow libido\b|\bno sex drive\b|\blow sex drive\b|\blibido\b/, kind: 'need', id: 'sexual.libido', confidence: 0.92 },
  { re: /\bbirth control\b|\bcontracepti/, kind: 'need', id: 'sexual.contraception', confidence: 0.92 },
  { re: /\bstis?\b|\bstds?\b|\bchlamydia\b|\bgonorrh|\bherpes\b/, kind: 'need', id: 'sexual.sti', confidence: 0.93 },
  { re: /\bacne\b|\bbreakouts?\b|\bpimples?\b|\bbreaking out\b/, kind: 'need', id: 'skin.acne', confidence: 0.94 },
  { re: /\bpanic attacks?\b|\banxious\b|\banxiety\b/, kind: 'need', id: 'mood.general_anxiety', confidence: 0.9 },
  { re: /\bdepressed\b|\blow mood\b|\bfeeling down\b/, kind: 'need', id: 'mood.low', confidence: 0.88 },
  { re: /\binsomnia\b|\bcannot sleep\b|\btrouble sleeping\b|\bwake up at night\b/, kind: 'need', id: 'sleep.trouble', confidence: 0.94 },
  { re: /\bexhausted\b|\balways tired\b|\bno energy\b|\bfatigue\b|\blow energy\b/, kind: 'need', id: 'energy.fatigue', confidence: 0.92 },
  { re: /\bbrain fog\b|\bforgetful\b/, kind: 'need', id: 'cognition.brain_fog', confidence: 0.92 },
  { re: /\bheavy (period|flow|bleeding)s?\b|\bflooding\b|\bbleed(ing)? through\b/, kind: 'need', id: 'period.heavy', confidence: 0.94 },
  { re: /\birregular (period|cycle)s?\b/, kind: 'need', id: 'cycle.irregular', confidence: 0.95 },
  { re: /\bovulat/, kind: 'need', id: 'fertility.ovulation_tracking', confidence: 0.9 },
  { re: /\btrying to (get pregnant|conceive)\b|\bttc\b/, kind: 'need', id: 'fertility.ttc', confidence: 0.95 },
  // Vague complaint: low specificity, no safety decisions.
  { re: /\bhormones?\b|\bhormonal\b/, kind: 'need', id: 'hormonal.general', confidence: 0.55, specificity: 'low', contextual_only: true },
  // Life stages
  { re: /\bperi ?menopaus|\bperi\b/, kind: 'life_stage', id: 'perimenopause', confidence: 0.95 },
  { re: /\bpost ?menopaus/, kind: 'life_stage', id: 'postmenopause', confidence: 0.95 },
  { re: /\bmenopaus/, kind: 'life_stage', id: 'menopause', confidence: 0.92 },
  { re: /\bpostpartum\b|\bjust had a baby\b|\bnew mom\b/, kind: 'life_stage', id: 'postpartum', confidence: 0.93 },
  { re: /\bi am pregnant\b|\bexpecting\b/, kind: 'life_stage', id: 'pregnant', confidence: 0.9 },
  { re: /\bbreastfeeding\b|\bnursing\b|\bpumping\b/, kind: 'life_stage', id: 'breastfeeding', confidence: 0.9 },
  // Formats
  { re: /\bpills?\b|\bcapsules?\b|\btablets?\b|\bsoftgels?\b/, kind: 'format', id: 'pill_capsule', confidence: 0.9 },
  { re: /\bgumm(y|ies)\b/, kind: 'format', id: 'gummy', confidence: 0.95 },
  { re: /\bpowders?\b/, kind: 'format', id: 'powder', confidence: 0.95 },
  { re: /\bteas?\b|\bdrinks?\b/, kind: 'format', id: 'drink_tea', confidence: 0.9 },
  { re: /\bcreams?\b|\blotions?\b|\bgels?\b|\bbalms?\b|\bointments?\b/, kind: 'format', id: 'topical', confidence: 0.9 },
  { re: /\bpatch(es)?\b/, kind: 'format', id: 'patch', confidence: 0.9 },
  { re: /\bsuppositor(y|ies)\b/, kind: 'format', id: 'suppository', confidence: 0.95 },
  { re: /\bdevices?\b|\bwearables?\b|\bgadgets?\b/, kind: 'format', id: 'device', confidence: 0.9 },
  { re: /\bpads?\b|\btampons?\b|\bmenstrual (cups?|discs?)\b|\bperiod underwear\b/, kind: 'format', id: 'period_care', confidence: 0.9 },
  // Values
  { re: /\bvegan\b|\bplant[- ]based\b/, kind: 'value', id: 'vegan', confidence: 0.9 },
  { re: /\borganic\b/, kind: 'value', id: 'organic', confidence: 0.92 },
  { re: /\bcruelty[- ]free\b|\bnot tested on animals\b/, kind: 'value', id: 'cruelty_free', confidence: 0.95 },
  { re: /\breusable\b/, kind: 'value', id: 'reusable', confidence: 0.95 },
  { re: /\beco\b|\bsustainab|\bzero[- ]waste\b|\beco[- ]friendly\b/, kind: 'value', id: 'eco_friendly', confidence: 0.9 },
  { re: /\bblack[- ]owned\b/, kind: 'value', id: 'black_owned', confidence: 0.97 },
  { re: /\bbrown[- ]owned\b|\blatin[ao]?[- ]owned\b|\bwoc[- ]owned\b/, kind: 'value', id: 'brown_owned', confidence: 0.85 },
  { re: /\bsensitive skin\b/, kind: 'value', id: 'sensitive_skin', confidence: 0.95 },
  { re: /\bunscented\b|\bfragrance[- ]free\b/, kind: 'value', id: 'unscented', confidence: 0.95 },
  { re: /\bclean (ingredients|label)\b|\bminimal ingredients\b|\bfew ingredients\b/, kind: 'value', id: 'minimal_ingredients', confidence: 0.85 },
  // Allergens (only as a TYPE of thing; whether the user is allergic is decided by freeText.js)
  { re: /\blatex\b|\bnatural rubber\b/, kind: 'allergen', id: 'latex', confidence: 0.97 },
  { re: /\bfragrances?\b|\bperfumes?\b|\bscents?\b|\bparfum\b/, kind: 'allergen', id: 'fragrance', confidence: 0.93 },
  { re: /\bessential oils?\b|\btea tree\b|\blavender\b/, kind: 'allergen', id: 'essential_oils', confidence: 0.9 },
  { re: /\badhesives?\b|\bglue\b/, kind: 'allergen', id: 'adhesives', confidence: 0.9 },
  { re: /\bnickel\b/, kind: 'allergen', id: 'nickel', confidence: 0.97 },
  { re: /\bdyes?\b/, kind: 'allergen', id: 'dyes', confidence: 0.9 },
  { re: /\bpreservatives?\b|\bparabens?\b/, kind: 'allergen', id: 'preservatives', confidence: 0.85 },
  { re: /\bgluten\b|\bwheat\b/, kind: 'allergen', id: 'gluten', confidence: 0.93 },
  { re: /\bsoy\b/, kind: 'allergen', id: 'soy', confidence: 0.95 },
  { re: /\bdairy\b|\blactose\b|\bmilk\b/, kind: 'allergen', id: 'dairy', confidence: 0.92 },
  { re: /\bibuprofen\b|\bnsaids?\b|\bnaproxen\b|\badvil\b|\bmotrin\b|\baleve\b/, kind: 'allergen', id: 'nsaids', confidence: 0.95 },
  { re: /\bacetaminophen\b|\btylenol\b|\bparacetamol\b/, kind: 'allergen', id: 'acetaminophen', confidence: 0.95 },
  { re: /\baspirin\b/, kind: 'allergen', id: 'aspirin', confidence: 0.95 },
];

// Exact option strings by kind (fast path, confidence 1.0).
const EXACT_OPTIONS = [
  ...NEEDS.filter((n) => n.option).map((n) => ({ text: n.option, kind: 'need', id: n.id })),
  ...CONDITIONS.map((c) => ({ text: c.option, kind: 'condition', id: c.id })),
  ...LIFE_STAGES.map((s) => ({ text: s.option, kind: 'life_stage', id: s.id })),
  ...FORMATS.filter((f) => f.option).map((f) => ({ text: f.option, kind: 'format', id: f.id })),
  ...VALUES.map((v) => ({ text: v.option, kind: 'value', id: v.id })),
  ...ALLERGENS.map((a) => ({ text: a.option, kind: 'allergen', id: a.id })),
].map((e) => ({ ...e, norm: normalizeText(e.text) }));

/**
 * Canonicalize a custom user entry.
 * @param {string} rawText what the user typed
 * @param {{ kinds?: string[] }} [options] restrict to some kinds (e.g. ['need'])
 * @returns {{ raw_user_text: string, normalized: string, canonical_id: string|null, kind: string|null,
 *   confidence: number, specificity: 'normal'|'low', contextual_only: boolean, method: string }}
 * Both the raw text and the interpretation are always returned so callers
 * can store them side by side. confidence 0 + canonical_id null = no match.
 */
export function canonicalize(rawText, options = {}) {
  const kinds = options.kinds ? new Set(options.kinds) : null;
  const allowed = (kind) => !kinds || kinds.has(kind);
  const normalized = normalizeText(rawText);
  const base = { raw_user_text: String(rawText ?? ''), normalized, canonical_id: null, kind: null, confidence: 0, specificity: 'normal', contextual_only: false, method: 'none' };
  if (!normalized) return base;

  const exact = EXACT_OPTIONS.find((e) => e.norm === normalized && allowed(e.kind));
  if (exact) return { ...base, canonical_id: exact.id, kind: exact.kind, confidence: 1, method: 'exact_option' };

  for (const rule of SYNONYM_RULES) {
    if (!allowed(rule.kind)) continue;
    if (rule.re.test(normalized)) {
      return {
        ...base,
        canonical_id: rule.id,
        kind: rule.kind,
        confidence: rule.confidence,
        specificity: rule.specificity || 'normal',
        contextual_only: Boolean(rule.contextual_only),
        method: 'synonym_rule',
      };
    }
  }

  // Fallback: token overlap with an option label. Capped at 0.6 so it is
  // never treated as HIGH confidence downstream.
  const tokens = new Set(normalized.split(' ').filter((t) => t.length > 3));
  let best = null;
  for (const e of EXACT_OPTIONS) {
    if (!allowed(e.kind)) continue;
    const optTokens = e.norm.split(' ').filter((t) => t.length > 3);
    if (!optTokens.length) continue;
    const hits = optTokens.filter((t) => tokens.has(t)).length;
    const score = hits / optTokens.length;
    if (hits > 0 && (!best || score > best.score)) best = { e, score };
  }
  if (best && best.score >= 0.5) {
    return { ...base, canonical_id: best.e.id, kind: best.e.kind, confidence: Math.round(0.6 * best.score * 100) / 100, specificity: 'low', method: 'token_overlap' };
  }
  return base;
}

/** Confidence bands shared by canonicalization and free-text extraction. */
export function confidenceBand(confidence) {
  if (confidence >= 0.9) return 'HIGH';
  if (confidence >= 0.7) return 'MEDIUM';
  return 'LOW';
}
