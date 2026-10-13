// Ecosystem shelves: one shelf per selected need.
//
// - Only products that pass safety AND reach the minimum tier (exploratory,
//   score >= 50, by default) are placed.
// - A product appears only on shelves where it actually scores.
// - Picks per need controls quantity, never quality: if fewer products
//   qualify, the shelf is shorter. Standards are never lowered to fill it.
// - Ordering: score first. Close scores are ordered by a small tie-break
//   bonus used only for sorting (displayed scores are unchanged):
//     FSA/HSA eligible (when she has an account)  up to 1.5 points
//     preference + trust + brand exploration fit   up to 1.0 point
//   so 94 vs 93-and-eligible can flip, 94 vs 55 never does.

import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed, evaluateSafety, computeAccess, TIERS } from './score.js';
import { NEED_BY_ID } from './ontology.js';

export const TIE_BREAK = { fsaHsa: 1.5, other: 1.0 };

// Which care resources a shelf needs, keyed by need family. Labels match
// FRUSTRATION_TO_TAG in src/data/careResources.js so getCareResourceBundle
// can add the right links.
const CARE_FRUSTRATION_BY_FAMILY = {
  urinary: 'Recurrent UTIs', menopause: 'Menopause symptoms', condition_support: 'Endometriosis', fertility: 'Fertility / TTC',
  pregnancy: 'Pregnancy', postpartum: 'Postpartum recovery',
};

/** Brand category for exploration: user_trusted | user_known | catalog_established | emerging (new_to_user is implied by not known). */
export function brandCategory(pp, up) {
  const key = pp.brand.key;
  if (key && up.shopping.trustedBrands.some((t) => t.key === key)) return 'user_trusted';
  if (key && up.experience.history.some((h) => h.brandKey === key || h.resolvedProduct?.id === pp.product_id)) return 'user_known';
  if (pp.brand.emerging) return 'emerging';
  return 'catalog_established';
}

function explorationFit(pp, up) {
  const e = up.shopping.brandExploration;
  const cat = brandCategory(pp, up);
  if (cat === 'user_trusted' || cat === 'user_known') return 1 - e;
  if (cat === 'emerging') return e;
  return 0.5;
}

function tieBreakBonus(result, pp, up) {
  const hasAccount = ['fsa', 'hsa', 'both'].includes(up.shopping.fsaHsa);
  const fsa = hasAccount && pp.fsa_hsa === 'yes' ? TIE_BREAK.fsaHsa : 0;
  const other = TIE_BREAK.other * (0.4 * result.components.preference + 0.3 * result.components.evidence + 0.3 * explorationFit(pp, up));
  return fsa + other;
}

/** Sort results by score with the tie-break bonus. Pure; returns a new array. */
export function sortResults(results, up, profilesById) {
  return [...results]
    .map((r) => ({ r, key: r.score + tieBreakBonus(r, profilesById.get(r.productId), up) }))
    .sort((a, b) => b.key - a.key || String(a.r.productId).localeCompare(String(b.r.productId)))
    .map((x) => x.r);
}

function careBundleFor(shelfNeeds, up, getCareResourceBundle) {
  if (typeof getCareResourceBundle !== 'function') return null;
  const frustrations = [...new Set(shelfNeeds.map((id) => CARE_FRUSTRATION_BY_FAMILY[NEED_BY_ID[id]?.family]).filter(Boolean))];
  return getCareResourceBundle({ frustrations }, null, up.access.zip || '');
}

/**
 * Build need shelves.
 * @param {object} up buildUserProfile() result
 * @param {object[]} products catalog products
 * @param {{ picksPerNeed?: number, minTier?: 'excellent'|'strong'|'exploratory'|'browse', minScore?: number,
 *   getCareResourceBundle?: Function }} [options]
 *   getCareResourceBundle: pass the function from src/data/careResources.js to attach
 *   care links; omitted in tests to keep this module pure.
 */
export function buildEcosystem(up, products, options = {}) {
  const picksPerNeed = options.picksPerNeed ?? up.shopping.picksPerNeed ?? 3;
  const minScore = options.minScore ?? TIERS.find((t) => t.id === (options.minTier || 'exploratory')).min;
  const profilesById = new Map();
  const safetyById = new Map();
  for (const p of products || []) {
    const pp = buildProductProfile(p);
    if (!pp?.product_id || profilesById.has(pp.product_id)) continue;
    profilesById.set(pp.product_id, pp);
    safetyById.set(pp.product_id, evaluateSafety(pp, up));
  }

  const shelves = [];
  let anyCareProminent = up.safety.careProminent;
  for (const need of up.healthIntent.needs) {
    const results = [];
    let excludedCount = 0;
    let belowThreshold = 0;
    let careProminent = up.safety.careProminent;
    for (const pp of profilesById.values()) {
      if (!pp.health_need_relevance[need.id]) continue; // only shelves where it actually scores
      const r = scoreProductForNeed(pp, up, need.id, { safety: safetyById.get(pp.product_id) });
      careProminent = careProminent || r.careProminent;
      if (!r.safety.eligible) { excludedCount += 1; continue; }
      if (r.filtered) { excludedCount += 1; continue; }
      if (r.score < minScore) { belowThreshold += 1; continue; }
      results.push({ ...r, access: computeAccess(pp, up) });
    }
    const sorted = sortResults(results, up, profilesById);
    const picks = sorted.slice(0, picksPerNeed);
    anyCareProminent = anyCareProminent || careProminent;
    const care = (careProminent || need.id.startsWith('care.')) ? careBundleFor([need.id], up, options.getCareResourceBundle) : null;
    shelves.push({
      needId: need.id,
      label: need.label,
      source: need.source,
      picks,
      qualifiedCount: sorted.length,
      excludedCount,
      belowThresholdCount: belowThreshold,
      shortBy: Math.max(0, picksPerNeed - picks.length),
      emptyReason: picks.length ? null : sorted.length === 0 && belowThreshold > 0 ? 'no_product_meets_quality_bar' : 'no_matching_products',
      careFirst: up.safety.careFirst,
      careProminent,
      care,
    });
  }

  return {
    shelves,
    careFirst: up.safety.careFirst,
    careProminent: anyCareProminent,
    care: up.safety.careFirst || up.safety.careProminent ? careBundleFor(up.healthIntent.needs.map((n) => n.id), up, options.getCareResourceBundle) : null,
    picksPerNeed,
    minScore,
  };
}
