import NEED_MAP_RESEARCH from '../../data/matching/needMap.research.js';
import { needPhrase } from '../../matching/ontology';

/**
 * The one evidence summary for a product (Limited / Some / Strong), used by
 * the meter in At a glance and by the line under the price on phones.
 * ayna's own grades (needMap.research) win; else the level the team wrote.
 */
const RESEARCH_BY_PRODUCT = NEED_MAP_RESEARCH.reduce((m, r) => { if (!m.has(r.product)) m.set(r.product, []); m.get(r.product).push(r); return m; }, new Map());
export const LEVEL_WORDS = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'];

export function gradedResearch(productId) {
  return (RESEARCH_BY_PRODUCT.get(productId) || []).slice().sort((x, y) => (x.strength === 'none') - (y.strength === 'none') || x.grade.localeCompare(y.grade));
}

export function evidenceLevel(product) {
  const graded = gradedResearch(product?.id);
  const topGrade = graded.find((g) => g.strength !== 'none') || null;
  const strength = String(product?.evidenceStrength || '');
  const level = topGrade ? ({ A: 3, B: 2, C: 1 })[topGrade.grade] || 0
    : /strong/i.test(strength) ? 3 : /moderate|some/i.test(strength) ? 2 : /limited|weak|low|insufficient/i.test(strength) ? 1 : 0;
  return { level, word: LEVEL_WORDS[level], need: topGrade ? needPhrase(topGrade.need) : '', graded, topGrade };
}
