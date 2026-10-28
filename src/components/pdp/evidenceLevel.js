import NEED_MAP_RESEARCH from '../../data/matching/needMap.research.js';
import { needPhrase } from '../../matching/ontology.js';
import { getPassport } from '../../data/passport/index.js';

/**
 * The one evidence summary for a product, used by the meter in At a glance,
 * the line next to Buy, Compare, Today and the Rundown.
 * ayna's own grades (needMap.research) win; else the level the team wrote.
 *
 * Team direction 12: the words must match the level of evidence. A grade
 * comes from a .gov page about a TYPE of product or an ingredient (heat for
 * period pain, ibuprofen for cramps), not a study of this exact product. So
 * unless a study of the product itself is on file, the words say "for this
 * type" and never "Strong evidence", and the meter tops out at 2.
 */
const RESEARCH_BY_PRODUCT = NEED_MAP_RESEARCH.reduce((m, r) => { if (!m.has(r.product)) m.set(r.product, []); m.get(r.product).push(r); return m; }, new Map());
export const LEVEL_WORDS = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'];
/** Type- or ingredient-level support (no study of this exact product). */
export const TYPE_WORDS = ['', 'Limited support for this type', 'Some support for this type', 'Supported for this type'];

const GOV_NAMES = [
  [/medlineplus\.gov/, 'MedlinePlus'], [/fda\.gov/, 'FDA'], [/niddk\.nih\.gov/, 'NIDDK'], [/nccih\.nih\.gov/, 'NCCIH'],
  [/ods\.od\.nih\.gov/, 'NIH Office of Dietary Supplements'], [/nimh\.nih\.gov/, 'NIMH'], [/nichd\.nih\.gov/, 'NICHD'],
  [/ncbi\.nlm\.nih\.gov|pubmed|pmc/, 'NIH National Library of Medicine'], [/ahrq\.gov/, 'AHRQ'], [/cdc\.gov/, 'CDC'],
  [/womenshealth\.gov/, 'womenshealth.gov'], [/dailymed/, 'DailyMed'], [/nih\.gov/, 'NIH'],
];
export function govSourceName(url) {
  const u = String(url || '').toLowerCase();
  return (GOV_NAMES.find(([re]) => re.test(u)) || [null, ''])[1];
}

export function gradedResearch(productId) {
  // Only rows graded from a .gov page; draft_unverified rows (grade null) are not shown as evidence.
  return (RESEARCH_BY_PRODUCT.get(productId) || []).filter((r) => r.grade).sort((x, y) => (x.strength === 'none') - (y.strength === 'none') || x.grade.localeCompare(y.grade));
}

function hasProductStudy(product) {
  try { return Boolean(product?.id && getPassport(product)?.evidence?.product_specific); } catch { return false; }
}

/**
 * @returns {{ level, word, need, graded, topGrade, scope: 'product'|'type'|'team'|'none', source: string, line: string }}
 * `line` is the plain sentence: "For period cramps, this type of product is
 * supported (MedlinePlus). No study of this exact product."
 */
export function evidenceLevel(product) {
  const graded = gradedResearch(product?.id);
  const topGrade = graded.find((g) => g.strength !== 'none') || null;
  const strength = String(product?.evidenceStrength || '');
  const raw = topGrade ? ({ A: 3, B: 2, C: 1 })[topGrade.grade] || 0
    : /strong/i.test(strength) ? 3 : /moderate|some/i.test(strength) ? 2 : /limited|weak|low|insufficient/i.test(strength) ? 1 : 0;
  const need = topGrade ? needPhrase(topGrade.need) : '';
  if (!topGrade) return { level: raw, word: LEVEL_WORDS[raw], need, graded, topGrade, scope: raw ? 'team' : 'none', source: '', line: '' };
  const source = govSourceName(topGrade.source_url);
  if (hasProductStudy(product)) {
    return { level: raw, word: LEVEL_WORDS[raw], need, graded, topGrade, scope: 'product', source, line: `${LEVEL_WORDS[raw]}${need ? ` for ${need}` : ''}${source ? ` (${source})` : ''}.` };
  }
  const level = Math.min(raw, 2);
  const how = raw >= 3 ? 'is supported' : raw === 2 ? 'has some support' : 'has limited support';
  const line = `${need ? `For ${need}, this` : 'This'} type of product ${how}${source ? ` (${source})` : ''}. No study of this exact product.`;
  return { level, word: TYPE_WORDS[raw], need, graded, topGrade, scope: 'type', source, line };
}

/** Words for one graded row (the per-need list on the product page). */
export function gradeWords(grade, productStudy = false) {
  const n = ({ A: 3, B: 2, C: 1 })[grade] || 0;
  return productStudy ? LEVEL_WORDS[n] : TYPE_WORDS[n];
}
