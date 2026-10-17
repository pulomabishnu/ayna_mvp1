// Condition-aware safety (research, Oct 17): a diagnosed condition can make a
// product class a poor or risky choice (e.g. NSAIDs with high blood pressure,
// iron or calcium timing with thyroid medicine). Each rule cites a credible
// source (src/data/matching/conditionRules.research.js). 'avoid' holds the
// product back, 'caution' keeps it with a plain note, 'helpful' never changes
// safety. Rules only ever add caution; they never clear one.
import RULES from '../data/matching/conditionRules.research.js';

const COMPILED = RULES
  .filter((r) => r && r.condition && r.verdict && r.match && (r.match.name_regex || (r.match.categories || []).length))
  .map((r) => {
    let re = null;
    try { re = r.match.name_regex ? new RegExp(r.match.name_regex, 'i') : null; } catch { re = null; }
    return { ...r, re, cats: new Set((r.match.categories || []).map((c) => String(c).toLowerCase())) };
  });

// Fillers and colorants that share a mineral's name are not a dose of it.
const EXCIPIENTS = /\b(di|tri)?calcium (phosphate|stearate|silicate)|magnesium (stearate|silicate)|iron oxides?|potassium sorbate\b/gi;
function productText(pp) {
  const ing = Array.isArray(pp.ingredients) ? pp.ingredients.join(' ') : String(pp.ingredients || '');
  return `${pp.name || ''} ${ing}`.replace(EXCIPIENTS, ' ');
}
// Classes that only matter when swallowed (a topical serum or heat wrap with
// "iron" or "licorice" in it is not a dose).
const SWALLOWED_CLASSES = /^(iron|calcium|magnesium|ashwagandha|biotin|licorice|probiotic|inulin_fiber|insoluble_fiber|sugar_alcohol|psyllium|inositol|caffeine|berberine|st_johns_wort|echinacea|sugar_gummy_drink_mix)$/;

/** Rules that apply to this product for her conditions. */
export function conditionRulesFor(pp, conditionIds) {
  if (!pp || !conditionIds?.size) return [];
  const text = productText(pp);
  const cat = String(pp.category || '').toLowerCase();
  return COMPILED.filter((r) => conditionIds.has(r.condition)
    && (!SWALLOWED_CLASSES.test(r.product_class || '') || pp.ingested)
    && ((r.re && r.re.test(text)) || (!r.re && r.cats.has(cat)) || (r.re && r.cats.size && r.cats.has(cat) && r.re.test(text))));
}

export const CONDITION_RULE_COUNT = COMPILED.length;
