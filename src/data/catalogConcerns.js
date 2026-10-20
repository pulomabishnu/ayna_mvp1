import NEED_MAP_RESEARCH from './matching/needMap.research.js';

/**
 * Specific needs per product for product_catalog.concerns /
 * primary_concern (PostHog audit, Oct 20: categories like "intimate health"
 * are too broad to analyze, e.g. UTI vs dryness vs BV).
 *
 * Source: the research-reviewed need map the matching engine already uses
 * (needMap.research.js, each row with a cited source), so analytics and
 * matching agree. Only rows marked primary or secondary count. Products the
 * research hasn't covered get no concerns, never a guess.
 *
 * Ids are the need map's own (vaginal.dryness, vaginal.bv, vaginal.odor,
 * urinary.recurrent_uti, pain.menstrual_cramp, ...).
 */
const STRENGTH_RANK = { primary: 0, secondary: 1 };
const GRADE_RANK = { A: 0, B: 1, C: 2 };

export function buildCatalogConcerns(rows = NEED_MAP_RESEARCH) {
  const byProduct = new Map();
  for (const row of rows) {
    if (!row?.product || !row?.need || !(row.strength in STRENGTH_RANK)) continue;
    if (!byProduct.has(row.product)) byProduct.set(row.product, []);
    byProduct.get(row.product).push(row);
  }
  const out = {};
  for (const [product, list] of byProduct) {
    const seen = new Set();
    const ordered = list
      .slice()
      .sort((a, b) => (STRENGTH_RANK[a.strength] - STRENGTH_RANK[b.strength])
        || ((GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9))
        || String(a.need).localeCompare(String(b.need)))
      .map((r) => r.need)
      .filter((n) => (seen.has(n) ? false : seen.add(n)));
    out[product] = { concerns: ordered, primaryConcern: ordered[0] || null };
  }
  return out;
}

export const CATALOG_CONCERNS = buildCatalogConcerns();
