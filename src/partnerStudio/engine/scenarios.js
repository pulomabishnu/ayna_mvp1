/**
 * Synthetic scenario library (Phase 1 plan, p.3 and p.9).
 *
 * Every scenario is a fictional quiz answer set. None is built from, or
 * weighted by, a real user. The baseline is a full factorial design with
 * equal weights: need x life stage x budget band x format preference x one
 * sensitivity. That is an analytical design choice, not a population
 * estimate. Safety boundary cases and unknown-input cases are separate sets
 * so they never move the baseline numbers.
 *
 * Changing any list here is a methodology change: bump SCENARIO_SET_VERSION.
 */
export const SCENARIO_SET_VERSION = 'scn-2026-11-25.1';

const BASE = {
  allergyStatus: 'No',
  takesCurrent: 'No',
  safetyConcern: 'No',
  diagnosisSelections: ['None that I know of'],
};

export const LIFE_STAGES = {
  'period-care': ['I get periods regularly', 'I use hormonal birth control', 'I am in perimenopause'],
  'intimate-care': ['I get periods regularly', 'I am postpartum', 'I am post-menopause'],
  'bladder-pelvic': ['I get periods regularly', 'I am postpartum', 'I am post-menopause'],
};

/** Fixed budget bands, using the quiz's own options. */
export const BUDGETS = [
  { id: 'under-25', label: 'Under $25', priceRange: ['Under $25'] },
  { id: '25-75', label: '$25 to $75', priceRange: ['$25–$75'] },
  { id: 'any', label: 'Price not a factor', priceRange: ['Price is not a major factor for me'] },
];

export const SENSITIVITIES = [
  { id: 'none', label: 'No allergies', intake: {} },
  { id: 'fragrance', label: 'Fragrance allergy', intake: { allergyStatus: 'Yes', allergyItems: ['Fragrance'] } },
];

export const BOUNDARY = [
  { id: 'pregnant', label: 'Pregnant', intake: { lifeStageSelections: ['I am pregnant'] } },
  { id: 'breastfeeding', label: 'Breastfeeding', intake: { lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' } },
  { id: 'latex', label: 'Latex allergy', intake: { lifeStageSelections: ['I get periods regularly'], allergyStatus: 'Yes', allergyItems: ['Latex'] } },
  { id: 'sertraline', label: 'Takes sertraline', intake: { lifeStageSelections: ['I get periods regularly'], takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'] } },
  { id: 'warfarin', label: 'Takes warfarin', intake: { lifeStageSelections: ['I get periods regularly'], takesCurrent: 'Yes', currentMedicationItems: ['Warfarin'] } },
];

export const UNKNOWN_INPUT = [
  { id: 'skipped-allergies', label: 'Skipped the allergy question', intake: { lifeStageSelections: ['I get periods regularly'], allergyStatus: '' } },
  { id: 'skipped-medicines', label: 'Skipped the medicine question', intake: { lifeStageSelections: ['I get periods regularly'], takesCurrent: '' } },
  { id: 'skipped-life-stage', label: 'Skipped life stage', intake: { lifeStageSelections: [] } },
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The scenario sets for one category. Ids are stable strings so a scenario
 * can be compared across runs.
 * @returns {{ baseline: object[], boundary: object[], unknown: object[] }}
 */
export function scenariosFor(category) {
  const baseline = [];
  const stages = LIFE_STAGES[category.id] || ['I get periods regularly'];
  for (const need of category.needs) {
    for (const stage of stages) {
      for (const budget of BUDGETS) {
        for (const fmt of ['No preference', category.format]) {
          for (const sens of SENSITIVITIES) {
            const id = [category.id, slug(need), slug(stage), budget.id, fmt === 'No preference' ? 'any-format' : 'format', sens.id].join(':');
            baseline.push({
              id,
              set: 'baseline',
              weight: 1,
              need,
              stage,
              budget: budget.id,
              format: fmt === 'No preference' ? null : fmt,
              sensitivity: sens.id,
              label: `${need} · ${stage.replace(/^I (am |get |use )?/, '')} · ${budget.label}${fmt === 'No preference' ? '' : ` · prefers ${fmt.toLowerCase()}`}${sens.id === 'none' ? '' : ` · ${sens.label.toLowerCase()}`}`,
              intake: {
                ...BASE,
                lifeStageSelections: [stage],
                supportSelections: [need],
                priceRange: budget.priceRange,
                preferredFormats: [fmt],
                ...sens.intake,
              },
            });
          }
        }
      }
    }
  }
  const extra = (list, set) => category.needs.flatMap((need) => list.map((b) => ({
    id: [category.id, set, slug(need), b.id].join(':'),
    set,
    weight: 1,
    need,
    stage: null,
    budget: 'any',
    format: null,
    sensitivity: b.id,
    label: `${need} · ${b.label}`,
    intake: { ...BASE, supportSelections: [need], priceRange: ['Price is not a major factor for me'], preferredFormats: ['No preference'], ...b.intake },
  })));
  return { baseline, boundary: extra(BOUNDARY, 'boundary'), unknown: extra(UNKNOWN_INPUT, 'unknown') };
}
