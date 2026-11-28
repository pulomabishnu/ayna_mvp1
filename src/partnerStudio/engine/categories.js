/**
 * Partner Studio, Phase 1 benchmark universes (ayna Intelligence Phase 1 plan, p.3).
 *
 * Phase 1 starts narrow: menstrual comfort, intimate care, and bladder and
 * pelvic floor. Each universe is the set of catalog products the real
 * matching engine treats as relevant to at least one of its quiz needs.
 *
 * At-home testing and telehealth are out of scope until a clinical reviewer
 * approves a separate rubric, so those categories never enter a universe.
 * Changing anything in this file is a methodology change: bump the version.
 */
import { NEED_ID_BY_OPTION } from '../../matching/ontology.js';

export const CATEGORY_SET_VERSION = 'cat-2026-11-25.1';

export const PHASE1_CATEGORIES = [
  {
    id: 'period-care',
    label: 'Period care and comfort',
    needs: ['Cramps or period pain', 'Heavy periods', 'Period product support', 'Pelvic pain'],
    format: 'Period-care products',
  },
  {
    id: 'intimate-care',
    label: 'Intimate care',
    needs: ['Vaginal dryness', 'Vaginal itching or irritation', 'Vaginal odor', 'Unusual vaginal discharge', 'Pain or discomfort during sex'],
    format: 'Creams, lotions, or gels',
  },
  {
    id: 'bladder-pelvic',
    label: 'Bladder and pelvic floor',
    needs: ['Bladder leakage or incontinence', 'Urinary urgency', 'Frequent urination', 'Recurrent UTI-like symptoms'],
    format: 'Devices or wearables',
  },
];

/** Catalog categories that need their own clinical rubric before they can be benchmarked. */
export const OUT_OF_SCOPE_CATEGORIES = new Set(['diagnostics', 'telehealth', 'medication']);
export const OUT_OF_SCOPE_REASON = 'At-home testing, telehealth and medicines need a separate clinical rubric before Phase 1 can benchmark them.';

export function needIdsFor(category) {
  return category.needs.map((option) => NEED_ID_BY_OPTION[option]).filter(Boolean);
}

/**
 * Products in a category's universe: relevant (per the engine's own product
 * profile) to at least one of its needs, and not in an out-of-scope category.
 * @param {object[]} products catalog products
 * @param {object} category one of PHASE1_CATEGORIES
 * @param {(p: object) => object|null} profileOf buildProductProfile
 */
export function universeFor(products, category, profileOf) {
  const ids = new Set(needIdsFor(category));
  const out = [];
  for (const p of products || []) {
    if (!p?.id) continue;
    if (OUT_OF_SCOPE_CATEGORIES.has(String(p.category || '').toLowerCase())) continue;
    const pp = profileOf(p);
    const rel = pp?.health_need_relevance || {};
    if (Object.keys(rel).some((id) => ids.has(id))) out.push(p);
  }
  return out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
