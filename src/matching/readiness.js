// Recommendation readiness (Nov 2). "Allowed in the Shop" and "ready to be
// personalized to someone's health" are different bars. Every product gets a
// machine-computed level from its own facts, through the same gate the site uses:
//
//   browse_only            the listing itself can't be recommended (accessory,
//                          failed checks, nothing it is for)
//   research_in_progress   a safety fact is missing that holds it back for at
//                          least one sensitive person (allergy, medicines,
//                          pregnancy, breastfeeding, trying to conceive)
//   clinician_review       facts complete, a clinician sign-off is still open
//   ready                  every sensitive persona gets a real decision
//
// Nothing here writes product facts. It measures, so the team knows which
// facts to research first (scripts/catalog-readiness.mjs).
import { buildProductProfile } from './productProfile.js';
import { buildUserProfile } from './userProfile.js';
import { evaluateSafety } from './score.js';
import { recommendationEligibility } from './eligibility.js';
import { NEED_BY_ID } from './ontology.js';
import { STAGE_SCOPE } from '../data/matching/stageScope.js';

export const SENSITIVE_PANEL = [
  { name: 'fragrance allergy', intake: { allergyStatus: 'Yes', allergyItems: ['Fragrance'] } },
  { name: 'latex allergy', intake: { allergyStatus: 'Yes', allergyItems: ['Latex'] } },
  { name: 'on sertraline', intake: { takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'] } },
  { name: 'on the pill', intake: { takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'] } },
  { name: 'on levothyroxine', intake: { takesCurrent: 'Yes', currentMedicationItems: ['Levothyroxine'] } },
  { name: 'pregnant', intake: { lifeStageSelections: ['I am pregnant'] } },
  { name: 'breastfeeding', intake: { lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' } },
  { name: 'trying to conceive', intake: { lifeStageSelections: ['I am trying to conceive'] } },
  { name: 'post-menopause', intake: { lifeStageSelections: ['I am post-menopause'] } },
];
const BASE = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'] };
export const READINESS_LEVELS = ['browse_only', 'research_in_progress', 'clinician_review', 'ready'];

/** @returns {{ level, missing: {fact, holdsFor: string[]}[], clinicianOpen: boolean, stageReviewed: boolean, reason?: string }} */
export function readinessFor(product, { catalog = [], panel = SENSITIVE_PANEL } = {}) {
  let pp;
  try { pp = buildProductProfile(product); } catch { return { level: 'browse_only', missing: [], clinicianOpen: false, stageReviewed: false, reason: 'profile could not be built' }; }
  const stageReviewed = Boolean(STAGE_SCOPE?.[product.id]);
  const cat = recommendationEligibility(product, pp);
  const needs = Object.keys(pp.health_need_relevance || {}).map((id) => NEED_BY_ID[id]?.option).filter(Boolean);
  if (!cat.eligible) return { level: 'browse_only', missing: [], clinicianOpen: false, stageReviewed, reason: cat.reason };
  if (!needs.length) return { level: 'browse_only', missing: [], clinicianOpen: false, stageReviewed, reason: 'Nothing it is for is mapped yet' };
  const facts = new Map();
  let clinicianOpen = false; // Nov 9: no clinician holds (founder).
  for (const persona of panel) {
    const up = buildUserProfile({ ...BASE, ...persona.intake, supportSelections: needs.slice(0, 6) }, { catalog });
    const s = evaluateSafety(pp, up);
    if (!s.eligible || !s.restricted) continue;
    for (const f of s.missingProductInfo || []) {
      if (f === 'clinician_review') { clinicianOpen = true; continue; }
      facts.set(f, [...(facts.get(f) || []), persona.name]);
    }
  }
  const missing = [...facts.entries()].map(([fact, holdsFor]) => ({ fact, holdsFor }));
  const level = missing.length ? 'research_in_progress' : clinicianOpen ? 'clinician_review' : 'ready';
  return { level, missing, clinicianOpen, stageReviewed };
}

/** Counts by level (and by category) plus the facts that would unlock the most products. */
export function summarizeReadiness(products, opts = {}) {
  const byLevel = Object.fromEntries(READINESS_LEVELS.map((l) => [l, 0]));
  const byCategory = {};
  const blockers = new Map();
  const rows = [];
  for (const p of products) {
    if (!p?.id) continue;
    const r = readinessFor(p, { catalog: products, ...opts });
    byLevel[r.level] += 1;
    const c = String(p.category || 'other');
    byCategory[c] = byCategory[c] || Object.fromEntries(READINESS_LEVELS.map((l) => [l, 0]));
    byCategory[c][r.level] += 1;
    for (const m of r.missing) blockers.set(m.fact, (blockers.get(m.fact) || 0) + 1);
    rows.push({ id: p.id, name: p.name, category: p.category, ...r });
  }
  const total = rows.length || 1;
  return {
    total: rows.length,
    byLevel,
    readyShare: Math.round((100 * byLevel.ready) / total),
    byCategory,
    topBlockers: [...blockers.entries()].sort((a, b) => b[1] - a[1]).map(([fact, products]) => ({ fact, products })),
    rows,
  };
}
