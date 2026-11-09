// Life-stage scope: products made ONLY for one part of life (P0, Oct 29).
//
// Reviewed by hand, product by product, from what each product is for. Not
// derived from tags: the tag-derived `life_stage.designed_for` marks Poise
// liners, Eight Sleep and creatine as "designed for menopause", which is far
// too broad to gate on (audit finding M).
//
// Rule (src/matching/eligibility.js stageScopeCheck), from her answers only,
// never her age:
//   - she shared a stage in `stages`           -> fine
//   - she shared a stage in `ask`              -> hold, ask her to confirm her stage
//   - she shared other stages only             -> excluded ("Made for menopause")
//   - she shared no stage                      -> hold, ask her life stage
//
// A product belongs here only when someone outside these stages would get
// nothing from it or should not take it. Cooling sprays, incontinence pads,
// lubricants, folic acid and sleep products are left out on purpose: they
// help people at any stage.

const MENOPAUSE = {
  stages: ['perimenopause', 'menopause', 'postmenopause'],
  // Irregular or no periods (cause not said), or hormonal birth control,
  // can be perimenopause: ask, don't exclude.
  ask: ['irregular_periods', 'no_periods', 'hormonal_birth_control'],
  phrase: 'perimenopause and menopause',
};
const PREGNANCY = { stages: ['pregnant', 'postpartum'], ask: [], phrase: 'pregnancy' };
const NURSING = { stages: ['pregnant', 'postpartum', 'breastfeeding'], ask: [], phrase: 'breastfeeding and after birth' };
const PRENATAL = { stages: ['ttc', 'pregnant', 'postpartum', 'breastfeeding'], ask: [], phrase: 'trying to conceive, pregnancy and after birth' };

export const STAGE_SCOPE = {
  // Menopause-only formulas, care and apps
  'p-estroven-mood': MENOPAUSE,
  'p-remifemin': MENOPAUSE,
  'p-womaness-me': MENOPAUSE,
  'd-balance-menopause': MENOPAUSE,
  'd-midi-health': MENOPAUSE,
  'd-evernow': MENOPAUSE,
  'p-gennev-care': MENOPAUSE,
  'p-hormona-perimenopause-test-kit-app': MENOPAUSE,
  'p-proov-empower': MENOPAUSE,
  // Pregnancy-only body support
  'p-belly-bandit': PREGNANCY,
  'p-snoogle-pillow': PREGNANCY,
  'p-hatch-oil': PREGNANCY,
  // Nursing and after birth
  'p-lansinoh-pads': NURSING,
  'p-haakaa-pump': NURSING,
  'p-silverette-cups': NURSING,
  'p-willow-pump': NURSING,
  'p-boppy-pillow': NURSING,
  'p-frida-mom-kit': NURSING,
  'p-bodily-kit': NURSING,
  // Prenatal vitamin
  'p-rituals-prenatal': PRENATAL,
};

// Published Supabase listings, reviewed by ID. The broad menopause tag is
// insufficient: cooling sprays, bedding and vaginal comfort work at any age.
const LIVE_MENOPAUSE_ONLY = new Set([
  'p-everlywell-perimenopause-check',
  'd-caria-caria-menopause-midlife',
  'd-perry-perry-perimenopause-community',
  'd-stella-stella-menopause-relief',
  'p-azo-daily-pre-menopause-support-capsules-sold-under-the-azo-menopaus',
  'p-azo-menopause-relief-daytime-gummies',
  'p-biologica-midlife-essentials-daily-effervescent-multivitamin-drink-f',
  'p-biologica-postmenopause-essentials-daily-effervescent-multivitamin-f',
  'p-elektra-health-my-elektra-inc-elektra-health-menopause-clinical-care',
  'p-estroven-complete-menopause-relief-gummies',
  'p-estroven-complete-multi-symptom-menopause-relief',
  'p-estroven-maximum-strength-menopause-relief',
  'p-estroven-menopause-relief-pre-menopause',
  'p-estroven-menopause-relief-sleep-cool',
  'p-happy-v-the-menopause-complete-kit-menopause-relief-am-pm-d-mannose',
  'p-life-extension-menopause-relief-formerly-menopause-731-30-enteric-co',
  'p-maryruth-s-organic-menopause-gummies-strawberry-60-count',
  'p-menolabs-menofit-probiotic-menopause-relief-metabolism-support',
  'p-needed-perimenopause-multivitamin',
  'p-oova-perimenopause-hormone-kit-perimenopause-hormone-tracking-kit',
  'p-ovul-ai-ai-saliva-based-perimenopause-hormone-monitor-membership-sam',
  'p-perelel-perimenopause-support-pack',
  'p-ph-d-feminine-health-creatine-menopause-relief',
  'p-ph-d-feminine-health-menopause-sleep-relief',
  'p-pink-stork-menopause-support-60-capsules',
  'p-ritual-perimenopause-health',
  'p-stonehenge-health-for-women-menopause-support',
]);


// Nov 6 (founder: a "Perimenopause Support Pack" as someone's first bone-health match is confusing).
// A product whose NAME says it is for a life stage is scoped to that stage too, unless it is listed
// above. Tests and trackers that only mention a stage in passing are left out.
const NAME_SCOPES = [
  [/\b(peri)?menopaus|\bmidlife\b/i, MENOPAUSE],
  [/\bprenatal\b|\bpregnan(t|cy)\b/i, PRENATAL],
  [/\bpost-?partum\b|\bpostnatal\b|\bnursing\b|breastfeed|lactation|\bmom\b/i, NURSING],
];
const NAME_EXEMPT = /\btests?\b|\bstrips?\b|safe\b|hot flash|cool/i;
export function stageScopeFor(productId, name = '') {
  if (!productId) return null;
  if (LIVE_MENOPAUSE_ONLY.has(productId)) return MENOPAUSE;
  if (STAGE_SCOPE[productId]) return STAGE_SCOPE[productId];
  const n = String(name || '');
  if (!n || NAME_EXEMPT.test(n)) return null;
  const hit = NAME_SCOPES.find(([re]) => re.test(n));
  return hit ? hit[1] : null;
}
