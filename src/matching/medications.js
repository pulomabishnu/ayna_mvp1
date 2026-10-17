// Medication normalization (brand -> generic -> class) and the structured,
// reviewed interaction layer.
//
// Rules:
// - Normalization covers well-established US brand/generic pairs only.
// - The interaction table is seeded ONLY from the facts that already existed
//   in src/data/interactions.js (wording kept). Every seeded row is marked
//   needs_clinical_review: true, reviewed_on: null.
// - Any (medication, product ingredient) pair not in the table is 'unknown'.
//   Unknown lowers confidence. It is never treated as 'compatible'.
// - No LLM or network calls. No new interaction claims.

import { RESEARCH_INTERACTIONS, RESEARCH_INGREDIENT_KEYWORDS, RESEARCH_MEDICATIONS } from '../data/matching/medInteractions.research.js';
import { normalizeText } from './ontology.js';

// ─── Medication classes ─────────────────────────────────────────────────────
// parent: broader class used when an interaction row is written at class level.
export const MEDICATION_CLASSES = {
  ssri: { label: 'SSRI antidepressant', parents: ['antidepressant'] },
  snri: { label: 'SNRI antidepressant', parents: ['antidepressant'] },
  ndri: { label: 'NDRI antidepressant', parents: ['antidepressant'] },
  antidepressant: { label: 'Antidepressant', parents: [] },
  azapirone_anxiolytic: { label: 'Anti-anxiety (azapirone)', parents: [] },
  cns_stimulant: { label: 'CNS stimulant', parents: [] },
  oral_retinoid: { label: 'Oral retinoid', parents: [] },
  topical_retinoid: { label: 'Topical retinoid', parents: [] },
  tetracycline_antibiotic: { label: 'Tetracycline antibiotic', parents: ['antibiotic'] },
  antibiotic: { label: 'Antibiotic', parents: [] },
  biguanide: { label: 'Biguanide (diabetes)', parents: [] },
  aldosterone_antagonist: { label: 'Aldosterone antagonist', parents: [] },
  thyroid_hormone: { label: 'Thyroid hormone', parents: [] },
  aromatase_inhibitor: { label: 'Aromatase inhibitor', parents: [] },
  serm_ovulation_inducer: { label: 'Ovulation inducer (SERM)', parents: [] },
  glp1_ra: { label: 'GLP-1 receptor agonist', parents: [] },
  gip_glp1_ra: { label: 'GIP/GLP-1 receptor agonist', parents: ['glp1_ra'] },
  nsaid: { label: 'NSAID', parents: [] },
  analgesic: { label: 'Analgesic', parents: [] },
  antiplatelet_salicylate: { label: 'Aspirin (salicylate)', parents: ['nsaid'] },
  vitamin_k_antagonist: { label: 'Anticoagulant (vitamin K antagonist)', parents: ['anticoagulant'] },
  anticoagulant: { label: 'Anticoagulant', parents: [] },
  ace_inhibitor: { label: 'ACE inhibitor', parents: ['blood_pressure'] },
  arb: { label: 'Angiotensin receptor blocker', parents: ['blood_pressure'] },
  calcium_channel_blocker: { label: 'Calcium channel blocker', parents: ['blood_pressure'] },
  blood_pressure: { label: 'Blood pressure medication', parents: [] },
  combined_hormonal_contraceptive: { label: 'Combined hormonal contraceptive', parents: ['hormonal_contraceptive'] },
  progestin_only_contraceptive: { label: 'Progestin-only contraceptive', parents: ['hormonal_contraceptive'] },
  hormonal_contraceptive: { label: 'Hormonal contraceptive', parents: [] },
  nonhormonal_contraceptive: { label: 'Non-hormonal contraceptive', parents: [] },
  supplement: { label: 'Supplement', parents: [] },
  fluoroquinolone_antibiotic: { label: 'Fluoroquinolone antibiotic', parents: ['antibiotic'] },
  bisphosphonate: { label: 'Bisphosphonate (bone)', parents: [] },
  benzodiazepine: { label: 'Benzodiazepine', parents: [] },
  lithium: { label: 'Lithium', parents: [] },
  proton_pump_inhibitor: { label: 'Proton pump inhibitor', parents: [] },
};

// ─── Brand -> generic -> class table ────────────────────────────────────────
// generic: lowercase generic name. brands: common US brand names.
// ingredient: product-ingredient key (see INGREDIENT_KEYWORDS) when the
// medicine/supplement is itself an ingredient that can appear in products.
export const MEDICATIONS = [
  // Antidepressants / anti-anxiety
  { generic: 'sertraline', brands: ['Zoloft'], classes: ['ssri'] },
  { generic: 'escitalopram', brands: ['Lexapro'], classes: ['ssri'] },
  { generic: 'fluoxetine', brands: ['Prozac', 'Sarafem'], classes: ['ssri'] },
  { generic: 'citalopram', brands: ['Celexa'], classes: ['ssri'] },
  { generic: 'paroxetine', brands: ['Paxil'], classes: ['ssri'] },
  { generic: 'duloxetine', brands: ['Cymbalta'], classes: ['snri'] },
  { generic: 'venlafaxine', brands: ['Effexor', 'Effexor XR'], classes: ['snri'] },
  { generic: 'desvenlafaxine', brands: ['Pristiq'], classes: ['snri'] },
  { generic: 'bupropion', brands: ['Wellbutrin', 'Wellbutrin XL'], classes: ['ndri'] },
  { generic: 'buspirone', brands: ['Buspar'], classes: ['azapirone_anxiolytic'] },
  // Stimulants
  { generic: 'lisdexamfetamine', brands: ['Vyvanse'], classes: ['cns_stimulant'] },
  { generic: 'amphetamine/dextroamphetamine', brands: ['Adderall'], classes: ['cns_stimulant'] },
  { generic: 'methylphenidate', brands: ['Ritalin', 'Concerta'], classes: ['cns_stimulant'] },
  // Skin
  { generic: 'isotretinoin', brands: ['Accutane', 'Absorica', 'Claravis'], classes: ['oral_retinoid'] },
  { generic: 'tretinoin', brands: ['Retin-A'], classes: ['topical_retinoid'] },
  { generic: 'doxycycline', brands: ['Vibramycin', 'Doryx'], classes: ['tetracycline_antibiotic'] },
  // Metabolic / endocrine
  { generic: 'metformin', brands: ['Glucophage'], classes: ['biguanide'] },
  { generic: 'spironolactone', brands: ['Aldactone'], classes: ['aldosterone_antagonist'] },
  { generic: 'levothyroxine', brands: ['Synthroid', 'Levoxyl', 'Tirosint', 'Unithroid', 'Euthyrox'], classes: ['thyroid_hormone'] },
  { generic: 'semaglutide', brands: ['Ozempic', 'Wegovy', 'Rybelsus'], classes: ['glp1_ra'] },
  { generic: 'liraglutide', brands: ['Victoza', 'Saxenda'], classes: ['glp1_ra'] },
  { generic: 'tirzepatide', brands: ['Mounjaro', 'Zepbound'], classes: ['gip_glp1_ra'] },
  // Fertility
  { generic: 'letrozole', brands: ['Femara'], classes: ['aromatase_inhibitor'] },
  { generic: 'clomiphene', brands: ['Clomid'], classes: ['serm_ovulation_inducer'] },
  // Pain
  { generic: 'ibuprofen', brands: ['Advil', 'Motrin'], classes: ['nsaid'] },
  { generic: 'naproxen', brands: ['Aleve', 'Naprosyn'], classes: ['nsaid'] },
  { generic: 'acetaminophen', brands: ['Tylenol'], classes: ['analgesic'] },
  { generic: 'aspirin', brands: ['Bayer', 'Ecotrin'], classes: ['antiplatelet_salicylate'] },
  // Anticoagulant
  { generic: 'warfarin', brands: ['Coumadin', 'Jantoven'], classes: ['vitamin_k_antagonist'] },
  // Blood pressure
  { generic: 'lisinopril', brands: ['Prinivil', 'Zestril'], classes: ['ace_inhibitor'] },
  { generic: 'losartan', brands: ['Cozaar'], classes: ['arb'] },
  { generic: 'amlodipine', brands: ['Norvasc'], classes: ['calcium_channel_blocker'] },
  // Contraception: combined
  { generic: 'drospirenone/ethinyl estradiol', brands: ['Yaz', 'Yasmin'], classes: ['combined_hormonal_contraceptive'] },
  { generic: 'norgestimate/ethinyl estradiol', brands: ['Sprintec', 'Ortho Tri-Cyclen'], classes: ['combined_hormonal_contraceptive'] },
  { generic: 'levonorgestrel/ethinyl estradiol', brands: ['Seasonique', 'Aviane', 'Alesse'], classes: ['combined_hormonal_contraceptive'] },
  { generic: 'norethindrone acetate/ethinyl estradiol', brands: ['Loestrin', 'Junel'], classes: ['combined_hormonal_contraceptive'] },
  { generic: 'etonogestrel/ethinyl estradiol vaginal ring', brands: ['NuvaRing', 'EluRyng'], classes: ['combined_hormonal_contraceptive'] },
  { generic: 'norelgestromin/ethinyl estradiol patch', brands: ['Xulane', 'Ortho Evra'], classes: ['combined_hormonal_contraceptive'] },
  // Contraception: progestin-only
  { generic: 'norethindrone', brands: ['Camila', 'Errin', 'Micronor'], classes: ['progestin_only_contraceptive'], aliases: ['mini pill', 'minipill'] },
  { generic: 'drospirenone', brands: ['Slynd'], classes: ['progestin_only_contraceptive'] },
  { generic: 'norgestrel', brands: ['Opill'], classes: ['progestin_only_contraceptive'] },
  { generic: 'etonogestrel implant', brands: ['Nexplanon', 'Implanon'], classes: ['progestin_only_contraceptive'] },
  { generic: 'medroxyprogesterone acetate injection', brands: ['Depo-Provera'], classes: ['progestin_only_contraceptive'], aliases: ['depo shot', 'the shot'] },
  { generic: 'levonorgestrel IUD', brands: ['Mirena', 'Kyleena', 'Liletta', 'Skyla'], classes: ['progestin_only_contraceptive'], aliases: ['hormonal iud'] },
  { generic: 'copper IUD', brands: ['Paragard'], classes: ['nonhormonal_contraceptive'], aliases: ['copper iud'] },
  // Unspecified hormonal birth control (class known, product not).
  { generic: 'hormonal contraceptive (unspecified)', brands: [], classes: ['hormonal_contraceptive'], aliases: ['birth control pill', 'birth control', 'the pill', 'oral contraceptive', 'combined pill'] },
  // Supplements users list under "Taking anything?"
  { generic: 'melatonin', brands: [], classes: ['supplement'], ingredient: 'melatonin' },
  { generic: 'magnesium', brands: [], classes: ['supplement'], ingredient: 'magnesium' },
  { generic: 'vitamin d', brands: [], classes: ['supplement'], ingredient: 'vitaminD', aliases: ['vitamin d3', 'd3'] },
  { generic: 'vitamin b12', brands: [], classes: ['supplement'], ingredient: 'vitaminB12', aliases: ['b12'] },
  { generic: 'iron', brands: [], classes: ['supplement'], ingredient: 'iron', aliases: ['ferrous sulfate'] },
  { generic: 'calcium', brands: [], classes: ['supplement'], ingredient: 'calcium' },
  { generic: 'zinc', brands: [], classes: ['supplement'], ingredient: 'zinc' },
  { generic: 'copper', brands: [], classes: ['supplement'], ingredient: 'copper' },
  { generic: 'folic acid', brands: [], classes: ['supplement'], ingredient: 'folate', aliases: ['folate', 'methylfolate'] },
  { generic: 'prenatal vitamin', brands: [], classes: ['supplement'], ingredient: 'prenatal_multivitamin', aliases: ['prenatal', 'prenatals'] },
  { generic: 'omega-3', brands: [], classes: ['supplement'], ingredient: 'omega3', aliases: ['fish oil', 'omega 3'] },
  { generic: 'probiotic', brands: [], classes: ['supplement'], ingredient: 'probiotic', aliases: ['probiotics'] },
  { generic: 'multivitamin', brands: [], classes: ['supplement'], ingredient: 'multivitamin' },
  { generic: 'biotin', brands: [], classes: ['supplement'], ingredient: 'biotin' },
  { generic: 'inositol', brands: [], classes: ['supplement'], ingredient: 'inositol', aliases: ['myo-inositol', 'myo inositol'] },
  { generic: "st. john's wort", brands: [], classes: ['supplement'], ingredient: 'stJohnsWort', aliases: ['st johns wort', 'hypericum'] },
  { generic: 'ginkgo', brands: [], classes: ['supplement'], ingredient: 'ginkgo', aliases: ['ginkgo biloba'] },
  { generic: 'vitamin k', brands: [], classes: ['supplement'], ingredient: 'vitaminK', aliases: ['vitamin k2'] },
];

// Medicines added with the interaction research (Oct 17): generic names from
// the research rows, plus their standard US brand names.
const RESEARCH_BRANDS = {
  ciprofloxacin: ['Cipro'], levofloxacin: ['Levaquin'], moxifloxacin: ['Avelox'],
  alendronate: ['Fosamax'], alprazolam: ['Xanax'], lorazepam: ['Ativan'], clonazepam: ['Klonopin'], diazepam: ['Valium'],
  'lithium carbonate': ['Lithobid'], omeprazole: ['Prilosec'], esomeprazole: ['Nexium'], lansoprazole: ['Prevacid'], pantoprazole: ['Protonix'],
  apixaban: ['Eliquis'], rivaroxaban: ['Xarelto'], dabigatran: ['Pradaxa'], minocycline: ['Minocin'],
  enalapril: ['Vasotec'], ramipril: ['Altace'], benazepril: ['Lotensin'], valsartan: ['Diovan'], irbesartan: ['Avapro'], olmesartan: ['Benicar'],
  nifedipine: ['Procardia'], diltiazem: ['Cardizem'], verapamil: ['Calan'], hydrochlorothiazide: [],
};
{
  const known = new Set(MEDICATIONS.map((m) => m.generic));
  for (const { class: cls, generics } of RESEARCH_MEDICATIONS) {
    if (!MEDICATION_CLASSES[cls]) continue;
    for (const g of generics) {
      if (known.has(g) || /\b(and|or)\b|\(|\//.test(g)) continue;
      known.add(g);
      MEDICATIONS.push({ generic: g, brands: RESEARCH_BRANDS[g] || [], classes: [g === 'hydrochlorothiazide' ? 'blood_pressure' : cls] });
    }
  }
}

const LOOKUP = new Map();
for (const med of MEDICATIONS) {
  const names = [med.generic, ...med.brands, ...(med.aliases || [])];
  for (const n of names) LOOKUP.set(normalizeText(n), med);
}

function expandClasses(classes) {
  const out = new Set();
  const visit = (c) => {
    if (!c || out.has(c)) return;
    out.add(c);
    (MEDICATION_CLASSES[c]?.parents || []).forEach(visit);
  };
  classes.forEach(visit);
  return [...out];
}

/**
 * Normalize one "Taking anything?" entry.
 * @returns {{ raw: string, recognized: boolean, matched_as: 'brand'|'generic'|'alias'|null,
 *   generic: string|null, classes: string[], all_classes: string[], ingredient: string|null, kind: 'medication'|'supplement'|null }}
 */
export function normalizeMedication(raw) {
  const norm = normalizeText(raw).replace(/\s+\d+(\.\d+)?\s*(mg|mcg|iu|g)\b.*$/, '').trim();
  const base = { raw: String(raw ?? ''), recognized: false, matched_as: null, generic: null, classes: [], all_classes: [], ingredient: null, kind: null };
  if (!norm) return base;
  const med = LOOKUP.get(norm);
  if (!med) return base;
  const matchedAs = normalizeText(med.generic) === norm ? 'generic' : med.brands.some((b) => normalizeText(b) === norm) ? 'brand' : 'alias';
  return {
    ...base,
    recognized: true,
    matched_as: matchedAs,
    generic: med.generic,
    classes: [...med.classes],
    all_classes: expandClasses(med.classes),
    ingredient: med.ingredient || null,
    kind: med.classes.includes('supplement') ? 'supplement' : 'medication',
  };
}

// ─── Product ingredient detection ───────────────────────────────────────────
// Ported from INGREDIENT_KEYWORDS in src/data/interactions.js (only the
// ingredient keys; medication keys there describe users, not products).
// Matching is on whole words to avoid substring false positives
// (e.g. "environment" containing "iron").
export const INGREDIENT_KEYWORDS = {
  iron: ['iron', 'ferrous', 'ferric'],
  calcium: ['calcium'],
  magnesium: ['magnesium'],
  zinc: ['zinc'],
  copper: ['copper', 'cupric'],
  vitaminD: ['vitamin d', 'vitamin d3', 'd3', 'cholecalciferol'],
  vitaminK: ['vitamin k', 'vitamin k2', 'k2', 'menaquinone', 'phytonadione'],
  vitaminE: ['vitamin e', 'tocopherol'],
  omega3: ['fish oil', 'omega-3', 'omega 3', 'epa', 'dha'],
  stJohnsWort: ["st. john's wort", 'st johns wort', 'hypericum'],
  ginkgo: ['ginkgo', 'ginkgo biloba'],
  ginger: ['ginger'],
  turmeric: ['turmeric', 'curcumin'],
  valerian: ['valerian'],
  melatonin: ['melatonin'],
  ashwagandha: ['ashwagandha', 'withania'],
  fenugreek: ['fenugreek'],
  vitex: ['vitex', 'chasteberry', 'chaste tree', 'chaste berry'],
};

// Ingredient words from the interaction research (short or ambiguous words were dropped).
for (const [key, words] of Object.entries(RESEARCH_INGREDIENT_KEYWORDS)) {
  INGREDIENT_KEYWORDS[key] = [...new Set([...(INGREDIENT_KEYWORDS[key] || []), ...words])];
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const INGREDIENT_RES = Object.fromEntries(Object.entries(INGREDIENT_KEYWORDS)
  .map(([k, words]) => [k, new RegExp(`(^|[^a-z0-9])(${words.map(escapeRe).join('|')})([^a-z0-9]|$)`, 'i')]));

/** Ingredient keys detected in free text (product name + ingredients + summary). */
export function detectIngredientKeys(text) {
  const t = String(text || '').toLowerCase();
  return Object.keys(INGREDIENT_RES).filter((k) => INGREDIENT_RES[k].test(t));
}

// ─── Interaction table ──────────────────────────────────────────────────────
// Schema: { medication | medication_class, product_ingredient, verdict,
//   message, legacy_severity, source, reviewed_on, reviewer, needs_clinical_review }
// medication_class 'supplement:<ingredient>' means a user who takes that
// supplement. Verdicts were derived from the legacy wording only:
// "Do not combine" -> 'avoid'; everything else -> 'caution'.
const LEGACY = { source: 'legacy ayna interactions.js', reviewed_on: null, reviewer: null, needs_clinical_review: true };
export const INTERACTION_TABLE = [
  { medication_class: 'supplement:iron', product_ingredient: 'calcium', verdict: 'caution', legacy_severity: 'medium',
    message: 'Calcium can reduce iron absorption. Take iron and calcium at least 2 hours apart, or with food as directed by your provider.', ...LEGACY },
  { medication_class: 'supplement:calcium', product_ingredient: 'iron', verdict: 'caution', legacy_severity: 'medium',
    message: 'Calcium can reduce iron absorption. Take iron and calcium at least 2 hours apart, or with food as directed by your provider.', ...LEGACY },
  { medication_class: 'supplement:zinc', product_ingredient: 'copper', verdict: 'caution', legacy_severity: 'low',
    message: 'High-dose zinc long-term can lower copper levels. If you take zinc daily, consider a copper-containing multivitamin or separate copper supplement.', ...LEGACY },
  { medication_class: 'supplement:copper', product_ingredient: 'zinc', verdict: 'caution', legacy_severity: 'low',
    message: 'High-dose zinc long-term can lower copper levels. If you take zinc daily, consider a copper-containing multivitamin or separate copper supplement.', ...LEGACY },
  { medication: 'warfarin', product_ingredient: 'vitaminK', verdict: 'caution', legacy_severity: 'high',
    message: 'Vitamin K can affect how warfarin works. Keep vitamin K intake consistent and tell your doctor about any new supplements.', ...LEGACY },
  { medication: 'warfarin', product_ingredient: 'omega3', verdict: 'caution', legacy_severity: 'medium',
    message: 'Fish oil / omega-3 may slightly increase bleeding risk with blood thinners. Use under medical supervision.', ...LEGACY },
  { medication_class: 'hormonal_contraceptive', product_ingredient: 'stJohnsWort', verdict: 'avoid', legacy_severity: 'high', source: 'https://www.nccih.nih.gov/health/st-johns-wort', reviewed_on: '2026-10-17', reviewer: 'research', needs_clinical_review: true,
    message: "St. John's wort can make hormonal birth control less effective. Don't combine them without talking to your provider." },
  { medication_class: 'antidepressant', product_ingredient: 'stJohnsWort', verdict: 'avoid', legacy_severity: 'high',
    message: "St. John's wort can interact with antidepressants (serotonin syndrome risk). Do not combine without your doctor's approval.", ...LEGACY },
  { medication: 'warfarin', product_ingredient: 'ginkgo', verdict: 'caution', legacy_severity: 'medium',
    message: 'Ginkgo may increase bleeding risk when taken with blood thinners. Discuss with your provider.', ...LEGACY },
  { medication: 'aspirin', product_ingredient: 'ginkgo', verdict: 'caution', legacy_severity: 'low',
    message: 'Ginkgo with aspirin may increase bleeding risk. Discuss with your provider.', ...LEGACY },
  { medication_class: 'blood_pressure', product_ingredient: 'melatonin', verdict: 'caution', legacy_severity: 'low',
    message: 'Melatonin can sometimes affect blood pressure. If you take blood pressure medication, mention melatonin use to your doctor.', ...LEGACY },
  { medication_class: 'blood_pressure', product_ingredient: 'magnesium', verdict: 'caution', legacy_severity: 'low',
    message: 'Magnesium can support blood pressure health; large doses may enhance the effect of blood pressure medications. Monitor with your provider.', ...LEGACY },
  // Added from the evidence research (NIH NCCIH and MedlinePlus herb pages). Not a clinical sign-off.
  { medication_class: 'anticoagulant', product_ingredient: 'stJohnsWort', verdict: 'avoid', legacy_severity: 'high', source: 'https://www.nccih.nih.gov/health/st-johns-wort', reviewed_on: '2026-10-17', reviewer: 'research', needs_clinical_review: true,
    message: "St. John's wort can make blood thinners like warfarin work less well. Don't combine them without your doctor's approval." },
  { medication_class: 'thyroid_hormone', product_ingredient: 'ashwagandha', verdict: 'caution', legacy_severity: 'medium', source: 'https://www.nccih.nih.gov/health/ashwagandha', reviewed_on: '2026-10-17', reviewer: 'research', needs_clinical_review: true,
    message: 'Ashwagandha may raise thyroid hormone levels. If you take thyroid medication, check with your doctor first.' },
  { medication_class: 'anticoagulant', product_ingredient: 'fenugreek', verdict: 'caution', legacy_severity: 'medium', source: 'https://medlineplus.gov/druginfo/natural/733.html', reviewed_on: '2026-10-17', reviewer: 'research', needs_clinical_review: true,
    message: 'Fenugreek may slow blood clotting. If you take a blood thinner, check with your doctor first.' },
  { medication_class: 'anticoagulant', product_ingredient: 'omega3', verdict: 'caution', legacy_severity: 'medium', source: 'https://www.nccih.nih.gov/health/omega3-supplements-what-you-need-to-know', reviewed_on: '2026-10-17', reviewer: 'research', needs_clinical_review: true,
    message: 'Fish oil / omega-3 may slightly increase bleeding risk with blood thinners. Use under medical supervision.' },
];

// Interaction research rows (NIH ODS, MedlinePlus, FDA labels, Mayo, NHS), each
// with its source. Earlier rows win when both cover the same pair.
INTERACTION_TABLE.push(...RESEARCH_INTERACTIONS);

function rowMatchesMedication(row, med) {
  if (row.medication) return med.generic === row.medication;
  if (row.medication_class?.startsWith('supplement:')) return med.ingredient === row.medication_class.slice('supplement:'.length);
  return med.all_classes.includes(row.medication_class);
}

/**
 * Look up one user medication against one product ingredient key.
 * Pairs not in the table return verdict 'unknown' (never 'compatible').
 */
export function lookupInteraction(normalizedMed, productIngredient) {
  const row = INTERACTION_TABLE.find((r) => r.product_ingredient === productIngredient && rowMatchesMedication(r, normalizedMed));
  if (row) return { ...row };
  return { medication: normalizedMed.generic || normalizedMed.raw, product_ingredient: productIngredient, verdict: 'unknown', source: null, reviewed_on: null, reviewer: null };
}

/**
 * Check a user's normalized medications against a product's active ingredients.
 * @param {ReturnType<typeof normalizeMedication>[]} meds
 * @param {{ ingredient_keys: string[], interaction_relevant: boolean }} productInfo
 * @returns {{ verdict: 'compatible'|'caution'|'avoid'|'unknown'|'not_applicable', findings: object[], unknownPairs: number }}
 * 'compatible' is only returned when every pair has a reviewed 'compatible' row (none exist today).
 */
export function checkMedicationInteractions(meds, productInfo) {
  const list = (meds || []).filter((m) => m && (m.recognized || m.raw));
  if (!list.length || !productInfo?.interaction_relevant) return { verdict: 'not_applicable', findings: [], unknownPairs: 0 };
  const ingredients = productInfo.ingredient_keys || [];
  const findings = [];
  let unknownPairs = 0;
  for (const med of list) {
    if (!med.recognized) { unknownPairs += 1; findings.push({ medication: med.raw, product_ingredient: null, verdict: 'unknown', reason: 'unrecognized_medication' }); continue; }
    if (!ingredients.length) { unknownPairs += 1; findings.push({ medication: med.generic, product_ingredient: null, verdict: 'unknown', reason: 'product_ingredients_unknown' }); continue; }
    for (const ing of ingredients) {
      if (med.ingredient && med.ingredient === ing) continue; // same substance, not an interaction row
      const row = lookupInteraction(med, ing);
      if (row.verdict === 'unknown') unknownPairs += 1;
      findings.push(row);
    }
  }
  const verdicts = findings.map((f) => f.verdict);
  const verdict = verdicts.includes('avoid') ? 'avoid'
    : verdicts.includes('caution') ? 'caution'
      : verdicts.length && verdicts.every((v) => v === 'compatible') ? 'compatible'
        : 'unknown';
  return { verdict, findings, unknownPairs };
}
