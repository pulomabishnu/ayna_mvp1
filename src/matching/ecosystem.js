// Ecosystem shelves: one shelf per selected need.
//
// - Only products that pass safety AND reach the minimum tier (exploratory,
//   score >= 50, by default) are placed. "Restricted" products (a required
//   safety answer is missing) are held back and counted, never shown as a
//   low match.
// - Ingested products have a slightly higher qualification bar when their
//   relationship is only secondary/adjacent or the evidence is not for the
//   claim being used. Marketing copy alone must not create a high-confidence
//   ecosystem recommendation.
// - A product appears only on shelves where it actually scores.
// - Picks per need controls quantity, never quality: if fewer products
//   qualify, the shelf is shorter. Standards are never lowered to fill it.
// - Ordering: score first. Close scores are ordered by a small tie-break
//   bonus used only for sorting (displayed scores are unchanged):
//     FSA/HSA eligible (when she has an account)            up to 1.5 points
//     preference, trust, brand exploration, confidence,
//     product quality (cold-start prior) and community        up to 1.0 point
//   so 94 vs 93-and-eligible can flip, 94 vs 55 never does. Community and
//   popularity only act here, after eligibility and relevance.
// - Diversity: picks are re-ranked so a shelf is not five products from one
//   brand or five of the same approach (a few points at most), and a product
//   already selected for another need gets a modest cross-shelf penalty so
//   one broad "does everything" product does not dominate the whole ecosystem.
// - Every shelf answers "do we actually have a good recommendation?" (quality) and
//   names "best for" roles when they are true.

import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed, evaluateSafety, evidenceChannels, TIERS, REQUIRED_FIELD_TEXT, PRODUCT_INFO_TEXT } from './score.js';
import { NEED_BY_ID, needPhrase } from './ontology.js';

export const TIE_BREAK = { fsaHsa: 1.5, other: 1.0 };
export const DIVERSITY_PENALTY = { brand: 3, mechanism: 1.5, format: 1 };
export const CROSS_SHELF_REPEAT_PENALTY = 8;

// Supplements/other ingestibles should not make an ecosystem shelf merely
// because a broad or secondary marketing claim barely clears the global 50
// exploratory bar. These floors affect ecosystem seeding only; the displayed
// match remains the real score and the product can still be found in Shop.
export const INGESTED_RELATIONSHIP_MIN_SCORE = {
  direct: 50,
  strong: 55,
  secondary: 58,
  adjacent: 70,
  weak: 100,
  unrelated: 100,
};
const WEAK_CLAIM_EVIDENCE = new Set(['none', 'community_only', 'not_for_this_claim']);

function qualificationForEcosystem(result, pp, baseMinScore) {
  let floor = baseMinScore;
  let effectiveScore = result.score;
  if (!pp?.ingested) return { floor, effectiveScore };

  floor = Math.max(floor, INGESTED_RELATIONSHIP_MIN_SCORE[result.relationship] ?? baseMinScore);
  const evidenceLevel = result.evidence?.level || 'none';

  // For swallowed products, evidence matters even if the user skipped the
  // optional trust-ranking question. Community chatter or evidence for a
  // different claim should not be enough to seed a supplement automatically.
  if (WEAK_CLAIM_EVIDENCE.has(evidenceLevel)) {
    floor = Math.max(floor, 70);
    effectiveScore -= 15;
  }

  // "PMS" in a supplement's product name used to grant DIRECT relevance by
  // itself. Keep that product discoverable, but do not let the marketing name
  // alone create an ecosystem pick. A general PMS guideline explains the
  // condition; it does not validate that named supplement. Only evidence tied
  // to the actual product preserves automatic ecosystem seeding here.
  const relevanceRule = pp.health_need_relevance?.[result.needId]?.rule || null;
  if (relevanceRule === 'pms_named' && evidenceLevel !== 'product_specific') {
    floor = Math.max(floor, 65);
    effectiveScore = Math.min(effectiveScore, 59);
  }

  return { floor, effectiveScore };
}

function applyCrossShelfPenalty(sorted, selectedCounts) {
  return sorted
    .map((r, i) => ({
      r,
      key: r.score - CROSS_SHELF_REPEAT_PENALTY * (selectedCounts.get(r.productId) || 0) - i * 1e-6,
    }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.r);
}

const CARE_FRUSTRATION_BY_NEED = {
  'urinary.burning': 'Recurrent UTIs', 'urinary.frequency': null, 'urinary.urgency': null, 'urinary.recurrent_uti': 'Recurrent UTIs',
  'menopause.body_changes': 'Menopause symptoms', 'condition_support.endometriosis': 'Endometriosis', 'condition_support.pcos': 'PCOS symptoms',
  'fertility.ttc': 'Fertility / TTC', 'fertility.support': 'Fertility / TTC', 'pregnancy.prenatal': 'Pregnancy', 'pregnancy.discomfort': 'Pregnancy',
  'postpartum.recovery': 'Postpartum recovery', 'pain.pelvic': 'Pelvic pain', 'pain.menstrual_cramp': 'Painful cramps', 'period.heavy': 'Heavy flow',
};
function careFrustrationsFor(needIds, up) {
  const out = needIds.map((id) => CARE_FRUSTRATION_BY_NEED[id]).filter(Boolean);
  if (up.contexts?.menopause_transition && needIds.some((id) => id.startsWith('vasomotor.'))) out.push('Menopause symptoms');
  return [...new Set(out)];
}

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

export function qualityPrior(pp) {
  if (!pp?.evidence) return 0;
  const ch = evidenceChannels(pp);
  return Math.max(0, Math.min(1, 0.4 * (pp.metadata_confidence || 0) + 0.35 * Math.max(ch.clinical, ch.expert) + 0.25 * ch.community));
}

function tieBreakBonus(result, pp, up) {
  if (!pp) return 0;
  const hasAccount = ['fsa', 'hsa', 'both'].includes(up.shopping.fsaHsa);
  const fsa = hasAccount && pp.fsa_hsa === 'yes' ? TIE_BREAK.fsaHsa : 0;
  const c = result.components || {};
  const pref = c.preference ?? 0.6;
  const evid = c.evidence ?? 0.5;
  const coldStart = 1 - (up.completeness ?? 0.5);
  const other = TIE_BREAK.other * Math.min(1,
    0.3 * pref + 0.2 * evid + 0.2 * explorationFit(pp, up) + 0.15 * (result.confidence ?? 0.6) + 0.15 * qualityPrior(pp) * (0.5 + coldStart));
  return fsa + other;
}

export function sortResults(results, up, profilesById) {
  return [...results]
    .map((r) => ({ r, key: r.score + tieBreakBonus(r, profilesById.get(r.productId), up) }))
    .sort((a, b) => b.key - a.key || String(a.r.productId).localeCompare(String(b.r.productId)))
    .map((x) => x.r);
}

export function diversify(sorted, profilesById, up, limit = sorted.length, selectedCounts = null) {
  const pool = sorted.map((r, i) => ({
    r,
    key: r.score
      + tieBreakBonus(r, profilesById.get(r.productId), up)
      - CROSS_SHELF_REPEAT_PENALTY * (selectedCounts?.get(r.productId) || 0)
      - i * 1e-6,
  }));
  const out = [];
  while (pool.length && out.length < limit) {
    let bestIdx = 0;
    let bestKey = -Infinity;
    pool.forEach((c, idx) => {
      const pp = profilesById.get(c.r.productId);
      let pen = 0;
      for (const o of out) {
        const op = profilesById.get(o.productId);
        if (!pp || !op) continue;
        if (pp.brand.key && pp.brand.key === op.brand.key) pen += DIVERSITY_PENALTY.brand;
        if (pp.mechanism?.rules?.[0] && pp.mechanism.rules[0] === op.mechanism?.rules?.[0]) pen += DIVERSITY_PENALTY.mechanism;
        if (pp.formats?.length && pp.formats.join() === (op.formats || []).join()) pen += DIVERSITY_PENALTY.format;
      }
      const k = c.key - Math.min(pen, 4);
      if (k > bestKey) { bestKey = k; bestIdx = idx; }
    });
    out.push(pool.splice(bestIdx, 1)[0].r);
  }
  return out;
}

export function compareResults(a, b) {
  if (!a || !b) return [];
  const out = [];
  if ((a.relevance - b.relevance) >= 0.1) out.push({ dimension: 'relevance', text: `More directly matches the ${needPhrase(a.needId)} you selected` });
  const dv = (k) => (a.dimensions?.values?.[k] ?? null) != null && (b.dimensions?.values?.[k] ?? null) != null ? a.dimensions.values[k] - b.dimensions.values[k] : 0;
  if (dv('format') >= 0.3) out.push({ dimension: 'format', text: 'In a format you prefer' });
  if (dv('price') >= 0.15) out.push({ dimension: 'price', text: 'Closer to your budget' });
  if (dv('values') >= 0.3) out.push({ dimension: 'values', text: 'Matches more of what you asked for' });
  if (dv('evidence') >= 0.2) out.push({ dimension: 'evidence', text: 'Stronger on what you trust most' });
  if (((a.points?.experience ?? 0) - (b.points?.experience ?? 0)) >= 3) out.push({ dimension: 'experience', text: 'Closer to what has worked for you' });
  if (((a.confidence ?? 0) - (b.confidence ?? 0)) >= 0.15) out.push({ dimension: 'confidence', text: 'We have more complete information on it' });
  return out;
}

export function assignRoles(qualified, profilesById, up) {
  const roles = {};
  if (!qualified.length) return roles;
  const top = qualified[0];
  roles.best_overall = top.productId;
  const near = (r, pts) => r.score >= top.score - pts;
  const cost = (r) => { const pp = profilesById.get(r.productId); return pp?.pricing?.per_month ?? pp?.price?.amount ?? null; };
  const topCost = cost(top);
  const budget = qualified.filter((r) => near(r, 12) && cost(r) != null).sort((a, b) => cost(a) - cost(b))[0];
  if (budget && (topCost == null || cost(budget) <= topCost * 0.85) && budget.productId !== top.productId) roles.best_budget = budget.productId;
  const evScore = (r) => { const e = r.evidence?.forThisNeed; return e ? 2 * (e.product_specific || 0) + (e.clinical_guideline || 0) + 0.5 * (e.ingredient_specific || 0) : 0; };
  const strongest = qualified.filter((r) => near(r, 15) && evScore(r) > 0).sort((a, b) => evScore(b) - evScore(a))[0];
  if (strongest) roles.strongest_evidence = strongest.productId;
  if (up.shopping.formats.preferred.length) {
    const pf = qualified.find((r) => (profilesById.get(r.productId)?.formats || []).some((f) => up.shopping.formats.preferred.includes(f)));
    if (pf) roles.preferred_format = pf.productId;
  }
  const familiar = qualified.find((r) => ['user_trusted', 'user_known'].includes(brandCategory(profilesById.get(r.productId), up)));
  if (familiar) roles.familiar_brand = familiar.productId;
  const topPP = profilesById.get(top.productId);
  const alt = qualified.find((r) => {
    if (r.productId === top.productId) return false;
    const pp = profilesById.get(r.productId);
    return pp && topPP && pp.mechanism?.rules?.[0] !== topPP.mechanism?.rules?.[0] && pp.formats.join() !== topPP.formats.join();
  });
  if (alt) roles.alternative_approach = alt.productId;
  return roles;
}

function careBundleFor(shelfNeeds, up, getCareResourceBundle) {
  if (typeof getCareResourceBundle !== 'function') return null;
  return getCareResourceBundle({ frustrations: careFrustrationsFor(shelfNeeds, up) }, null, up.access.zip || '');
}

function shelfQuality(picks, restrictedCount, needId, userFieldsMissing = true) {
  const phrase = needPhrase(needId);
  if (!picks.length) {
    if (restrictedCount && !userFieldsMissing) return { quality: 'none', note: `We are still checking safety details for the products that fit ${phrase}, so we are holding them back.` };
    return restrictedCount
      ? { quality: 'none', note: `We need a couple of safety details before we can suggest products for ${phrase}.` }
      : { quality: 'none', note: `We do not have a product we can stand behind for ${phrase} yet, so we are not showing filler.` };
  }
  const strong = picks.some((p) => p.score >= 65 && p.confidence >= 0.5);
  return strong ? { quality: 'good', note: null } : { quality: 'limited', note: `Only a few looser matches for ${phrase}.` };
}

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
  const selectedAcrossShelves = new Map();
  let anyCareProminent = up.safety.careProminent;
  for (const need of up.healthIntent.needs) {
    const results = [];
    let excludedCount = 0;
    let belowThreshold = 0;
    let restrictedCount = 0;
    const missingFields = new Set();
    const missingProductInfo = new Set();
    let careProminent = up.safety.careProminent;
    for (const pp of profilesById.values()) {
      if (!pp.health_need_relevance[need.id]) continue;
      const r = scoreProductForNeed(pp, up, need.id, { safety: safetyById.get(pp.product_id) });
      careProminent = careProminent || r.careProminent;
      if (!r.safety.eligible) { excludedCount += 1; continue; }
      if (r.filtered) { excludedCount += 1; continue; }
      const qualification = qualificationForEcosystem(r, pp, minScore);
      if (qualification.effectiveScore < qualification.floor || !r.explainable) { belowThreshold += 1; continue; }
      if (r.restricted && !options.includeRestricted) {
        restrictedCount += 1;
        r.safety.missingFields.forEach((f) => missingFields.add(f));
        (r.safety.missingProductInfo || []).forEach((f) => missingProductInfo.add(f));
        continue;
      }
      results.push(r);
    }
    const sorted = sortResults(results, up, profilesById);
    const acrossNeeds = applyCrossShelfPenalty(sorted, selectedAcrossShelves);
    const picks = (options.diversity === false
      ? acrossNeeds
      : diversify(sorted, profilesById, up, picksPerNeed, selectedAcrossShelves)).slice(0, picksPerNeed);
    picks.forEach((p) => selectedAcrossShelves.set(p.productId, (selectedAcrossShelves.get(p.productId) || 0) + 1));
    const roles = assignRoles(acrossNeeds, profilesById, up);
    picks.forEach((p, i) => {
      p.roles = Object.entries(roles).filter(([, id]) => id === p.productId).map(([role]) => role);
      p.aboveNext = picks[i + 1] ? compareResults(p, picks[i + 1]) : [];
    });
    anyCareProminent = anyCareProminent || careProminent;
    const care = (careProminent || need.id.startsWith('care.')) ? careBundleFor([need.id], up, options.getCareResourceBundle) : null;
    const quality = shelfQuality(picks, restrictedCount, need.id, missingFields.size > 0);
    shelves.push({
      needId: need.id,
      label: need.label,
      source: need.source,
      kind: need.kind || NEED_BY_ID[need.id]?.kind || null,
      picks,
      qualifiedCount: acrossNeeds.length,
      excludedCount,
      belowThresholdCount: belowThreshold,
      restrictedCount,
      missingSafetyFields: [...missingFields],
      missingSafetyText: [...missingFields].map((f) => REQUIRED_FIELD_TEXT[f]).filter(Boolean),
      missingProductInfo: [...missingProductInfo],
      missingProductInfoText: [...missingProductInfo].map((f) => PRODUCT_INFO_TEXT[f]).filter(Boolean),
      shortBy: Math.max(0, picksPerNeed - picks.length),
      emptyReason: picks.length ? null : restrictedCount ? 'needs_safety_details' : acrossNeeds.length === 0 && belowThreshold > 0 ? 'no_product_meets_quality_bar' : 'no_matching_products',
      quality: quality.quality,
      qualityNote: quality.note,
      roles,
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
    completeness: up.completeness ?? null,
  };
}