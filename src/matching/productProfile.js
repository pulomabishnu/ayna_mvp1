// Product health profile: turns a raw catalog product into the structured
// record the matching engine scores against.
//
// Everything here is derived ONLY from fields that exist in the catalog
// (category, type, tags, healthFunctions, name, summary, description,
// ingredients, safety.*, warnings, whoItsFor, howToUse, badges, citation and
// verification fields, price, whereToBuy*, fsaHsaEligible, isEmergingBrand,
// avoidIfSensitivity, evidenceStrength, brand). Where the catalog is silent
// the value is 'unknown'. Silence is never read as 'no'.
//
// The relevance rules (RELEVANCE_RULES) and the safety text rules
// (ATTRIBUTE_RULES, PREGNANCY_RULES) are plain tables so a clinician can
// review them line by line.
//
// The product passport (src/data/passport) is read on top of the catalog:
// passport status (recalled / discontinued / unavailable), reviewed
// ingredient, allergen and pregnancy facts, canonical ingredient ids,
// claim-level evidence and freshness. See passportLayer() below.

import { detectIngredientKeys } from './medications.js';
import { getPassport, OFF_SHELF_STATUSES } from '../data/passport/index.js';
import SAFETY_RESEARCH from '../data/matching/safety.research.js';

// Pregnancy / breastfeeding status from the evidence research (credible
// sources only, scripts/merge-research.mjs). Used to TIGHTEN only: 'avoid'
// becomes contraindicated and 'ask_clinician' becomes caution; 'ok' and
// 'unknown' never loosen what the catalog or passport says.
const RESEARCH_STAGE = new Map(SAFETY_RESEARCH.map((r) => [r.product, r]));
const RESEARCH_STATUS = { avoid: 'contraindicated', ask_clinician: 'caution' };
function researchStage(productId, key, applicable) {
  const r = RESEARCH_STAGE.get(productId);
  if (!applicable || !r) return null;
  // 'ok' from a credible source (e.g. CDC on folic acid) only fills an
  // unknown: it never overrides a caution or limit from the label or passport.
  if (r[key] === 'ok') return { overall: 'verified', trimester_1: 'verified', trimester_2: 'verified', trimester_3: 'verified', evidence_source: r[`${key}_source`] || r.source_url, last_reviewed: r.reviewed, onlyIfUnknown: true };
  const overall = RESEARCH_STATUS[r[key]];
  if (!overall) return null;
  // No .gov page (or brand label) found: the cautious status is kept as ayna policy (Oct 24).
  const evidence = r[`${key}_basis`] === 'ayna_policy' ? 'ayna policy (no .gov source found)' : r[`${key}_source`] || r.source_url;
  return { overall, trimester_1: overall, trimester_2: overall, trimester_3: overall, evidence_source: evidence, last_reviewed: r.reviewed };
}

// ─── Relevance levels (spec) ────────────────────────────────────────────────
export const LEVEL = { DIRECT: 1.0, STRONG: 0.8, SECONDARY: 0.55, ADJACENT: 0.3, WEAK: 0.1, NONE: 0 };
export function relationshipFor(score) {
  if (score >= 1) return 'direct';
  if (score >= 0.8) return 'strong';
  if (score >= 0.55) return 'secondary';
  if (score >= 0.3) return 'adjacent';
  if (score > 0) return 'weak';
  return 'unrelated';
}
const { DIRECT, STRONG, SECONDARY, ADJACENT, WEAK } = LEVEL;

// CONTEXTUAL relationship (founder spec A.10): the product is relevant to a
// need ONLY when she also gave one of these explicit contexts (ontology
// CONTEXTS). Example: a menopause supplement for night sweats requires the
// menopause transition context; night sweats alone never unlocks it.
//   ctx(STRONG, 'menopause_transition')
export function ctx(level, ...contexts) { return { level, requires: contexts }; }
// CONTEXT BONUS (spec A.14): a product that is already relevant to the need
// and is specifically appropriate to an explicit context gets +0.10 when that
// context is present, nothing otherwise.
export const CONTEXT_BONUS = 0.1;

// Broad marketing language ("hormone balance", "women's wellness", "detox",
// "cycle support", "feminine wellness", "metabolism", "reproductive support")
// is almost worthless as relevance: any need supported only by it is capped
// at WEAK (0.10), so it can never put a product on a shelf.
export const BROAD_MARKETING = /hormone balance|hormonal balance|balance (your )?hormones|women'?s wellness|feminine wellness|\bdetox|cycle support|metabolism|reproductive support|hormonal support|hormone support/;

export const PERIOD_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear']);

// Relevance rules whose claim only holds for someone who menstruates: period
// products, cycle trackers and ovulation/fertility tests. CYCLE_TRACKING_RULES
// are the ones that need an actual cycle to track (not just bleeding).
export const CYCLE_DEPENDENT_RULES = new Set([
  'period_product', 'period_high_capacity', 'period_regular_capacity_heavy', 'period_light_capacity',
  'period_underwear_light', 'period_other_light', 'cup_steamer', 'cramp_period_product', 'cycle_tracker', 'fertility_testing',
]);
export const CYCLE_TRACKING_RULES = new Set(['cycle_tracker', 'fertility_testing']);

// Copy that denies a property ("hormone-free") or uses a keyword in an
// unrelated sense. Stripped before relevance matching (same idea as
// NEGATED_CONCERN_PHRASES in src/data/products.js).
const NEGATED_PHRASES = [
  /non-?\s?hormonal/g, /hormone-?\s?free/g, /estrogen-?\s?free/g, /outside your period/g, /not\s+(?:for\s+)?menstrual/g,
  /distinct from a\s+menstrual/g, /rather than menstrual/g,
  /stress\s+(?:(?:or|and)\s+urge\s+)?(?:bladder\s+)?(?:incontinence|leaks?)/g,
];

// Sentences that deny a benefit ("not established as a treatment for PCOS",
// "PCOS alone does not establish a need", "evidence ... is limited") must not
// count as a mention of that condition.
const NEGATED_CLAIM = [
  /\b(not|no|does not|doesn't|isn't|is not|cannot|insufficient)\b[^.]*\b(treat\w*|establish\w*|evidence|support|benefit|need|improv\w*|promise|effective)\b/,
  /\b(treat\w*|establish\w*|evidence|support|benefit|improv\w*)\b[^.]*\b(not established|is limited|are limited|insufficient|not conclusive)\b/,
  /\bshould not be treated as\b/,
];
function claimText(text) {
  return text.split(/(?<=[.!?])\s+/).filter((sentence) => !NEGATED_CLAIM.some((re) => re.test(sentence))).join(' ');
}

/** Lowercased fields used by the rule predicates. */
// Botanicals with reproductive or hormonal effects, or no pregnancy data as a class.
const HERBAL_RE = /\b(vitex|chaste ?berry|chasteberry|agnus castus|dong quai|angelica sinensis|black cohosh|evening primrose|ashwagandha|maca|red clover|st\.? john'?s wort|ginseng|licorice|liquorice|fenugreek|shatavari|wild yam|red raspberry leaf|raspberry leaf|motherwort|valerian|saw palmetto|dandelion|turmeric|curcumin|rhodiola|schisandra|tribulus|hops|kava|ginkgo|cramp bark|false unicorn|blue cohosh|pennyroyal|mugwort|yarrow|herbal blend|botanical blend)\b/;

function facts(product) {
  const tags = new Set((product.tags || []).map((t) => String(t).toLowerCase()));
  const hf = new Set((product.healthFunctions || []).map((t) => String(t).toLowerCase()));
  const name = String(product.name || '').toLowerCase();
  const rawText = [product.name, product.summary, product.description, product.tagline, ...(product.badges || [])]
    .filter(Boolean).join(' ').toLowerCase();
  const text = NEGATED_PHRASES.reduce((t, re) => t.replace(re, ' '), rawText);
  const priceText = String(product.price || '').toLowerCase();
  const claims = claimText(text);
  return {
    // tc: text with benefit-denying sentences removed (for "mentions X" rules).
    tc: (re) => re.test(claims),
    limited: product.evidenceStrength === 'limited',
    id: product.id, cat: String(product.category || '').toLowerCase(), type: String(product.type || '').toLowerCase(),
    tags, hf, name, text,
    has: (t) => tags.has(t), fn: (h) => hf.has(h), n: (re) => re.test(name), t: (re) => re.test(text),
    // Format words also appear in the price text ("$15 for 60 capsules").
    fmt: (re) => re.test(`${text} ${priceText} ${String(product.ingredients || '').toLowerCase()}`),
    isCat: (...c) => c.includes(String(product.category || '').toLowerCase()),
  };
}

// A care service: telehealth / virtual clinic (people, not a product).
function isCareService(f) {
  if (f.cat === 'diagnostics') return false;
  if (f.cat === 'telehealth') return true;
  return f.fn('telehealth') && f.t(/telehealth|virtual|clinicians?|online (birth control|doctor|clinic)|ob-gyns?/);
}

// ─── RELEVANCE RULES ────────────────────────────────────────────────────────
// Each rule: { id, why, when(f), set: { needId: level } | (f) => ({...}), cap?, roles? }
// The product's relevance for a need = MAX level over all matching rules,
// then any CAP from a matching rule is applied (MIN). Needs not set = 0.
// roles: care pathway role used by the UTI / BV modifiers.
export const RELEVANCE_RULES = [
  // ── OTC medicines and tests with guideline backing (evidence-backed basics, Oct 17) ──
  { id: 'otc_nsaid', why: 'An NSAID pain reliever; NSAIDs are first-line for period cramps (NHS, MedlinePlus).',
    when: (f) => f.n(/ibuprofen|naproxen/), set: { 'pain.menstrual_cramp': DIRECT, 'pain.pelvic': SECONDARY, 'pain.cycle_headache': SECONDARY, 'pain.joint': SECONDARY, 'condition_support.endometriosis': SECONDARY, 'condition_support.adenomyosis': SECONDARY } },
  { id: 'otc_azole', why: 'An OTC azole antifungal, the standard treatment for an uncomplicated yeast infection (CDC).',
    when: (f) => f.n(/miconazole|clotrimazole|monistat/), set: { 'vaginal.yeast': DIRECT, 'vaginal.irritation': SECONDARY } },
  { id: 'minoxidil', why: 'Topical minoxidil is the most recommended treatment for female pattern hair loss (AAD).',
    when: (f) => f.n(/minoxidil|rogaine/), set: { 'hair.loss': DIRECT } },
  { id: 'sti_home_test', why: 'An FDA-authorized at-home test for chlamydia, gonorrhea and trichomoniasis.',
    when: (f) => f.n(/sti test|chlamydia|gonorrh|trichomon/), set: { 'sexual.sti': DIRECT, 'vaginal.discharge': SECONDARY } },
  // ── Period products ────────────────────────────────────────────────────
  { id: 'period_product', why: 'Pads, tampons, cups, discs and period underwear are made for period care.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat), set: { 'period.product_support': DIRECT } },
  { id: 'period_high_capacity', why: 'High-capacity or heavy-flow period products are strong picks for heavy periods.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat) && (f.has('heavy-flow') || ['high', 'highest'].includes(capacityFor(f))),
    set: { 'period.heavy': STRONG } },
  { id: 'period_regular_capacity_heavy', why: 'Ordinary-capacity period products only loosely fit heavy periods.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat) && !['very_light'].includes(capacityFor(f)), set: { 'period.heavy': ADJACENT } },
  { id: 'period_light_capacity', why: 'Liners and light or mini products are made for light flow and spotting.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat) && ['very_light', 'light'].includes(capacityFor(f)),
    set: { 'period.light': STRONG, 'cycle.spotting': STRONG, 'period.heavy': WEAK } },
  { id: 'period_underwear_light', why: 'Period underwear works as backup for light days and spotting.',
    when: (f) => f.cat === 'period-underwear', set: { 'period.light': SECONDARY, 'cycle.spotting': SECONDARY } },
  { id: 'period_other_light', why: 'Other period products only loosely fit light periods.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat), set: { 'period.light': ADJACENT, 'cycle.spotting': WEAK } },
  { id: 'cup_steamer', why: 'A cup steamer supports reusable period care.',
    when: (f) => f.cat === 'cup-steamer', set: { 'period.product_support': SECONDARY } },

  // ── Cramps and pelvic pain ─────────────────────────────────────────────
  { id: 'cramp_device', why: 'Heat and TENS devices are made for period cramps.',
    when: (f) => f.cat === 'cramp-relief' && !f.has('accessory') && f.t(/heat|tens\b|transcutaneous|heating|warm/),
    set: (f) => ({ 'pain.menstrual_cramp': DIRECT, 'pain.pelvic': SECONDARY, 'pain.abdominal': ADJACENT,
      'condition_support.endometriosis': f.has('endometriosis') ? SECONDARY : ADJACENT,
      // Adenomyosis pain is managed like period pain at home (heat, TENS) while care is sorted (Cleveland Clinic).
      'condition_support.adenomyosis': ADJACENT }) },
  { id: 'cramp_accessory', why: 'Refills only work with the device they belong to.',
    when: (f) => f.cat === 'cramp-relief' && f.has('accessory'), set: { 'pain.menstrual_cramp': SECONDARY } },
  { id: 'cramp_supplement', why: 'Supplements marketed for cramps are a secondary option.',
    when: (f) => f.cat === 'supplement' && (f.fn('cramp-relief') || f.has('cramps')), set: { 'pain.menstrual_cramp': SECONDARY } },
  { id: 'cramp_period_product', why: 'A period product with comfort claims is only adjacent to cramp relief.',
    when: (f) => PERIOD_CATEGORIES.has(f.cat) && (f.fn('cramp-relief') || f.has('cramps')), set: { 'pain.menstrual_cramp': ADJACENT } },
  { id: 'pelvic_wand', why: 'A pelvic wand is made for pelvic trigger-point release.',
    when: (f) => f.cat === 'pelvic-floor' && f.n(/wand/), set: { 'pain.pelvic': DIRECT, 'pain.sexual': SECONDARY, 'pain.menstrual_cramp': WEAK } },
  { id: 'dilators', why: 'Dilators are made for vaginismus and pain with penetration.',
    when: (f) => f.n(/dilator/), set: { 'pain.sexual': DIRECT, 'pain.pelvic': SECONDARY } },
  { id: 'pelvic_pain_app', why: 'A pain-tracking app built for pelvic pain.',
    when: (f) => f.cat === 'tracker' && f.t(/pelvic pain|chronic pain/),
    set: (f) => ({ 'pain.pelvic': STRONG, 'pain.menstrual_cramp': ADJACENT, ...(f.t(/endometriosis/) ? { 'condition_support.endometriosis': STRONG } : {}) }),
    cap: { 'fertility.ovulation_tracking': WEAK, 'fertility.ttc': WEAK, 'cycle.irregular': ADJACENT } },

  // ── Pelvic floor and bladder ───────────────────────────────────────────
  { id: 'incontinence_product', why: 'Incontinence pads, liners, underwear and devices are made for bladder leaks.',
    when: (f) => f.cat === 'incontinence' || f.fn('bladder-leak-protection'), set: { 'urinary.incontinence': DIRECT } },
  { id: 'overactive_bladder_device', why: 'A device the catalog describes for overactive bladder (urge) symptoms.',
    when: (f) => f.cat === 'incontinence' && f.n(/overactive bladder|\burge\b/), set: { 'urinary.urgency': STRONG, 'urinary.frequency': SECONDARY } },
  { id: 'pelvic_floor_trainer', why: 'Pelvic floor trainers and programs target bladder leakage.',
    when: (f) => f.cat === 'pelvic-floor' && !f.n(/wand|bra|extender/) && !f.has('accessory') && f.t(/kegel|pelvic floor|leak|incontinen|bladder|resistance spring/),
    set: (f) => ({ 'urinary.incontinence': STRONG, 'fitness.strength': f.has('fitness') ? SECONDARY : ADJACENT,
      ...(f.has('postpartum') ? { 'postpartum.recovery': SECONDARY } : {}), ...(f.has('pregnancy') ? { 'pregnancy.discomfort': ADJACENT } : {}) }) },
  { id: 'pelvic_bra', why: 'A pelvic support garment helps with pressure and leaks.',
    when: (f) => f.n(/pelvic bra/) && !f.n(/extender/),
    set: { 'urinary.incontinence': SECONDARY, 'postpartum.recovery': SECONDARY, 'pregnancy.discomfort': ADJACENT, 'pain.pelvic': ADJACENT } },
  { id: 'pelvic_accessory', why: 'Accessories only support a main pelvic floor product.',
    when: (f) => f.cat === 'pelvic-floor' && (f.has('accessory') || f.n(/extender/)),
    set: { 'urinary.incontinence': WEAK, 'fitness.strength': WEAK, 'postpartum.recovery': WEAK } },

  // ── Cycle tracking, fertility, contraception ───────────────────────────
  { id: 'cycle_tracker', why: 'Cycle trackers help with irregular cycles and ovulation timing.',
    when: (f) => f.fn('cycle-tracking') && (f.cat === 'tracker' || f.type === 'digital') && !f.t(/menopause/) && !f.t(/chronic pain|pelvic pain/),
    set: (f) => ({ 'cycle.irregular': STRONG, 'cycle.missed': SECONDARY, 'cycle.pms': ADJACENT, 'mood.cycle_related': ADJACENT,
      'fertility.ovulation_tracking': f.n(/ovulation|fertility/) ? DIRECT : f.t(/ovulat|fertil/) ? STRONG : SECONDARY,
      'fertility.ttc': f.t(/fertil|conceive|ovulat/) ? SECONDARY : ADJACENT }) },
  { id: 'menopause_tracker', why: 'A symptom tracker made for perimenopause and menopause.',
    when: (f) => f.cat === 'tracker' && f.t(/menopause/),
    set: { 'vasomotor.hot_flashes': ctx(SECONDARY, 'menopause_transition'), 'vasomotor.night_sweats': ctx(ADJACENT, 'menopause_transition'),
      'menopause.body_changes': SECONDARY, 'cycle.irregular': ctx(ADJACENT, 'menopause_transition') } },
  { id: 'wearable_tracker', why: 'A wearable that tracks sleep and activity alongside the cycle.',
    when: (f) => f.cat === 'tracker' && f.t(/sleep/) && f.t(/ring|wearable|watch/),
    set: { 'sleep.trouble': SECONDARY, 'energy.fatigue': ADJACENT, 'fitness.strength': ADJACENT } },
  { id: 'contraception', why: 'Made for contraception.',
    when: (f) => f.fn('contraception') || f.has('contraception'), set: { 'sexual.contraception': DIRECT } },
  { id: 'fertility_testing', why: 'At-home hormone and fertility testing is made for ovulation tracking.',
    when: (f) => (f.cat === 'diagnostics' || f.cat === 'tracker') && (f.fn('fertility') || f.has('fertility')) && !f.n(/pregnancy test/),
    set: { 'fertility.ovulation_tracking': DIRECT, 'fertility.ttc': STRONG, 'fertility.support': STRONG, 'cycle.irregular': ADJACENT, 'hormonal.general': SECONDARY } },
  { id: 'pregnancy_test', why: 'A home pregnancy test.',
    when: (f) => f.n(/pregnancy test/), set: { 'fertility.ttc': SECONDARY, 'cycle.missed': SECONDARY, 'pregnancy.prenatal': WEAK } },
  { id: 'perimenopause_hormone_test', why: 'At-home hormone testing for perimenopause.',
    when: (f) => f.cat === 'diagnostics' && f.fn('perimenopause'),
    set: { 'hormonal.general': STRONG, 'menopause.body_changes': SECONDARY, 'cycle.irregular': SECONDARY } },
  { id: 'fertility_program', why: 'A clinician-reviewed fertility program.',
    when: (f) => f.cat === 'telehealth' && f.fn('fertility'),
    set: { 'fertility.support': DIRECT, 'fertility.ttc': STRONG, 'fertility.ovulation_tracking': STRONG } },
  { id: 'fertility_supplement', why: 'A supplement marketed for fertility is a secondary option.',
    when: (f) => f.cat === 'supplement' && (f.has('fertility') || f.fn('fertility')), set: { 'fertility.support': SECONDARY, 'fertility.ttc': SECONDARY } },

  // ── Hormonal conditions ────────────────────────────────────────────────
  { id: 'pcos_tagged', why: 'Catalog marks this for PMOS.',
    when: (f) => f.has('pcos'), set: (f) => ({ 'condition_support.pcos': f.n(/inositol/) ? STRONG : SECONDARY, 'hormonal.general': WEAK }) },
  { id: 'pcos_mentioned', why: 'Mentions PMOS without being made for it.',
    when: (f) => !f.has('pcos') && f.tc(/\bpcos\b/), set: { 'condition_support.pcos': ADJACENT } },
  { id: 'androgen_mention', why: 'Mentions androgen or excess hair research.',
    when: (f) => f.tc(/androgen|hirsut/), set: { 'hair.excess': ADJACENT } },
  { id: 'endo_fibroid_clinic', why: 'Virtual clinic focused on endometriosis, fibroids and heavy periods.',
    when: (f) => isCareService(f) && f.t(/endometriosis|fibroid/),
    set: (f) => ({ ...(f.t(/endometriosis/) ? { 'condition_support.endometriosis': DIRECT } : {}),
      ...(f.t(/fibroid/) ? { 'condition_support.fibroids': DIRECT } : {}),
      ...(f.t(/adenomyosis/) ? { 'condition_support.adenomyosis': DIRECT } : {}),
      ...(f.t(/heavy period|heavy flow|heavy bleeding/) || f.has('heavy-flow') ? { 'period.heavy': STRONG } : {}),
      ...(f.has('cramps') ? { 'pain.menstrual_cramp': SECONDARY, 'pain.pelvic': SECONDARY } : {}) }) },
  { id: 'endo_tagged', why: 'Catalog marks this for endometriosis.',
    when: (f) => f.has('endometriosis'), set: { 'condition_support.endometriosis': ADJACENT } },
  { id: 'hormone_tagged', why: 'Catalog marks this as hormone-related (broad marketing, almost no weight).', broad: true,
    when: (f) => f.fn('hormone-balance') || f.has('hormonal') || f.has('hormone-support') || f.has('hormone-monitoring') || f.t(BROAD_MARKETING), set: { 'hormonal.general': WEAK } },

  // ── Care services (telehealth, virtual clinics) ────────────────────────
  { id: 'care_service', why: 'A telehealth or virtual care service.',
    when: (f) => isCareService(f), set: { 'care.telehealth': DIRECT, 'care.find_doctor': SECONDARY, 'hormonal.general': WEAK }, roles: ['care'] },
  { id: 'care_uti', why: 'Telehealth that treats UTIs.',
    when: (f) => isCareService(f) && (f.has('uti') || f.fn('uti-prevention') || f.t(/\buti\b/)),
    // Frequent urination or urgency alone does not mean a UTI: UTI care is a
    // useful secondary option for those, strong only for UTI-like symptoms.
    set: { 'urinary.burning': STRONG, 'urinary.frequency': SECONDARY, 'urinary.urgency': SECONDARY, 'urinary.recurrent_uti': STRONG }, roles: ['care'] },
  { id: 'care_sti', why: 'Telehealth that handles STI care.',
    when: (f) => isCareService(f) && f.t(/\bstis?\b|\bstds?\b|sexually transmitted/), set: { 'sexual.sti': STRONG }, roles: ['care'] },
  { id: 'care_bv', why: 'Telehealth that treats BV.',
    when: (f) => isCareService(f) && f.t(/\bbv\b|bacterial vaginosis/), set: { 'vaginal.bv': DIRECT, 'vaginal.discharge': SECONDARY, 'vaginal.odor': SECONDARY }, roles: ['care'] },
  { id: 'care_menopause', why: 'Virtual care focused on perimenopause and menopause.',
    when: (f) => isCareService(f) && (f.has('menopause') || f.cat === 'menopause' || f.t(/menopause/)),
    // A menopause clinic is relevant to hot flashes or night sweats only when
    // she shared the menopause transition; the symptom alone never unlocks it.
    set: { 'vasomotor.hot_flashes': ctx(STRONG, 'menopause_transition'), 'vasomotor.night_sweats': ctx(STRONG, 'menopause_transition'), 'menopause.body_changes': STRONG,
      'pain.joint': ctx(ADJACENT, 'menopause_transition'), 'sleep.trouble': ctx(ADJACENT, 'menopause_transition'), 'vaginal.dryness': ctx(SECONDARY, 'menopause_transition'),
      'sexual.libido': ctx(ADJACENT, 'menopause_transition'), 'cognition.brain_fog': ctx(ADJACENT, 'menopause_transition') }, roles: ['care'] },
  { id: 'care_mental_health', why: 'Telehealth that treats anxiety and depression.',
    when: (f) => isCareService(f) && (f.fn('mental-health') || f.has('mental-health')),
    set: (f) => ({ 'mood.general_anxiety': STRONG, 'mood.low': STRONG, 'mood.pmdd': SECONDARY, 'mood.irritability': ADJACENT,
      ...(f.t(/\bskin\b/) ? { 'skin.acne': SECONDARY, 'skin.hormonal': SECONDARY } : {}), ...(f.t(/\bhair\b/) ? { 'hair.loss': SECONDARY } : {}) }), roles: ['care'] },
  { id: 'care_life_stage', why: 'Virtual women\'s health care that covers this life stage.',
    when: (f) => isCareService(f),
    set: (f) => ({ ...(f.has('pregnancy') ? { 'pregnancy.prenatal': STRONG, 'pregnancy.discomfort': SECONDARY } : {}),
      ...(f.has('postpartum') ? { 'postpartum.recovery': STRONG, 'postpartum.lactation': SECONDARY } : {}),
      ...(f.has('fertility') || f.t(/fertility/) ? { 'fertility.support': SECONDARY, 'fertility.ttc': SECONDARY } : {}),
      ...(f.has('irregular') ? { 'cycle.irregular': SECONDARY } : {}),
      ...(f.has('pcos') ? { 'condition_support.pcos': SECONDARY } : {}),
      ...(f.t(/therapist|mental health/) ? { 'mood.low': SECONDARY, 'mood.general_anxiety': SECONDARY } : {}) }) },

  // ── Mental health and sleep ────────────────────────────────────────────
  { id: 'therapy_app', why: 'Therapy or CBT program.',
    when: (f) => f.cat === 'mental-health' && f.t(/therap|\bcbt\b|counsel/),
    set: { 'mood.general_anxiety': STRONG, 'mood.low': STRONG, 'mood.irritability': SECONDARY, 'mood.swings': SECONDARY, 'mood.pmdd': ADJACENT, 'mood.cycle_related': ADJACENT, 'care.telehealth': SECONDARY } },
  { id: 'meditation_app', why: 'Meditation and relaxation app.',
    when: (f) => f.cat === 'mental-health' && f.t(/meditat|mindful|sleep stor/),
    set: (f) => ({ 'mood.general_anxiety': SECONDARY, 'mood.low': ADJACENT, 'mood.irritability': ADJACENT, 'sleep.trouble': f.t(/sleep/) ? SECONDARY : ADJACENT }) },
  { id: 'community_app', why: 'Peer community app.',
    when: (f) => f.cat === 'mental-health' && f.t(/community|friends/),
    set: { 'mood.low': ADJACENT, 'pregnancy.prenatal': ADJACENT, 'postpartum.recovery': ADJACENT, 'fertility.ttc': ADJACENT, 'menopause.body_changes': ADJACENT } },
  { id: 'sleep_product', why: 'Made for sleep.',
    when: (f) => f.cat === 'sleep',
    set: (f) => ({ 'sleep.trouble': f.t(/heats? and cools?|temperature/) ? STRONG : SECONDARY }) },
  // Night sweats and hot flashes are heat symptoms. A product whose mechanism
  // is cooling addresses them directly, whatever their cause; no life stage
  // is needed. Menopause positioning only adds the context bonus.
  { id: 'cooling_sleep', why: 'Actively cools the bed at night, which directly targets nighttime heat and sweating.',
    when: (f) => f.cat === 'sleep' && f.t(/\bcool(s|ing)?\b/) && f.t(/heats? and cools?|temperature|cooling/),
    set: { 'vasomotor.night_sweats': STRONG, 'vasomotor.hot_flashes': ADJACENT } },
  { id: 'cooling_product', why: 'A cooling product made for hot flashes or night sweats.',
    when: (f) => f.cat !== 'sleep' && f.t(/\bcool(s|ing)?\b/) && f.t(/hot flash|night sweat/) && !f.t(/supplement|capsule|tablet/),
    set: (f) => ({ 'vasomotor.hot_flashes': f.n(/hot flash/) ? DIRECT : STRONG, 'vasomotor.night_sweats': f.t(/night sweat/) ? STRONG : ADJACENT }) },

  // ── Supplements by name / ingredient ───────────────────────────────────
  { id: 'iron_supplement', why: 'Iron supports energy when iron is low.',
    // Fatigue alone does not mean iron deficiency: iron is relevant to fatigue
    // only when she shared a confirmed anemia / iron deficiency diagnosis.
    when: (f) => f.cat === 'supplement' && f.n(/\biron\b/), set: { 'energy.fatigue': ctx(SECONDARY, 'anemia') } },
  { id: 'vitamin_d_only', why: 'Vitamin D alone is only adjacent to bone health.',
    when: (f) => f.cat === 'supplement' && f.n(/vitamin d/) && !f.n(/calcium/), set: { 'bone.health': ADJACENT } },
  { id: 'bone_health', why: 'Made for bone health.',
    when: (f) => f.fn('bone-health'), set: { 'bone.health': DIRECT, 'menopause.body_changes': ADJACENT } },
  { id: 'creatine', why: 'Creatine supports muscle strength.',
    when: (f) => f.n(/creatine/), set: { 'fitness.strength': STRONG, 'energy.fatigue': ADJACENT, 'cognition.brain_fog': ADJACENT, 'menopause.body_changes': ADJACENT } },
  { id: 'b_complex', why: 'B vitamins support energy.',
    when: (f) => f.n(/b-complex|b complex/), set: { 'energy.fatigue': SECONDARY } },
  { id: 'magnesium', why: 'Magnesium is marketed for sleep alongside cramps.',
    when: (f) => f.cat === 'supplement' && f.n(/magnesium/), set: { 'sleep.trouble': ADJACENT } },
  // Calcium has randomized-trial evidence for easing PMS symptoms (Thys-Jacobs,
  // J Am Coll Nutr 2000, pubmed.ncbi.nlm.nih.gov/10763903). Audit catalog gap fix:
  // PMS was covered almost only by products with "PMS" in their name.
  { id: 'calcium_pms', why: 'Calcium has trial evidence for easing PMS symptoms.',
    when: (f) => ['supplement', 'menopause'].includes(f.cat) && f.n(/calcium/), set: { 'cycle.pms': SECONDARY, 'mood.cycle_related': ADJACENT } },
  { id: 'pms_named', why: 'Made for PMS.',
    when: (f) => f.n(/\bpms\b/), set: { 'cycle.pms': DIRECT } },
  { id: 'pms_tagged', why: 'Studied or marketed for PMS symptoms.',
    when: (f) => f.has('pms') || (f.cat === 'supplement' && f.t(/\bpms\b/)),
    set: (f) => ({ 'cycle.pms': SECONDARY, ...(f.t(/mood/) ? { 'mood.cycle_related': SECONDARY, 'mood.swings': SECONDARY } : {}) }) },
  { id: 'breast_tenderness', why: 'Marketed or studied for breast tenderness.',
    when: (f) => f.has('breast-tenderness'), set: { 'cycle.breast_tenderness': SECONDARY } },
  { id: 'bloat_text', why: 'Made for bloating.',
    when: (f) => f.t(/bloat/) && !PERIOD_CATEGORIES.has(f.cat),
    set: (f) => ({ 'bloating.unspecified': STRONG, 'pain.abdominal': ADJACENT,
      'bloating.digestive': f.t(/digest|enzyme/) ? STRONG : SECONDARY,
      'bloating.cycle_related': f.t(/cycle|period|\bpms\b|menstrual|hormonal bloat/) ? STRONG : ADJACENT,
      'digestive.gas': f.t(/enzyme|\bgas\b/) ? SECONDARY : WEAK }) },
  { id: 'bloat_tag_only', why: 'Catalog tags bloating but the product is not made for it.',
    when: (f) => f.has('bloating') && !f.t(/bloat/),
    set: { 'bloating.cycle_related': ADJACENT, 'bloating.unspecified': ADJACENT, 'bloating.digestive': WEAK } },
  { id: 'menopause_supplement', why: 'Supplement or product marketed for menopause symptoms.',
    when: (f) => (f.cat === 'menopause' || (f.cat === 'supplement' && f.has('menopause') && !f.n(/creatine/))) && !isCareService(f),
    // Positioned for menopause: relevant to her symptoms only in the
    // menopause transition context she shared (CONTEXTUAL), never from the
    // symptom alone.
    set: (f) => ({
      'menopause.body_changes': SECONDARY,
      ...(f.t(/hot flash/) ? { 'vasomotor.hot_flashes': ctx(f.n(/hot flash/) ? DIRECT : STRONG, 'menopause_transition') } : {}),
      ...(f.t(/night sweat/) ? { 'vasomotor.night_sweats': ctx(STRONG, 'menopause_transition') } : {}),
      ...(f.t(/mood/) ? { 'mood.swings': ctx(SECONDARY, 'menopause_transition') } : {}),
      ...(f.t(/memory|cognit/) ? { 'cognition.brain_fog': ctx(SECONDARY, 'menopause_transition'), 'cognition.concentration': ctx(ADJACENT, 'menopause_transition') } : {}),
      ...(f.t(/sleep/) ? { 'sleep.trouble': ctx(SECONDARY, 'menopause_transition') } : {}) }) },
  { id: 'prenatal', why: 'A prenatal vitamin.',
    when: (f) => f.n(/prenatal/), set: { 'pregnancy.prenatal': DIRECT, 'fertility.ttc': SECONDARY, 'postpartum.lactation': ADJACENT } },
  { id: 'probiotic_vaginal', why: 'A general probiotic is not a BV or yeast treatment.',
    when: (f) => f.cat === 'supplement' && f.t(/probiotic|lactobacill/) && !f.t(/bloat/),
    set: (f) => ({ 'vaginal.discharge': ADJACENT, 'vaginal.odor': ADJACENT, 'vaginal.bv': ADJACENT, 'vaginal.yeast': ADJACENT,
      ...(f.has('uti') ? { 'urinary.recurrent_uti': ADJACENT } : {}) }),
    cap: { 'vaginal.bv': ADJACENT, 'vaginal.yeast': ADJACENT }, roles: ['prevention'] },

  // ── Urinary ────────────────────────────────────────────────────────────
  { id: 'uti_prevention', why: 'D-mannose and cranberry are used to help prevent recurrent UTIs, not to treat a current one.',
    when: (f) => f.t(/d-mannose|cranberry/) && !f.t(/test strip|rapid test|\btest\b/),
    set: { 'urinary.recurrent_uti': STRONG, 'urinary.burning': WEAK, 'urinary.frequency': WEAK, 'urinary.urgency': WEAK }, roles: ['prevention'] },
  { id: 'uti_test', why: 'An at-home UTI test.',
    when: (f) => (f.has('uti') || f.fn('uti-prevention')) && f.t(/test strip|uti test|rapid test|\btest\b/),
    // Frequent urination / urgency alone do not mean a UTI: a UTI test is a
    // useful secondary check for them, strong for UTI-like symptoms.
    set: { 'urinary.burning': DIRECT, 'urinary.frequency': SECONDARY, 'urinary.urgency': SECONDARY, 'urinary.recurrent_uti': STRONG },
    roles: (f) => (f.fn('telehealth') ? ['testing', 'care'] : ['testing']) },
  { id: 'uti_symptom_relief', why: 'Short-term urinary pain relief.',
    when: (f) => (f.has('uti') || f.fn('uti-prevention')) && f.t(/phenazopyridine|urinary pain relief|pain relief/),
    set: { 'urinary.burning': STRONG, 'urinary.urgency': ADJACENT, 'urinary.frequency': ADJACENT, 'urinary.recurrent_uti': WEAK }, roles: ['symptom_relief'] },

  // ── Vaginal and vulvar ─────────────────────────────────────────────────
  { id: 'vaginal_ph_test', why: 'At-home vaginal pH test with a care path.',
    when: (f) => f.cat === 'diagnostics' && f.fn('vaginal-health'),
    set: { 'vaginal.bv': DIRECT, 'vaginal.discharge': STRONG, 'vaginal.odor': STRONG, 'vaginal.yeast': SECONDARY, 'vaginal.irritation': SECONDARY, 'sexual.sti': ADJACENT },
    roles: (f) => (f.fn('telehealth') ? ['testing', 'care'] : ['testing']) },
  { id: 'boric_acid_suppository', why: 'Boric acid suppositories are an OTC option for pH, odor, BV and yeast recurrences.',
    when: (f) => f.t(/boric acid/) && f.t(/suppositor/) && !f.n(/odor/),
    set: { 'vaginal.bv': SECONDARY, 'vaginal.yeast': SECONDARY, 'vaginal.odor': SECONDARY, 'vaginal.discharge': ADJACENT } },
  { id: 'odor_suppository', why: 'Made for vaginal odor.',
    when: (f) => f.n(/odor/) && f.fn('vaginal-health'),
    set: { 'vaginal.odor': DIRECT, 'vaginal.discharge': SECONDARY, 'vaginal.irritation': ADJACENT, 'vaginal.bv': ADJACENT } },
  { id: 'intimate_wash', why: 'External intimate washes and wipes are only adjacent to odor concerns.',
    when: (f) => f.fn('vaginal-health') && f.t(/\bwash\b|\bwipes?\b|cleanser/) && !f.t(/peri wash|recovery/),
    set: (f) => ({ 'vaginal.odor': f.t(/odor/) ? SECONDARY : ADJACENT, 'vaginal.irritation': WEAK }) },
  { id: 'exfoliating_pads', why: 'Exfoliating pads for ingrown hairs and razor burn.',
    when: (f) => f.n(/exfoliat/), set: { 'vaginal.irritation': WEAK } },
  { id: 'vaginal_moisturizer', why: 'Vaginal moisturizers are made for dryness.',
    when: (f) => (f.cat === 'intimate-care' || f.cat === 'menopause' || f.fn('vaginal-health'))
      && (f.n(/moisturiz|lotion|\bgel\b|glides?\b|dryness/) || f.t(/vaginal moisturizer|moisturizing gel|vaginal dryness/))
      && !f.t(/\bwash\b|wipes?\b|boric acid/) && !f.n(/balm|refill|applicator|odor/) && f.cat !== 'postpartum',
    set: { 'vaginal.dryness': DIRECT, 'pain.sexual': SECONDARY, 'menopause.body_changes': SECONDARY, 'vaginal.irritation': ADJACENT },
    cap: (f) => (f.n(/arousal/) ? { 'vaginal.dryness': SECONDARY } : null) },
  { id: 'vulva_balm', why: 'External vulva balms soothe vulvar dryness and irritation.',
    when: (f) => f.n(/balm/) && f.t(/vulva/) && !f.n(/arousal/),
    set: (f) => ({ 'vaginal.dryness': STRONG, 'vaginal.irritation': SECONDARY, 'menopause.body_changes': ADJACENT,
      ...(f.has('postpartum') ? { 'postpartum.body_skin': ADJACENT } : {}) }) },
  { id: 'arousal_balm', why: 'An arousal product for sexual wellness.',
    when: (f) => f.n(/arousal/), set: { 'sexual.wellness': STRONG, 'sexual.libido': ADJACENT, 'vaginal.dryness': SECONDARY } },
  { id: 'applicator_refill', why: 'Refills only work with the product they belong to.',
    when: (f) => f.n(/refill|applicator/) && f.fn('vaginal-health') && !f.n(/miconazole|clotrimazole|monistat/), set: { 'vaginal.dryness': ADJACENT },
    cap: { 'vaginal.dryness': ADJACENT, 'pain.sexual': WEAK } },
  { id: 'lubricant', why: 'Lubricant eases friction during sex.',
    when: (f) => f.t(/lubricant|\blube\b/),
    set: { 'sexual.wellness': STRONG, 'vaginal.dryness': SECONDARY, 'pain.sexual': SECONDARY } },
  { id: 'sex_device', why: 'Sexual wellness device.',
    when: (f) => f.cat === 'sex-tech' && !f.t(/lubricant|\blube\b/),
    set: (f) => ({ 'sexual.wellness': DIRECT, 'sexual.libido': SECONDARY, 'pain.sexual': WEAK,
      ...(f.fn('perimenopause') ? { 'menopause.body_changes': ADJACENT } : {}) }) },
  { id: 'libido_supplement', why: 'Marketed to support libido.',
    when: (f) => f.cat === 'supplement' && f.t(/libido/), set: { 'sexual.libido': STRONG, 'menopause.body_changes': ADJACENT } },

  // ── Postpartum and pregnancy ───────────────────────────────────────────
  { id: 'postpartum_recovery_kit', why: 'Made for recovery after birth.',
    when: (f) => f.cat === 'postpartum' && f.t(/recovery (kit|system)|after birth|peri (wash|bottle)|perineal/),
    set: { 'postpartum.recovery': DIRECT, 'pain.postpartum': STRONG } },
  { id: 'lactation_device', why: 'Made for breastfeeding or pumping.',
    when: (f) => f.n(/pump|nursing (pads?|cups?)/), set: { 'postpartum.lactation': DIRECT } },
  { id: 'lactation_support', why: 'Supports breastfeeding comfort.',
    when: (f) => f.t(/breastfeed|nursing|lactat|nipple/) && (f.cat === 'postpartum' || f.cat === 'pregnancy' || f.has('postpartum')),
    set: { 'postpartum.lactation': STRONG } },
  { id: 'scar_body_oil', why: 'Made for scars and body skin changes.',
    when: (f) => f.t(/\bscars?\b|stretch marks?/),
    set: (f) => ({ 'postpartum.body_skin': f.has('postpartum') ? STRONG : ADJACENT, ...(f.has('pregnancy') ? { 'pregnancy.discomfort': SECONDARY } : {}) }) },
  { id: 'postpartum_body_balm', why: 'Body and skin care positioned for postpartum.',
    when: (f) => f.cat === 'postpartum' && f.t(/dry skin|body|skin/), set: { 'postpartum.body_skin': SECONDARY } },
  { id: 'postpartum_tagged', why: 'Catalog marks this as postpartum-relevant.',
    when: (f) => f.has('postpartum'), set: { 'postpartum.recovery': ADJACENT } },
  { id: 'pregnancy_support_band', why: 'Made for pregnancy back and pelvic pressure.',
    when: (f) => f.has('pregnancy') && f.n(/\bband\b|bandit/), set: { 'pregnancy.discomfort': DIRECT, 'pain.pelvic': ctx(ADJACENT, 'pregnancy') } },
  { id: 'pregnancy_pillow', why: 'Made for sleep comfort in pregnancy.',
    when: (f) => f.has('pregnancy') && f.n(/pillow/), set: { 'pregnancy.discomfort': STRONG, 'sleep.trouble': ctx(SECONDARY, 'pregnancy') } },
  { id: 'pregnancy_tagged', why: 'Made with pregnancy in mind.',
    when: (f) => f.has('pregnancy') || f.cat === 'pregnancy',
    set: (f) => ({ 'pregnancy.safe_discovery': f.has('pregnancy') ? STRONG : SECONDARY, 'pregnancy.prenatal': ADJACENT }) },

  // ── Skin, digestion, joints, cognition, fitness, energy, sleep tags ────
  { id: 'acne_tagged', why: 'Catalog marks this for acne.',
    when: (f) => f.has('acne'), set: { 'skin.acne': SECONDARY, 'skin.hormonal': ADJACENT } },
  { id: 'nausea_text', why: 'Mentions nausea relief.',
    when: (f) => f.t(/nausea/) && f.cat === 'supplement',
    // Nausea alone never means pregnancy; morning-sickness products need the pregnancy context.
    set: (f) => ({ 'digestive.nausea': f.t(/morning sickness|pregnan/) ? ctx(SECONDARY, 'pregnancy') : SECONDARY }) },
  { id: 'constipation_text', why: 'Made for constipation.',
    when: (f) => f.t(/constipat|laxative|stool softener/), set: { 'digestive.constipation': STRONG } },
  { id: 'diarrhea_text', why: 'Made for diarrhea.',
    when: (f) => f.t(/diarrh/), set: { 'digestive.diarrhea': STRONG } },
  { id: 'joint_text', why: 'Mentions joint support.',
    when: (f) => f.t(/\bjoints?\b/) && f.cat === 'supplement', set: { 'pain.joint': SECONDARY } },
  { id: 'cognition_text', why: 'Marketed for focus or memory.',
    when: (f) => f.cat === 'supplement' && f.t(/brain fog|memory|cognit/), set: { 'cognition.brain_fog': SECONDARY, 'cognition.concentration': ADJACENT } },
  { id: 'fitness_tagged', why: 'Fitness-oriented.',
    when: (f) => (f.has('fitness') || f.fn('fitness-cycle')) && !f.has('accessory'), set: { 'fitness.strength': SECONDARY } },
  { id: 'energy_tagged', why: 'Catalog marks this for energy.',
    // Iron is handled by iron_supplement (fatigue only with a confirmed deficiency).
    when: (f) => (f.has('energy') || f.has('fatigue')) && !f.n(/\biron\b/), set: { 'energy.fatigue': SECONDARY } },
  { id: 'sleep_tagged', why: 'Catalog marks this for sleep.',
    // Menopause-positioned supplements get sleep only in that context (menopause_supplement).
    when: (f) => (f.has('sleep') || f.fn('sleep')) && !(f.cat === 'menopause' || (f.cat === 'supplement' && f.has('menopause'))), set: { 'sleep.trouble': SECONDARY } },
  { id: 'sleep_energy_group', why: 'Catalog groups this under sleep and energy.',
    when: (f) => f.fn('sleep-energy') && !f.has('sleep') && !f.n(/\biron\b/), set: { 'energy.fatigue': ADJACENT } },
  { id: 'accessory_cap', why: 'Accessories never rank above the product they belong to.',
    when: (f) => f.has('accessory'), set: {}, cap: { '*': SECONDARY } },
  // Spec: 0.80 means strong evidence or relevance. A product the catalog marks
  // as having limited evidence is at most a useful secondary option.
  { id: 'limited_evidence_cap', why: 'Evidence for this product is limited, so it is at most a secondary option.',
    when: (f) => f.limited, set: {}, cap: { '*': SECONDARY } },
];

// ─── Menstrual product characteristics ──────────────────────────────────────
// capacity: very_light | light | regular | high | highest
function capacityFor(f) {
  if (!PERIOD_CATEGORIES.has(f.cat)) return null;
  if (f.n(/liner/) || (!f.fn('menstrual-collection') && f.fn('leak-protection') && f.cat === 'pad')) return 'very_light';
  if (f.n(/\bmini\b|\blight\b|\blite\b/) || f.t(/lighter-flow|light to moderate/)) return 'light';
  if (f.n(/overnight|super plus|maximum|\bultra\b(?![- ]thin)/) || f.t(/high capacity|holds \d+x|extra-long/)) return 'highest';
  if (f.cat === 'cup' || f.cat === 'disc') return 'high';
  if (f.has('heavy-flow') || f.n(/\bsuper\b/)) return 'high';
  return 'regular';
}

// Capacity in mL (Oct 26, match honesty). Read only from facts the brand
// itself states: a passport fact whose source is the brand's own page, or a
// catalog line that says "per the brand". A retailer listing or a lab study of
// the product type is not used (founder rule: product facts come from the
// brand's own website). Every size the brand lists, e.g. Small 25 mL and
// Regular 30 mL; null when nothing usable is on file, which the engine treats
// as unknown, never as a fit.
const BRAND_SOURCES = new Set(['brand', 'manufacturer']);
const SIZE_WORD = /\b(Teen|Mini|Small|Short|Regular|Medium|Large|Tall)\b/g;
export function parseCapacityMl(text) {
  const t = String(text || '');
  const sizes = [];
  const re = /(\d+(?:\.\d+)?)\s*m[lL]\b/g;
  let m;
  let prevEnd = 0;
  while ((m = re.exec(t))) {
    const ml = Number(m[1]);
    if (!(ml > 0 && ml < 500)) { prevEnd = m.index + m[0].length; continue; }
    const after = t.slice(m.index + m[0].length).match(/^\s*\(\s*(Teen|Mini|Small|Short|Regular|Medium|Large|Tall)\s*\)/);
    let label = after ? after[1] : null;
    if (!label) {
      const before = [...t.slice(prevEnd, m.index).matchAll(SIZE_WORD)];
      label = before.length ? before[before.length - 1][1] : null;
    }
    if (!sizes.some((x) => x.ml === ml && x.label === label)) sizes.push({ label, ml });
    prevEnd = m.index + m[0].length;
  }
  return sizes;
}
/** True when the brand's own page (passport fact) says the product is reusable. */
function reusableByBrand(passport) {
  return [['identity', 'variant'], ['pricing', 'size_count'], ['composition', 'dosage']].some((path) => {
    const fact = passport?.[path[0]]?.[path[1]];
    return Boolean(fact?.known && BRAND_SOURCES.has(fact.source_type) && typeof fact.value === 'string' && /\breusable\b/i.test(fact.value) && !/single[- ]use|disposable/i.test(fact.value));
  });
}
function capacityMlFor(product, passport, f) {
  if (!['cup', 'disc', 'period-underwear'].includes(f.cat)) return null;
  for (const path of [['identity', 'variant'], ['pricing', 'size_count'], ['composition', 'dosage']]) {
    const fact = passport?.[path[0]]?.[path[1]];
    if (!fact?.known || !BRAND_SOURCES.has(fact.source_type)) continue;
    const sizes = parseCapacityMl(typeof fact.value === 'string' ? fact.value : '');
    if (sizes.length) return { sizes, max: Math.max(...sizes.map((x) => x.ml)), source: fact.source || null, source_url: fact.source_url || null };
  }
  const line = String(product.effectiveness || '');
  if (/\bper the brand\b/i.test(line)) {
    const sizes = parseCapacityMl(line);
    if (sizes.length) return { sizes, max: Math.max(...sizes.map((x) => x.ml)), source: 'catalog (per the brand)', source_url: product.url || null };
  }
  return null;
}

// ─── Formats ────────────────────────────────────────────────────────────────
function formatsFor(f) {
  const out = new Set();
  if (PERIOD_CATEGORIES.has(f.cat) || f.cat === 'cup-steamer') out.add('period_care');
  if (f.type === 'digital' || f.cat === 'telehealth' || (f.cat === 'mental-health' && f.type !== 'physical')) out.add('app_service');
  if (f.cat === 'diagnostics' || f.t(/test strips?|rapid test/)) out.add('test_kit');
  if (f.fmt(/gumm/)) out.add('gummy');
  if (((f.cat === 'supplement' || f.cat === 'medication') && f.fmt(/capsule|tablet|softgel|caplet|\bcaps\b|\bpills?\b/))
    // A swallowed pill sold in another category (e.g. calcium caplets under Menopause) is still a pill.
    || f.n(/\b(caplets?|capsules?|tablets?|softgels?)\b/)) out.add('pill_capsule');
  if (f.cat === 'supplement' && f.fmt(/powder/)) out.add('powder');
  // A tea you drink, not a serum or wash that lists green tea extract.
  if (f.n(/\btea\b/) || (f.cat === 'supplement' && f.t(/\btea\b/) && !f.t(/tea tree/))) out.add('drink_tea');
  if (f.t(/suppositor/)) out.add('suppository');
  if (f.t(/lotion|cream|\bgel\b|balm|moisturiz|lubricant|\blube\b|\boil\b|spray|wash|wipes|exfoliating pads|glides?\b/) && !f.t(/gel pad/) && !out.has('suppository')) out.add('topical');
  if (f.n(/heat wrap|patch/) || (f.cat === 'cramp-relief' && f.t(/adhesive/))) out.add('patch');
  if (['sex-tech', 'sleep', 'tracker', 'cramp-relief', 'pelvic-floor', 'incontinence'].includes(f.cat) && f.type !== 'digital'
    && !out.has('topical') && !out.has('patch') && !f.n(/\bliners?\b|underwear|\bbra\b|shoe|kneeling|extender/)
    && !(f.cat === 'incontinence' && f.n(/\bpads?\b/))) out.add('device');
  if (f.n(/pump|dilator|wand|trainer|kegel/)) out.add('device');
  if (f.n(/bra\b|pelvic bra|belly|band|pillow|underwear/) && f.cat !== 'period-underwear') out.add('apparel_support');
  return [...out];
}

// ─── Price ──────────────────────────────────────────────────────────────────
/** Parse free-text catalog prices into numbers. Nothing is invented: unparseable -> amount null. */
export function parsePrice(raw) {
  const text = String(raw ?? '').trim();
  const result = { raw: text, amount: null, max: null, currency: null, recurring: null, is_free: false };
  if (!text) return result;
  if (/^free\b/i.test(text)) { result.is_free = true; result.amount = 0; result.currency = 'USD'; }
  const m = text.match(/([$€£])\s*([\d,]+(?:\.\d+)?)(?:\s*[–-]\s*\$?([\d,]+(?:\.\d+)?))?/);
  if (m && !result.is_free) {
    result.currency = m[1] === '$' ? 'USD' : m[1] === '€' ? 'EUR' : 'GBP';
    result.amount = Number(m[2].replace(/,/g, ''));
    result.max = m[3] ? Number(m[3].replace(/,/g, '')) : null;
  }
  if (/\/\s*month|\/mo\b|per month|a month|\/week|per week/i.test(text)) result.recurring = /week/i.test(text) ? 'week' : 'month';
  return result;
}

// ─── Safety attribute statuses ──────────────────────────────────────────────
// Each attribute: 'yes' | 'no' | 'unknown' | 'not_applicable'.
// Order per attribute: avoidIfSensitivity -> 'yes'; a variant statement
// ("fragrance-free versions available") -> 'unknown' + variant; a "free of"
// claim -> 'no' (unless a positive mention remains) ; positive mention -> 'yes';
// otherwise 'unknown'. Silence is never 'no'.
export const ATTRIBUTE_RULES = {
  fragrance: {
    variant: /(fragrance[- ]free|unscented) (options?|versions?|variants?)|in scented versions?|scented versions?/,
    free: /fragrance[- ]free|unscented|no (added )?fragrance|without fragrance|free (from|of)[^.;]{0,60}fragrances?|no synthetic fragrance/,
    yes: /\bfragrances?\b|\bparfum\b|\bscented\b|\bperfumed?\b/,
    ignore: /fragrance (sensitivit(y|ies)|allerg(y|ies))/,
    avoidKeys: ['fragrance'],
  },
  latex: { free: /latex[- ]free|no latex|without latex|free (from|of)[^.;]{0,40}latex/, yes: /\blatex\b|natural rubber/, avoidKeys: ['latex'],
    ignore: /latex[- ](compatible|safe|condoms?)|(safe|compatible) (with|for) latex( condoms?)?|with latex condoms?/ },
  dyes: { free: /dye[- ]free|no dyes?|free (from|of)[^.;]{0,60}dyes?|undyed/, yes: /\bdyes?\b|\bdyed\b|colorants?|fd&c/, avoidKeys: ['dyes'] },
  parabens: { free: /paraben[- ]free|no parabens?|free (from|of)[^.;]{0,60}parabens?/, yes: /\bparabens?\b|methylparaben|propylparaben/ },
  sulfates: { free: /sulfate[- ]free|no sulfates?|free (from|of)[^.;]{0,60}sulfates?/, yes: /\bsulfates?\b|lauryl sulfate|laureth sulfate/, ignore: /ferrous sulfate|zinc sulfate|magnesium sulfate|sulfate\)/ },
  phthalates: { free: /phthalate[- ]free|no phthalates?|free (from|of)[^.;]{0,60}phthalates?/, yes: /\bphthalates?\b/ },
  synthetic_materials: {
    free: /plastic[- ]free|100% (certified )?(organic )?cotton inside and out|all[- ]natural materials/,
    yes: /polyethylene|polypropylene|\bsynthetic\b|polyester|nylon|spandex|\bplastic\b|silicone|\bbio-?pe\b|polymer|\bpu\b|tpe\b/,
    avoidKeys: ['synthetic'],
  },
  animal_derived: { free: /\bvegan\b|animal[- ]free/, yes: /\bgelatin\b|(?<!-)\blanolin\b(?![- ]free)|beeswax|collagen|fish oil|bovine|carmine|\bhoney\b(?! pot)|\bwhey\b/ },
  added_sugar: { free: /sugar[- ]free|no (added )?sugar|zero sugar/, yes: /\bcane sugar\b|\badded sugar\b|glucose syrup|\bsugar\b/ },
  artificial_sweeteners: { free: /no artificial sweeteners?|artificial[- ]sweetener[- ]free/, yes: /sucralose|aspartame|acesulfame|saccharin/ },
  essential_oils: { free: /essential[- ]oil[- ]free|no essential oils?/, yes: /essential oils?|lavender|peppermint|tea tree|eucalyptus|\bmint\b|herb-infused|herbal-infused/, avoidKeys: ['essential-oils'] },
  adhesives: { free: /adhesive[- ]free|no adhesive/, yes: /adhesive/, ignore: /bioadhesive/ },
  nickel: { free: /nickel[- ]free/, yes: /\bnickel\b/ },
  preservatives: { free: /preservative[- ]free|no preservatives?/, yes: /preservatives?|phenoxyethanol|benzoate|sorbate|parabens?/ },
  gluten: { free: /gluten[- ]free/, yes: /\bgluten\b|\bwheat\b/ },
  soy: { free: /soy[- ]free/, yes: /\bsoy\b/ },
  dairy: { free: /dairy[- ]free|lactose[- ]free/, yes: /\bdairy\b|\bmilk\b|lactose|\bwhey\b|casein/, ignore: /breast milk|milk (supply|production)|let-down/ },
  hormones: { free: /hormone[- ]free|non-?hormonal|estrogen[- ]free|drug[- ]free/, yes: /bioidentical|progesterone (oil|cream|gel)|estradiol|estrogen (cream|gel|patch|ring)|testosterone (cream|gel)/ },
  nsaid: { free: /nsaid[- ]free/, yes: /\bibuprofen\b|\bnaproxen\b|\bnsaids?\b/ },
  aspirin: { free: /aspirin[- ]free/, yes: /\baspirin\b/ },
  acetaminophen: { free: /acetaminophen[- ]free/, yes: /\bacetaminophen\b/ },
};
// Attributes that only make sense for products that touch or enter the body.
const INGESTED_ONLY = new Set(['added_sugar', 'artificial_sweeteners', 'gluten', 'soy', 'dairy', 'nsaid', 'aspirin', 'acetaminophen']);

function safetyText(product) {
  const s = product.safety || {};
  return [product.name, product.summary, product.ingredients, s.materials, s.allergens, ...(product.badges || []), ...(product.tags || [])]
    .filter(Boolean).join(' . ').toLowerCase();
}

function attributeStatus(product, attr, rule, ctx) {
  if (ctx.isDigital) return { status: 'not_applicable' };
  if (INGESTED_ONLY.has(attr) && !ctx.ingested) return { status: 'not_applicable' };
  const avoid = (product.avoidIfSensitivity || []).map((x) => String(x).toLowerCase());
  if ((rule.avoidKeys || []).some((k) => avoid.includes(k))) return { status: 'yes', source: 'avoidIfSensitivity' };
  // "Check label for soy" means the catalog does not know: never a 'yes' or a 'no'.
  let text = ctx.text.replace(/check (the )?(label|packaging) for[^.;]*/g, ' ');
  if (rule.ignore) text = text.replace(new RegExp(rule.ignore.source, 'g'), ' ');
  if (rule.variant && rule.variant.test(text)) return { status: 'unknown', variant: true, source: 'catalog text (variant-dependent)' };
  // A negated list in the same clause also counts as a "free of" claim:
  // "no BPA, latex, dyes, or chemicals" -> latex 'no', dyes 'no'.
  const listFree = rule.yes ? new RegExp(`\\b(no|free (from|of)|without|zero)\\b[^.;:]{0,60}?(${rule.yes.source})`, 'g') : null;
  const freeMatch = (rule.free && rule.free.test(text)) || (listFree && listFree.test(text));
  let stripped = freeMatch ? text.replace(new RegExp(rule.free.source, 'g'), ' ') : text;
  if (listFree) stripped = stripped.replace(listFree, ' ');
  // "-free" tokens never count as a positive mention ("paraben-free" is not a preservative).
  stripped = stripped.replace(/\b[a-z]+(-[a-z]+)?[- ]free\b/g, ' ');
  const yesMatch = rule.yes && rule.yes.test(stripped);
  if (freeMatch && yesMatch) return { status: 'unknown', conflict: true, source: 'catalog text (conflicting)' };
  if (freeMatch) return { status: 'no', source: 'catalog text' };
  if (yesMatch) return { status: 'yes', source: 'catalog text' };
  return { status: 'unknown', source: null };
}

// ─── Pregnancy / breastfeeding statements ───────────────────────────────────
// Only explicit catalog statements change the default 'unknown'.
// 'verified' requires a reviewed source; the catalog has none today, so
// nothing is 'verified'. A brand saying it is fine stays 'unknown'.
export const PREGNANCY_RULES = {
  contraindicated: [
    /(not|never) (recommended|for use|intended|to be used)[^.;]{0,30}(during |in |if |while |for )?(pregnan)/,
    /\bnot for (anyone |use if )?pregnan/,
    /do not use (if|while|during)[^.;]{0,15}pregnan/,
    /avoid (during|in|if|while) pregnan/,
    /not for use if pregnant/,
  ],
  caution: [
    /(consult|check with|talk to|ask)[^.;]{0,40}(clinician|doctor|provider)[^.;]{0,40}pregnan/,
    /pregnan[^.;]{0,40}(check with|consult)[^.;]{0,20}(doctor|clinician|provider)/,
  ],
};
export const BREASTFEEDING_RULES = {
  contraindicated: [
    /(not|never) (recommended|for use)[^.;]{0,40}(breastfeed|nursing|lactat)/,
    /do not use (if|while)[^.;]{0,20}(breastfeed|nursing)/,
  ],
  caution: [
    /best avoided while breastfeeding/,
    /(consult|check with|talk to)[^.;]{0,40}(clinician|doctor|provider)[^.;]{0,40}(breastfeed|nursing)/,
    /(breastfeed|nursing)[^.;]{0,40}(check with|consult)[^.;]{0,20}(doctor|clinician|provider)/,
  ],
};

function statementText(product) {
  const s = product.safety || {};
  return [product.summary, product.description, product.ingredients, s.sideEffects, s.opinionAlerts, s.allergens,
    ...(product.warnings || []), ...(product.whoItsFor || []), ...(Array.isArray(product.howToUse) ? product.howToUse : [product.howToUse]),
    product.doctorOpinion, product.effectiveness]
    .filter(Boolean).map(String).join(' . ').toLowerCase();
}

function stageSafety(text, rules, applicable) {
  if (!applicable) return { overall: 'not_applicable', trimester_1: 'not_applicable', trimester_2: 'not_applicable', trimester_3: 'not_applicable', evidence_source: null, last_reviewed: null };
  const contra = rules.contraindicated.find((re) => re.test(text));
  const caution = !contra && rules.caution.find((re) => re.test(text));
  const overall = contra ? 'contraindicated' : caution ? 'caution' : 'unknown';
  return {
    overall,
    trimester_1: overall, trimester_2: overall, trimester_3: overall,
    evidence_source: contra || caution ? 'catalog text (brand or ayna copy)' : null,
    last_reviewed: null,
  };
}

// ─── Age ────────────────────────────────────────────────────────────────────
// Stated limits from catalog text, plus one documented ayna policy rule.
export const AGE_POLICY = { 'sex-tech': { minimum: 18, source: 'ayna policy: adult products' } };
function ageFor(product, f, text) {
  const out = { minimum: null, maximum: null, source: null };
  const num = (v) => (v == null || v === '' ? null : Number(v));
  const min = num(product.minAge ?? product.minimumAge ?? product.ageMin);
  const max = num(product.maxAge ?? product.maximumAge ?? product.ageMax);
  if (Number.isFinite(min)) { out.minimum = min; out.source = 'catalog field'; }
  if (Number.isFinite(max)) { out.maximum = max; out.source = 'catalog field'; }
  const under = text.match(/not (intended )?for children under (\d{1,2})/);
  if (under && out.minimum == null) { out.minimum = Number(under[2]); out.source = 'catalog text'; }
  const policy = AGE_POLICY[f.cat];
  if (policy && (out.minimum == null || out.minimum < policy.minimum)) { out.minimum = policy.minimum; out.source = policy.source; }
  return out;
}

// ─── Life stage relevance ───────────────────────────────────────────────────
// 'designed_for' | 'relevant' | 'not_relevant' | 'contraindicated' | 'unknown'
function lifeStageFor(f, pregnancy) {
  const ls = {
    regular_periods: 'unknown', irregular_periods: 'unknown', no_periods: 'unknown', hormonal_birth_control: 'unknown',
    ttc: 'unknown', pregnant: 'unknown', postpartum: 'unknown', perimenopause: 'unknown', menopause: 'unknown', postmenopause: 'unknown',
  };
  if (PERIOD_CATEGORIES.has(f.cat) || f.cat === 'cup-steamer') {
    Object.assign(ls, { regular_periods: 'relevant', irregular_periods: 'relevant', perimenopause: 'relevant', hormonal_birth_control: 'relevant', ttc: 'relevant',
      no_periods: 'not_relevant', pregnant: 'not_relevant', menopause: 'not_relevant', postmenopause: 'not_relevant' });
  }
  if (f.fn('cycle-tracking') && !f.t(/menopause/)) Object.assign(ls, { regular_periods: 'relevant', irregular_periods: 'relevant', ttc: 'relevant' });
  if (f.has('fertility') || f.fn('fertility')) ls.ttc = 'designed_for';
  if (f.fn('contraception') || f.has('contraception')) { ls.hormonal_birth_control = 'relevant'; if (ls.ttc === 'unknown') ls.ttc = 'not_relevant'; }
  if (f.has('pregnancy') || f.cat === 'pregnancy' || f.n(/prenatal/)) ls.pregnant = 'designed_for';
  if (f.has('postpartum') || f.cat === 'postpartum') ls.postpartum = 'designed_for';
  // 'designed_for' needs a catalog classification (tag, category, health
  // function) or the product name. A passing mention in marketing copy ("a
  // common perimenopause and postpartum symptom") only makes it 'relevant'.
  if (f.has('menopause') || f.cat === 'menopause' || f.fn('perimenopause') || f.has('perimenopause') || f.n(/menopaus/)) {
    Object.assign(ls, { perimenopause: 'designed_for', menopause: 'designed_for', postmenopause: 'designed_for' });
  } else if (f.t(/menopaus/)) {
    for (const st of ['perimenopause', 'menopause', 'postmenopause']) if (ls[st] === 'unknown') ls[st] = 'relevant';
  }
  if (pregnancy.overall === 'contraindicated') ls.pregnant = 'contraindicated';
  return ls;
}

// ─── Evidence ───────────────────────────────────────────────────────────────
const GUIDELINE_DOMAINS = /acog\.org|fda\.gov|cdc\.gov|nih\.gov\/(?!pmc)|nia\.nih\.gov|medlineplus\.gov|mayoclinic\.org|who\.int|nice\.org\.uk|womenshealth\.gov|menopause\.org|hhs\.gov|clevelandclinic\.org/;
const STUDY_DOMAINS = /pubmed|ncbi\.nlm\.nih\.gov|pmc\.ncbi|doi\.org|cochrane|jamanetwork|thelancet|nejm|bmj\.com|sciencedirect|springer|wiley/;
const COMMUNITY_DOMAINS = /reddit|tiktok|youtube|instagram|facebook|amazon\.com\/.*review|trustpilot/;

function collectLinks(product) {
  const vl = product.verificationLinks || {};
  const links = [
    ...(product.scientificCitations || []).map((c) => ({ ...c, from: 'scientific' })),
    ...(product.doctorOpinionCitations || []).map((c) => ({ ...c, from: 'doctor' })),
    ...((vl.doctor?.links) || []).map((c) => ({ ...c, from: 'doctor' })),
    ...((vl.scientific?.links) || []).map((c) => ({ ...c, from: 'scientific' })),
    ...((vl.community?.links) || []).map((c) => ({ ...c, from: 'community' })),
    ...(product.ingredientScience || []).flatMap((i) => (i.citations || []).map((c) => ({ ...c, from: 'ingredient' }))),
  ];
  const seen = new Set();
  return links.filter((l) => {
    const key = `${l.from}|${l.url || l.text || l.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceFor(product, brandName) {
  const links = collectLinks(product);
  const nameWords = [brandName, ...String(product.name || '').split(/\s+/).slice(0, 2)].filter((w) => w && w.length > 3).map((w) => w.toLowerCase());
  const out = { product_specific: 0, ingredient_specific: 0, clinical_guideline: 0, community: 0 };
  for (const l of links) {
    const url = String(l.url || '').toLowerCase();
    const label = `${l.text || ''} ${l.label || ''} ${l.summary || ''}`.toLowerCase();
    if (l.from === 'community' || COMMUNITY_DOMAINS.test(url)) { out.community += 1; continue; }
    const mentionsProduct = nameWords.some((w) => label.includes(w));
    if (STUDY_DOMAINS.test(url)) { if (mentionsProduct) out.product_specific += 1; else out.ingredient_specific += 1; continue; }
    if (GUIDELINE_DOMAINS.test(url)) { out.clinical_guideline += 1; continue; }
    if (mentionsProduct) out.product_specific += 1;
  }
  if (product.communityReview) out.community += 1;
  return {
    ...out,
    strength: product.evidenceStrength || null, // e.g. 'limited'
    expert_opinion: Boolean(product.doctorOpinion),
    // A named clinician said it (not ayna's own summary of the literature).
    expert_direct: Boolean(product.doctorOpinion) && product.clinicianOpinionSource === 'independent' && !/not a direct clinician quote|ayna synthesis|marketing|own site|brand-affiliated/i.test(String(product.clinicianAttribution || '')),
    clinician_source: product.clinicianOpinionSource || null, // independent | brand | mixed
    user_rating: Number.isFinite(product.userRating) ? product.userRating : null,
  };
}

// ─── Brand ──────────────────────────────────────────────────────────────────
// Brand names as they appear at the start of catalog product names. Used
// when the product has no `brand` field. Longest match wins.
export const BRAND_PREFIXES = [
  'The Honey Pot', 'Always Discreet', 'Always', 'Rael', 'LOLA', 'Saalt', 'Nature Made', "Nature's Bounty", 'Flex', 'Thinx', 'Thorne',
  'Clue', 'Stardust', 'Balance', 'Uqora', 'NOW Foods', 'NOW', 'Cystex', 'Cora', 'Wholesome Story', 'Traditional Medicinals',
  'Pink Stork', 'Love Wellness', 'Intimina', 'Intimate Rose', 'Estroven', 'Remifemin', 'Nurx', 'Wisp', 'Happi', 'Hers', 'Midi Health',
  'Pomelo Care', 'Natracare', 'Organyc', 'Veeda', 'L.', 'Tampax', 'DivaCup', 'Lunette', 'June', 'Nixit', 'Modibodi', 'Ruby Love',
  'Garden of Life', 'Gaia Herbs', 'NOW Foods', 'Nordic Naturals', 'AZO', 'Good Clean Love', 'Flo', 'HUM Nutrition', 'ThermaCare',
  'Comfytemp', 'Elvie', 'Luna Daily', 'Natural Cycles', 'Ovia', 'Glow', 'Maven', 'Tia', 'Planned Parenthood', 'BetterHelp',
  'Headspace', 'Calm', 'Inito', 'Oura', 'Apple', 'Eight Sleep', 'Frida Mom', 'Lansinoh', 'Ritual', 'Belly Bandit', 'Maude', 'Uberlube',
  'V-Wash', 'SweetSpot Labs', 'SweetSpot', 'Kindra', 'Citracal', 'Peanut', 'Bloom', 'Visana', 'Flutter', 'MenoLife', 'Bodily', 'Haakaa',
  'Silverette', 'Hatch', 'Willow', 'Boppy', 'Leachco', 'Dame', 'LELO', 'MysteryVibe', 'Queen V', 'pH-D', 'Gennev', 'Womaness',
  'Evernow', 'U by Kotex', 'Kotex', 'Stayfree', 'Seventh Generation', 'Bodyform', 'Carefree', 'Playtex', 'o.b.', 'OB', 'Lena', 'Ruby Cup',
  'OrganiCup', 'FemmyCycle', 'Ziggy', 'Lumma', 'Softdisc', 'Period Nirvana', 'Aisle', 'Period.co', 'Wuka', 'TomboyX', 'Dear Kate', 'Proof',
  'Hanes', 'Knix', 'Bambody', 'Winx Health', 'SootheHer', 'Neycher', 'gina', 'Good Kitty', 'Oboo', 'Connect', 'VIO2', 'Proov', 'Elitone',
  'My Pelvic Bra', 'BUNI', 'Pippa', 'Poise', 'Depend', 'TENA', 'LiM Method', 'Leachco Snoogle', 'Hello',
];
const BRAND_PREFIXES_SORTED = [...new Set(BRAND_PREFIXES)].sort((a, b) => b.length - a.length);

export function normalizeBrand(name) {
  return String(name || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');
}

function brandFor(product) {
  const explicit = product.brand || product.brandName || product.manufacturer || product.company;
  const name = String(product.name || '');
  const lower = name.toLowerCase();
  const prefix = BRAND_PREFIXES_SORTED.find((b) => lower.startsWith(b.toLowerCase()) && !/[a-z0-9]/.test(lower.charAt(b.length)));
  const slug = String(product.id || '').replace(/^[a-z]-/, '').split('-')[0] || null;
  const brandName = explicit || prefix || null;
  const badges = (product.badges || []).map((b) => String(b).toLowerCase());
  const tags = new Set((product.tags || []).map((t) => String(t).toLowerCase()));
  const ownership = [];
  if (badges.some((b) => /\bwoc\b/.test(b))) ownership.push('woc_owned');
  if (badges.some((b) => /black[- ]owned/.test(b))) ownership.push('black_owned');
  if (badges.some((b) => /(latin[ao]?|brown|hispanic)[- ]owned/.test(b))) ownership.push('brown_owned');
  if (badges.some((b) => /(female|women|woman)[- ](owned|founded)/.test(b))) ownership.push('women_owned');
  if (badges.some((b) => /lgbtq/.test(b))) ownership.push('lgbtq_owned');
  const sustainability = [];
  if (tags.has('sustainability') || badges.includes('sustainable')) sustainability.push('sustainable');
  if (tags.has('reusable') || badges.includes('reusable')) sustainability.push('reusable');
  if (badges.includes('b-corp')) sustainability.push('b_corp');
  if (badges.some((b) => /plastic-free/.test(b))) sustainability.push('plastic_free');
  if (badges.some((b) => /(climate|carbon) neutral/.test(b))) sustainability.push('carbon_neutral');
  if (badges.includes('eco-friendly')) sustainability.push('eco_friendly');
  return {
    name: brandName,
    key: brandName ? normalizeBrand(brandName) : null,
    id_slug: slug,
    source: explicit ? 'catalog field' : prefix ? 'name prefix' : null,
    ownership: [...new Set(ownership)],
    sustainability: [...new Set(sustainability)],
    emerging: product.isEmergingBrand === true,
  };
}

// ─── Values ("Should be") ───────────────────────────────────────────────────
// 'yes' | 'no' | 'partial' | 'unknown' per value id.
function valuesFor(product, f, safety, brand, pregnancy) {
  const text = f.text;
  const v = {};
  v.organic = f.has('organic') || /\borganic\b/.test(text) ? 'yes' : 'unknown';
  v.vegan = f.has('vegan') ? 'yes' : safety.animal_derived.status === 'yes' ? 'no' : 'unknown';
  v.cruelty_free = f.has('cruelty-free') || /cruelty[- ]free/.test(text) ? 'yes' : 'unknown';
  v.reusable = f.has('reusable') || /\breusable\b/.test(text) ? 'yes' : f.has('single-use') ? 'no' : 'unknown';
  v.eco_friendly = brand.sustainability.length ? 'yes' : 'unknown';
  v.unscented = safety.fragrance.status === 'no' ? 'yes' : safety.fragrance.status === 'yes' ? 'no' : safety.fragrance.status === 'not_applicable' ? 'not_applicable' : 'unknown';
  v.sensitive_skin = safety.fragrance.status === 'yes' ? 'no'
    : safety.fragrance.status === 'no' && /sensitive|hypoallergenic|gentle|irritation/.test(text + ' ' + String(product.safety?.allergens || '').toLowerCase()) ? 'yes' : 'unknown';
  v.minimal_ingredients = (product.badges || []).some((b) => /simple formula|clean label/i.test(b)) || /minimal ingredients|few ingredients|single[- ]ingredient/.test(text) ? 'yes' : 'unknown';
  v.pregnancy_considerations = pregnancy.overall === 'verified' ? 'yes' : ['contraindicated', 'caution'].includes(pregnancy.overall) ? 'no' : 'unknown';
  v.black_owned = brand.ownership.includes('black_owned') ? 'yes' : brand.ownership.includes('woc_owned') ? 'partial' : 'unknown';
  v.brown_owned = brand.ownership.includes('brown_owned') ? 'yes' : brand.ownership.includes('woc_owned') ? 'partial' : 'unknown';
  return v;
}

// ─── Access ─────────────────────────────────────────────────────────────────
const NATIONAL_RETAILERS = /\b(cvs|target|walmart|walgreens|rite aid|amazon|ulta|whole foods|costco|kroger)\b/i;
function accessFor(product, f, price) {
  const retailers = (product.whereToBuy || []).map(String);
  return {
    is_digital: f.type === 'digital' || f.cat === 'telehealth',
    is_care_service: isCareService(f),
    retailers,
    national_retailer: retailers.some((r) => NATIONAL_RETAILERS.test(r)),
    in_stock: product.whereToBuyInStock || null,
    service_area: product.serviceArea || product.statesServed || null, // not in catalog today
    ships_from_eu: price.currency === 'EUR' || /sold in euros/i.test(String(product?.priceNote || '')),
  };
}

// ─── Status, freshness, pricing, effort, mechanism, claim evidence ─────────
// RECALL / STATUS (spec B): a structured status field suppresses the product
// regardless of personalization. Free-text `safety.recalls` notes are not
// parsed (they mix lawsuits, historical recalls and "no recalls").
export function statusFor(product) {
  const raw = String(product.status || product.listingStatus || product.availabilityStatus || '').toLowerCase();
  if (product.recall?.active === true || product.activeRecall === true || product.isRecalled === true || /recall/.test(raw)) return { state: 'recalled', source: 'catalog field' };
  if (product.removed === true || product.isRemoved === true || /removed|delisted/.test(raw)) return { state: 'removed', source: 'catalog field' };
  if (product.discontinued === true || product.isDiscontinued === true || /discontinued/.test(raw)) return { state: 'discontinued', source: 'catalog field' };
  return { state: 'active', source: raw ? 'catalog field' : null };
}

// CATALOG FRESHNESS (spec B): when ingredients, safety, price and stock were
// last verified. The catalog has no such dates today, so this is 'unknown'.
export const FRESHNESS_DAYS = { fresh: 120, aging: 365 };
export function freshnessFor(product, now = Date.now(), passportFreshness = null) {
  const raw = product.lastVerified ?? product.verifiedAt ?? product.lastReviewed ?? product.last_reviewed ?? product.priceCheckedAt ?? product.updatedAt ?? null;
  const t = raw ? Date.parse(String(raw)) : NaN;
  if (!Number.isFinite(t)) {
    // Passport review dates: past next_review_due is 'stale' (spec 14).
    if (passportFreshness?.last_verified) {
      return { state: passportFreshness.state === 'stale' ? 'stale' : 'fresh', lastVerified: passportFreshness.last_verified, ageDays: passportFreshness.age_days ?? null, nextReviewDue: passportFreshness.next_review_due || null, source: 'product passport' };
    }
    return { state: 'unknown', lastVerified: null, ageDays: null };
  }
  const ageDays = Math.max(0, Math.round((now - t) / 86400000));
  return { state: ageDays <= FRESHNESS_DAYS.fresh ? 'fresh' : ageDays <= FRESHNESS_DAYS.aging ? 'aging' : 'stale', lastVerified: String(raw), ageDays };
}

// TRUE COST OVER TIME (spec B). Only from what the price text states:
// "/month", "/week", "/year", "N-day supply", "reusable up to N years".
// Nothing is assumed about dose or how long a pack lasts otherwise.
export function pricingFor(price, product, f) {
  const text = String(product.price || '').toLowerCase();
  const out = { upfront: price.amount, per_month: null, per_month_source: null, reusable: /reusable/.test(`${text} ${f.text}`) || f.has('reusable') };
  if (price.amount == null) return out;
  const daySupply = text.match(/(\d{2,3})[- ]day supply/);
  const years = text.match(/(?:reusable|lasts?)[^.;)]*?(\d{1,2})\s*years?/);
  if (price.recurring === 'month') { out.per_month = price.amount; out.per_month_source = 'price per month'; }
  else if (price.recurring === 'week') { out.per_month = Math.round(price.amount * 4.33 * 100) / 100; out.per_month_source = 'price per week'; }
  else if (/\/\s*year|per year|a year/.test(text) && !/\/\s*month/.test(text)) { out.per_month = Math.round((price.amount / 12) * 100) / 100; out.per_month_source = 'price per year'; }
  else if (daySupply) { out.per_month = Math.round((price.amount / Number(daySupply[1])) * 30 * 100) / 100; out.per_month_source = `${daySupply[1]}-day supply`; }
  else if (years) { out.per_month = Math.round((price.amount / (Number(years[1]) * 12)) * 100) / 100; out.per_month_source = `reusable up to ${years[1]} years`; }
  return out;
}

// EFFORT / ADHERENCE (spec B), from format, category and price text.
export const EFFORT_LEVELS = {
  one_time: { label: 'Buy once', burden: 0.1 },
  per_use: { label: 'Use when needed', burden: 0.2 },
  device_setup: { label: 'Device with setup', burden: 0.4 },
  subscription: { label: 'Subscription', burden: 0.4 },
  daily: { label: 'Daily routine', burden: 0.5 },
  appointment: { label: 'Appointments', burden: 0.6 },
};
export function effortFor(f, formats, price, careService) {
  let level = null;
  if (careService) level = 'appointment';
  else if (price.recurring) level = 'subscription';
  else if (f.cat === 'supplement' || formats.some((x) => ['pill_capsule', 'gummy', 'powder', 'drink_tea'].includes(x))) level = 'daily';
  else if (formats.includes('app_service')) level = 'subscription';
  else if (formats.includes('device') && /app|bluetooth|program|session|charge|rechargeable/.test(f.text)) level = 'device_setup';
  else if (formats.includes('device') || f.has('reusable')) level = 'one_time';
  else if (formats.some((x) => ['period_care', 'topical', 'patch', 'suppository', 'test_kit'].includes(x))) level = 'per_use';
  return level ? { level, ...EFFORT_LEVELS[level] } : { level: 'unknown', label: null, burden: null };
}

// MECHANISM: the rules that make it relevant (how it works), used for
// facet similarity and "alternative approach" roles.
function mechanismFor(matchedRules, formats) {
  const skip = new Set(['accessory_cap', 'limited_evidence_cap', 'postpartum_tagged', 'pregnancy_tagged', 'hormone_tagged']);
  return { rules: matchedRules.filter((r) => !skip.has(r)), formats };
}

// CLAIM-LEVEL EVIDENCE (spec B): which citations talk about THIS need, split
// into product-specific (names the product or brand), ingredient-only, and
// guideline sources. Matching is on words from the need's own vocabulary.
export const NEED_CLAIM_WORDS = {
  'pain.menstrual_cramp': /cramp|dysmenorrh|period pain|menstrual pain/,
  'pain.pelvic': /pelvic pain/, 'pain.sexual': /dyspareunia|painful (sex|intercourse)|vaginismus/,
  'period.heavy': /heavy (menstrual|period|bleed)|menorrhagia/, 'period.product_support': /menstrua|period|tampon|pad\b|cup\b/,
  'vaginal.dryness': /dryness|atroph|moistur/, 'vaginal.bv': /bacterial vaginosis|\bbv\b/, 'vaginal.yeast': /yeast|candid/,
  'urinary.recurrent_uti': /urinary tract infection|\buti/, 'urinary.incontinence': /incontinen|bladder leak|pelvic floor/,
  'vasomotor.hot_flashes': /hot flash|vasomotor/, 'vasomotor.night_sweats': /night sweat|vasomotor/,
  'cycle.pms': /premenstrual|\bpms\b/, 'mood.general_anxiety': /anxiety/, 'mood.low': /depress/,
  'sleep.trouble': /sleep|insomnia/, 'energy.fatigue': /fatigue|energy/, 'skin.acne': /acne/,
  'condition_support.pcos': /pcos|pmos|polycystic|polyendocrine/, 'fertility.ovulation_tracking': /ovulat|fertil/, 'fertility.ttc': /fertil|concept/,
  'bone.health': /bone|osteopor/, 'pregnancy.prenatal': /prenatal|pregnan|folate|neural tube/,
};
function claimEvidenceFor(product, brandName, needIds) {
  const links = collectLinks(product);
  const nameWords = [brandName, ...String(product.name || '').split(/\s+/).slice(0, 2)].filter((w) => w && w.length > 3).map((w) => w.toLowerCase());
  const out = {};
  for (const need of needIds) {
    const re = NEED_CLAIM_WORDS[need];
    if (!re) continue;
    const row = { product_specific: 0, ingredient_specific: 0, clinical_guideline: 0 };
    for (const l of links) {
      if (l.from === 'community') continue;
      const url = String(l.url || '').toLowerCase();
      const label = `${l.text || ''} ${l.label || ''} ${l.summary || ''} ${l.title || ''}`.toLowerCase();
      if (!re.test(label)) continue;
      const mentionsProduct = nameWords.some((w) => label.includes(w));
      if (GUIDELINE_DOMAINS.test(url)) row.clinical_guideline += 1;
      else if (mentionsProduct) row.product_specific += 1;
      else row.ingredient_specific += 1;
    }
    if (row.product_specific + row.ingredient_specific + row.clinical_guideline > 0) out[need] = row;
  }
  return out;
}

/**
 * Facet similarity between two product profiles (spec B): products can share
 * a category and still differ completely, so each facet is scored on its own.
 * @returns {{ ingredients, mechanism, format, price, materials, use_case, brand, health_function }} each 0..1 (null when unknown)
 */
export function productSimilarity(a, b) {
  if (!a || !b) return null;
  const jaccard = (x, y) => {
    const A = new Set(x || []); const B = new Set(y || []);
    if (!A.size || !B.size) return null;
    let inter = 0; A.forEach((v) => { if (B.has(v)) inter += 1; });
    return Math.round((inter / (A.size + B.size - inter)) * 100) / 100;
  };
  const strongNeeds = (pp) => Object.entries(pp.health_need_relevance).filter(([, e]) => e.score >= 0.55).map(([k]) => k);
  const pa = a.pricing?.per_month ?? a.price?.amount; const pb = b.pricing?.per_month ?? b.price?.amount;
  const ingA = [...(a.ingredient_keys || []), ...(a.ingredients || []).map((x) => x.toLowerCase())];
  const ingB = [...(b.ingredient_keys || []), ...(b.ingredients || []).map((x) => x.toLowerCase())];
  return {
    ingredients: jaccard(ingA, ingB),
    mechanism: jaccard(a.mechanism?.rules, b.mechanism?.rules),
    format: jaccard(a.formats, b.formats),
    price: pa != null && pb != null && Math.max(pa, pb) > 0 ? Math.round((Math.min(pa, pb) / Math.max(pa, pb)) * 100) / 100 : null,
    materials: jaccard((a.materials || []).map((x) => x.toLowerCase()), (b.materials || []).map((x) => x.toLowerCase())),
    use_case: a.category && b.category ? (a.category === b.category ? 1 : 0) : null,
    brand: a.brand?.key && b.brand?.key ? (a.brand.key === b.brand.key ? 1 : 0) : null,
    health_function: jaccard(strongNeeds(a), strongNeeds(b)),
  };
}


// ─── Product passport layer ─────────────────────────────────────────────────
// Canonical ingredient ids / classes that mean an attribute is present.
// Compared on ids, so "natural rubber latex", "methylparaben" or "sodium
// salicylate" are recognized however the label spells them.
export const ATTRIBUTE_INGREDIENTS = {
  latex: { ids: ['latex'], classes: ['allergen-latex'] },
  adhesives: { ids: ['adhesive'] },
  nsaid: { classes: ['nsaid'] },
  aspirin: { ids: ['sodium-salicylate'] }, // salicylate labels warn people with aspirin allergy
  hormones: { classes: ['hormone'] },
  essential_oils: { classes: ['essential-oil'] },
  parabens: { ids: ['parabens'] },
  preservatives: { classes: ['preservative'] },
  soy: { classes: ['allergen-soy'] },
  dairy: { classes: ['allergen-dairy'] },
  animal_derived: { classes: ['animal-derived'] },
  synthetic_materials: { ids: ['polyester', 'spandex', 'tpe', 'silicone', 'superabsorbent-polymer'], classes: ['plastic'] },
};

function safePassport(product) {
  try { return getPassport(product); } catch { return null; }
}

function factText(f) {
  if (!f || !f.known) return '';
  const flat = (v) => (v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.map(flat).join(', ') : typeof v === 'object' ? Object.values(v).map(flat).join(', ') : String(v));
  return flat(f.value);
}

// Reviewed label text says "physician" or "healthcare professional" where the
// catalog rules expect "doctor"; normalize before applying the same rules.
function normalizeClinician(text) {
  return String(text || '').toLowerCase().replace(/\b(physicians?|health ?care (professionals?|providers?|practitioners?)|medical professionals?|pharmacists?)\b/g, 'doctor');
}

const STAGE_RANK = { not_applicable: -1, unknown: 0, verified: 1, caution: 2, contraindicated: 3 };
function worseStage(a, b) {
  if (!b || b.overall === 'unknown' || a.overall === 'not_applicable') return a;
  if (b.onlyIfUnknown) { const { onlyIfUnknown, ...rest } = b; return a.overall === 'unknown' ? rest : a; }
  return STAGE_RANK[b.overall] > STAGE_RANK[a.overall] ? { ...b, evidence_source: /^https?:/.test(b.evidence_source || '') ? b.evidence_source : 'product passport (reviewed source)' } : a;
}

/**
 * What the engine reads from the passport. Missing passport -> everything
 * unknown, nothing excluded.
 */
// A reviewed passport fact can carry stage_status: 'avoid' | 'caution' | 'ok',
// a reviewer's reading of exactly what the source says (the quote is the
// fact's value). 'ok' only counts from a .gov source and only fills an unknown;
// it never loosens a caution from the label or anywhere else.
const GOV_SOURCE = /^https:\/\/([a-z0-9-]+\.)*(nih\.gov|medlineplus\.gov|fda\.gov|cdc\.gov|womenshealth\.gov|ahrq\.gov|hhs\.gov)\//i;
function stageFromReview(fact) {
  const s = fact?.stage_status;
  const evidence = fact?.source_url || 'product passport (reviewed source)';
  const at = fact?.verified_at || null;
  const all = (overall, extra = {}) => ({ overall, trimester_1: overall, trimester_2: overall, trimester_3: overall, evidence_source: evidence, last_reviewed: at, ...extra });
  if (s === 'avoid') return all('contraindicated');
  if (s === 'caution') return all('caution');
  if (s === 'ok' && GOV_SOURCE.test(fact?.source_url || '')) return all('verified', { onlyIfUnknown: true });
  return null;
}

function passportLayer(product, passport, applicable) {
  if (!passport) {
    return { status: null, freshness: null, completeness: null, missingCritical: [], ingredientIds: [], ingredientClasses: [], reviewedText: '', pregnancyText: '', breastfeedingText: '', pregnancyStage: null, breastfeedingStage: null, interactionText: '', known: {}, claims: [], qa: null };
  }
  const c = passport.composition;
  const sf = passport.safety;
  const reviewed = (f) => Boolean(f?.known && f.reviewed);
  const reviewedText = [c.ingredients, c.allergens, c.materials, c.fragrance].filter(reviewed).map(factText).join(' . ').toLowerCase();
  const claimsFact = passport.evidence?.claims;
  const claims = claimsFact?.known && Array.isArray(claimsFact.value) ? claimsFact.value.filter((x) => x && typeof x === 'object' && x.claim) : [];
  return {
    status: passport.status,
    offShelf: OFF_SHELF_STATUSES.includes(passport.status),
    freshness: passport.freshness || null,
    completeness: passport.completeness?.overall ?? null,
    missingCritical: passport.completeness?.missingCritical || [],
    ingredientIds: passport.ingredient_ids || [],
    ingredientClasses: passport.ingredient_classes || [],
    reviewedText,
    pregnancyText: reviewed(sf.pregnancy) ? normalizeClinician(factText(sf.pregnancy)) : '',
    breastfeedingText: reviewed(sf.breastfeeding) ? normalizeClinician(factText(sf.breastfeeding)) : '',
    // A reviewer's reading of what the source says (stage_status), with its source.
    pregnancyStage: reviewed(sf.pregnancy) ? stageFromReview(sf.pregnancy) : null,
    breastfeedingStage: reviewed(sf.breastfeeding) ? stageFromReview(sf.breastfeeding) : null,
    interactionText: reviewed(sf.medication_interactions) ? factText(sf.medication_interactions).toLowerCase() : '',
    // Safety facts we have any information on (catalog or reviewed). Not applicable counts as known.
    known: {
      pregnancy: sf.pregnancy?.notApplicable || Boolean(sf.pregnancy?.known) || !applicable,
      breastfeeding: sf.breastfeeding?.notApplicable || Boolean(sf.breastfeeding?.known) || !applicable,
      interactions: sf.medication_interactions?.notApplicable || Boolean(sf.medication_interactions?.known),
      allergens: c.allergens?.notApplicable || Boolean(c.allergens?.known),
      ingredients: c.ingredients?.notApplicable || Boolean(c.ingredients?.known) || Boolean(c.materials?.known),
    },
    // Looked for and not published by the brand (fact status 'unavailable'):
    // VERIFIED UNKNOWN, a different message from "still checking".
    undisclosed: {
      pregnancy: !sf.pregnancy?.known && sf.pregnancy?.status === 'unavailable',
      breastfeeding: !sf.breastfeeding?.known && sf.breastfeeding?.status === 'unavailable',
      interactions: !sf.medication_interactions?.known && sf.medication_interactions?.status === 'unavailable',
      allergens: !c.allergens?.known && c.allergens?.status === 'unavailable',
      ingredients: !c.ingredients?.known && c.ingredients?.status === 'unavailable',
    },
    claims,
    qa: passport.qa?.status || null,
  };
}

/** Merge a passport-derived attribute status into the catalog one. Unknown is never upgraded to "free of". */
function mergeAttribute(catalog, reviewed, idHit) {
  if (catalog.status === 'not_applicable') return catalog;
  if (idHit) {
    if (catalog.status === 'no' && !reviewed) return { status: 'unknown', conflict: true, source: 'catalog says free of it, ingredient list names it' };
    return { status: 'yes', source: 'canonical ingredient id' };
  }
  if (!reviewed || reviewed.status === 'unknown') return reviewed?.conflict && catalog.status === 'no' ? { status: 'unknown', conflict: true, source: 'reviewed label conflicts' } : catalog;
  if (reviewed.status === 'yes' || catalog.status === 'yes') return { status: 'yes', source: reviewed.status === 'yes' ? 'product passport (reviewed source)' : catalog.source };
  if (reviewed.status === 'no' && catalog.status !== 'yes') return { status: 'no', source: 'product passport (reviewed source)' };
  return catalog;
}

/** Claim-level evidence from the passport, per need: strength x (product-specific 1, ingredient-level 0.6). */
export const CLAIM_STRENGTH = { strong: 1, moderate: 0.7, limited: 0.4, weak: 0.4, none: 0 };
export const INGREDIENT_LEVEL_WEIGHT = 0.6;
const GUIDELINE_TYPES = new Set(['clinical_guideline', 'regulatory']);
function passportClaimEvidence(claims) {
  const out = {};
  for (const c of claims) {
    const text = `${c.claim || ''} ${c.supports || ''}`.toLowerCase();
    const strength = CLAIM_STRENGTH[String(c.strength || '').toLowerCase()] ?? 0.4;
    if (!strength) continue;
    const productSpecific = c.product_specific === true || c.evidence_type === 'product_study';
    const guideline = GUIDELINE_TYPES.has(c.evidence_type);
    const value = strength * (productSpecific ? 1 : guideline ? 0.8 : INGREDIENT_LEVEL_WEIGHT);
    for (const [need, re] of Object.entries(NEED_CLAIM_WORDS)) {
      if (!re.test(text)) continue;
      const row = out[need] || { score: 0, product_specific: 0, ingredient_level: 0, guideline: 0, claims: [] };
      row.score = Math.max(row.score, value);
      if (productSpecific) row.product_specific += 1; else if (guideline) row.guideline += 1; else row.ingredient_level += 1;
      row.claims.push({ claim: c.claim, strength: c.strength || null, evidence_type: c.evidence_type || null, product_specific: productSpecific, source_url: c.source_url || null });
      out[need] = row;
    }
  }
  return out;
}

// ─── Build + cache ──────────────────────────────────────────────────────────
const CACHE = new Map();
export function clearProductProfileCache() { CACHE.clear(); }

/**
 * Build (and cache by product id) the structured product profile.
 * @param {object} product raw catalog product
 */
// CONFIRMATION-FIRST PRODUCTS (clinician review): eligible only when the
// condition they treat has been confirmed. A 45 mg+ iron supplement is above
// the adult daily upper limit; fatigue or heavy periods do not establish iron
// deficiency.
export const HIGH_DOSE_IRON_MG = 45;
function requiresConditionFor(product, f) {
  if (f.cat !== 'supplement') return null;
  const text = `${product.name || ''} ${product.summary || ''}`;
  if (!/\biron\b/i.test(product.name || '')) return null;
  const mg = [...text.matchAll(/(\d{2,3})\s*mg/gi)].map((m) => Number(m[1]));
  if (!mg.some((x) => x >= HIGH_DOSE_IRON_MG)) return null;
  return { condition: 'anemia', text: 'High-dose iron is best considered after iron deficiency is confirmed with a clinician or lab test' };
}

export function buildProductProfile(product) {
  if (!product) return null;
  const key = product.id ? `${product.id}|${product.name || ''}` : null;
  if (key && CACHE.has(key)) return CACHE.get(key);

  const f = facts(product);
  const formats = formatsFor(f);
  const isDigital = formats.includes('app_service') && !formats.some((x) => ['device', 'topical', 'pill_capsule', 'test_kit', 'period_care'].includes(x));
  const ingested = f.cat === 'supplement' || f.cat === 'medication' || f.n(/laxative|miralax|psyllium/) || ['pill_capsule', 'gummy', 'powder', 'drink_tea'].some((x) => formats.includes(x));
  const sText = safetyText(product);
  const ctx = { isDigital, ingested, text: sText };

  const passport = safePassport(product);
  const ppLayer = passportLayer(product, passport, true);
  const idSet = new Set(ppLayer.ingredientIds);
  const classSet = new Set(ppLayer.ingredientClasses);
  const safety = {};
  for (const [attr, rule] of Object.entries(ATTRIBUTE_RULES)) {
    const catalog = attributeStatus(product, attr, rule, ctx);
    const reviewed = ppLayer.reviewedText ? attributeStatus({ avoidIfSensitivity: [] }, attr, rule, { ...ctx, text: ppLayer.reviewedText }) : null;
    const m = ATTRIBUTE_INGREDIENTS[attr];
    const idHit = Boolean(m && ((m.ids || []).some((id) => idSet.has(id)) || (m.classes || []).some((c) => classSet.has(c))));
    safety[attr] = passport ? mergeAttribute(catalog, reviewed, idHit) : catalog;
  }

  // Pregnancy / breastfeeding safety only matters for things that act on or
  // enter the body. Apps, services and support garments are not_applicable.
  const bodyContact = ingested || ['topical', 'suppository', 'patch', 'period_care'].some((x) => formats.includes(x))
    || product.internal === true || ['sex-tech', 'cramp-relief', 'incontinence', 'intimate-care'].includes(f.cat)
    || (f.cat === 'pelvic-floor' && formats.includes('device'))
    // Drug-labeled topicals (minoxidil, acne medicines) carry pregnancy warnings too.
    || f.n(/minoxidil|rogaine|adapalene|benzoyl peroxide/);
  const stText = statementText(product);
  const stageApplies = bodyContact && !isDigital;
  // Tampons, cups and discs: "not in pregnancy" is about pregnancy itself (no
  // periods; nothing inserted postpartum until cleared), so it applies only to
  // someone who is pregnant, never to trying to conceive or an unknown stage.
  // Their breastfeeding notes are about the first postpartum weeks, not
  // breastfeeding months later, so research breastfeeding status skips them.
  const internalPeriod = !ingested && (['tampon', 'cup', 'disc', 'menstrual-cup', 'menstrual-disc'].includes(f.cat)
    || /tampon|menstrual (cup|disc)|\b(cup|disc)\b/.test(String(product.name || '').toLowerCase()) && (f.cat === 'period' || formats.includes('period_care')));
  const pregnancy = worseStage(worseStage(worseStage(stageSafety(stText, PREGNANCY_RULES, stageApplies), ppLayer.pregnancyText ? stageSafety(ppLayer.pregnancyText, PREGNANCY_RULES, stageApplies) : null),
    stageApplies ? ppLayer.pregnancyStage : null), researchStage(product.id, 'pregnancy', stageApplies));
  if (internalPeriod && pregnancy.overall !== 'not_applicable') pregnancy.pregnantOnly = true;
  const breastfeeding = worseStage(worseStage(worseStage(stageSafety(stText, BREASTFEEDING_RULES, stageApplies), ppLayer.breastfeedingText ? stageSafety(ppLayer.breastfeedingText, BREASTFEEDING_RULES, stageApplies) : null),
    stageApplies ? ppLayer.breastfeedingStage : null), internalPeriod ? null : researchStage(product.id, 'breastfeeding', stageApplies));

  // Relevance. Unconditional levels merge by MAX; contextual levels are kept
  // separately (with the contexts they require) and only count at scoring
  // time when she gave that context. Broad-marketing rules are capped at WEAK.
  const relevance = {};
  const caps = {};
  const roles = new Set();
  const matchedRules = [];
  const entryFor = (need) => { relevance[need] = relevance[need] || { score: 0, rule: null, why: null, contextual: [] }; return relevance[need]; };
  for (const rule of RELEVANCE_RULES) {
    if (!rule.when(f)) continue;
    matchedRules.push(rule.id);
    const set = typeof rule.set === 'function' ? rule.set(f) : rule.set;
    for (const [need, value] of Object.entries(set || {})) {
      const e = entryFor(need);
      if (value && typeof value === 'object') {
        const level = rule.broad ? Math.min(WEAK, value.level) : value.level;
        e.contextual.push({ level, requires: value.requires, rule: rule.id, why: rule.why });
      } else {
        const level = rule.broad ? Math.min(WEAK, value) : value;
        if (e.score < level) { e.score = level; e.rule = rule.id; e.why = rule.why; e.broad = Boolean(rule.broad); }
      }
    }
    const cap = typeof rule.cap === 'function' ? rule.cap(f) : rule.cap;
    if (cap) for (const [need, level] of Object.entries(cap)) caps[need] = Math.min(caps[need] ?? 1, level);
    const r = typeof rule.roles === 'function' ? rule.roles(f) : rule.roles;
    (r || []).forEach((x) => roles.add(x));
  }
  for (const [need, entry] of Object.entries(relevance)) {
    const cap = Math.min(caps[need] ?? 1, caps['*'] ?? 1);
    if (entry.score > cap) { entry.score = cap; entry.capped = true; }
    entry.contextual.forEach((c) => { if (c.level > cap) { c.level = cap; c.capped = true; } });
    entry.contextual = entry.contextual.filter((c) => c.level > entry.score);
  }

  const brand = brandFor(product);
  const evidence = evidenceFor(product, brand.name);
  const evidenceTotal = evidence.product_specific + evidence.ingredient_specific + evidence.clinical_guideline;
  const evidenceConfidence = Math.min(1, (evidence.product_specific * 2 + evidence.ingredient_specific + evidence.clinical_guideline) / 4) * (evidence.strength === 'limited' ? 0.5 : 1);
  const claimEvidence = claimEvidenceFor(product, brand.name, Object.keys(relevance));
  const passportClaims = passportClaimEvidence(ppLayer.claims);
  const health_need_relevance = Object.fromEntries(Object.entries(relevance)
    .filter(([, e]) => e.score > 0 || e.contextual.length)
    .map(([need, e]) => [need, {
      score: e.score,
      relationship: e.score > 0 ? relationshipFor(e.score) : 'contextual',
      evidence_confidence: Math.round(evidenceConfidence * 100) / 100,
      claim_evidence: claimEvidence[need] || null,
      rule: e.rule || e.contextual[0]?.rule || null,
      why: e.why || e.contextual[0]?.why || null,
      broad: Boolean(e.broad),
      contextual: e.contextual.map((c) => ({ level: c.level, relationship: relationshipFor(c.level), requires: c.requires, rule: c.rule, why: c.why })),
    }]));

  const price = parsePrice(product.price);
  const ingredientKeys = detectIngredientKeys([product.name, product.ingredients, product.summary].filter(Boolean).join(' '));
  const capacity = capacityFor(f);
  const fragranceKnown = ['yes', 'no', 'not_applicable'].includes(safety.fragrance.status);
  const latexKnown = ['yes', 'no', 'not_applicable'].includes(safety.latex.status);
  const keyFields = [
    price.amount != null,
    formats.length > 0,
    Boolean(product.ingredients || product.safety?.materials) || isDigital,
    Boolean(product.safety?.allergens) || isDigital,
    fragranceKnown,
    latexKnown,
    pregnancy.overall !== 'unknown',
    evidenceTotal + evidence.community > 0,
    Boolean(brand.name),
    Object.values(health_need_relevance).some((e) => e.score >= 0.55 || e.contextual.some((c) => c.level >= 0.55)),
  ];
  const freshness = freshnessFor(product, Date.now(), ppLayer.freshness);
  const catalogStatus = statusFor(product);
  const status = catalogStatus.state === 'active' && ppLayer.offShelf ? { state: ppLayer.status, source: 'product passport' } : catalogStatus;
  const pricing = pricingFor(price, product, f);
  const effort = effortFor(f, formats, price, isCareService(f));

  const profile = {
    product_id: product.id || null,
    name: product.name || '',
    category: f.cat,
    type: f.type,
    health_need_relevance,
    matched_rules: matchedRules,
    care_roles: [...roles],
    life_stage: lifeStageFor(f, pregnancy),
    age: ageFor(product, f, stText),
    formats,
    menstrual: PERIOD_CATEGORIES.has(f.cat) ? {
      capacity, capacity_ml: capacityMlFor(product, passport, f), leak_protection: f.fn('leak-protection') || f.has('leaks'),
      versatile: f.cat === 'period-underwear' && f.t(/multiple absorbency|absorbency levels|modular|inserts/),
    } : null,
    price,
    // Reusable per the brand's own page (passport), for the match's "reusable" factor.
    reusable_by_brand: reusableByBrand(passport),
    fsa_hsa: [product.fsaHsaEligible, product.fsa_hsa_eligible, product.fsaEligible, product.fsa_eligible, product.hsaEligible, product.hsa_eligible].some((v) => v === true) ? 'yes'
      : product.fsaHsaEligible === false ? 'no' : 'unknown',
    internal: product.internal === true || ['tampon', 'cup', 'disc'].includes(f.cat),
    requires_condition: requiresConditionFor(product, f),
    safety: {
      ...Object.fromEntries(Object.entries(safety).map(([k, v]) => [k, v.status])),
      details: safety,
      pregnancy: pregnancy.overall,
      breastfeeding: breastfeeding.overall,
    },
    pregnancy,
    breastfeeding,
    ingested,
    // Swallowed botanical (vitex, dong quai, black cohosh, evening primrose...).
    // Pregnant, trying and breastfeeding users never see one whose safety for
    // that stage is unknown (score.js, section 7c).
    herbal: ingested && HERBAL_RE.test([product.name, product.ingredients, product.summary, product.description].filter(Boolean).join(' ').toLowerCase()),
    interaction_relevant: ingested || formats.includes('suppository') || formats.includes('topical'),
    ingredient_keys: ingredientKeys,
    ingredients: product.ingredients ? String(product.ingredients).split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean) : [],
    materials: product.safety?.materials ? String(product.safety.materials).split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean) : [],
    evidence,
    evidence_confidence: Math.round(evidenceConfidence * 100) / 100,
    brand,
    values: null,
    access: accessFor(product, f, price),
    metadata_confidence: Math.round((keyFields.filter(Boolean).length / keyFields.length) * 100) / 100,
    metadata_fields: {
      price: keyFields[0], formats: keyFields[1], ingredients_or_materials: keyFields[2], allergens_field: keyFields[3],
      fragrance_status: keyFields[4], latex_status: keyFields[5], pregnancy_status: keyFields[6], evidence: keyFields[7],
      brand: keyFields[8], health_relevance: keyFields[9],
    },
    is_digital: isDigital,
    // Spec B additions. All read from catalog fields; unknown when silent.
    status,            // { state: 'active'|'recalled'|'removed'|'discontinued', source }
    freshness,         // { state: 'fresh'|'aging'|'stale'|'unknown', lastVerified, ageDays }
    pricing,           // { upfront, per_month, per_month_source, reusable }
    effort,            // { level, label }
    mechanism: mechanismFor(matchedRules, formats),
    claim_evidence: claimEvidence,
    // Product passport (src/data/passport). Confidence only, plus safety unknowns.
    passport: {
      status: ppLayer.status,
      qa: ppLayer.qa,
      completeness: ppLayer.completeness,
      missing_critical: ppLayer.missingCritical,
      freshness: ppLayer.freshness ? ppLayer.freshness.state : null,
      known: ppLayer.known,
      undisclosed: ppLayer.undisclosed || {},
      interaction_text: ppLayer.interactionText,
      claim_evidence: passportClaims,
    },
    // Added by her, not in the catalog: nothing about it has been checked yet.
    user_added: product.userAdded === true && (product.type === 'user' || String(product.id || '').startsWith('user-')),
    ingredient_ids: ppLayer.ingredientIds,
    ingredient_classes: ppLayer.ingredientClasses,
  };
  profile.values = valuesFor(product, f, safety, brand, pregnancy);
  if (key) CACHE.set(key, profile);
  return profile;
}
