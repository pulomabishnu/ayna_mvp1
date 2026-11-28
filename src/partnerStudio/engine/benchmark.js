/**
 * Read-only adapter to the production matching engine (Phase 1 plan, p.9).
 *
 * Runs the same code the site uses to build a shopper's shelves
 * (buildUserProfile -> buildEcosystemV2) on fictional scenarios over a frozen
 * category universe, then records a decision trace for every relevant SKU
 * with the engine's own safety decision (decideProduct). Nothing here writes
 * to the catalog, and nothing here reads a real user.
 *
 * Commercial metadata (partner status, affiliate links, commissions) is not
 * an input to anything called here; benchmark.test.js checks that changing
 * it leaves every placement unchanged.
 */
import { buildUserProfile } from '../../matching/userProfile.js';
import { buildEcosystemV2 } from '../../matching/v2.js';
import { buildProductProfile, clearProductProfileCache } from '../../matching/productProfile.js';
import { decideProduct } from '../../matching/cleared.js';
import { NEED_ID_BY_OPTION } from '../../matching/ontology.js';
import { EMPTY } from '../../mobile/data/intakeModel.js';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

export const ENGINE_ADAPTER_VERSION = 'adapter-2026-11-25.1';
export const K = 3;

const BUDGET_MAX = { 'under-25': 25, '25-75': 75, any: null };

export function priceOf(product) {
  const m = String(product?.price ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** The same quiz shape the site stores after the quiz. */
export function quizFor(intake) {
  return { fullHealthIntake: { ...EMPTY, ...intake }, personalizationCompleted: true };
}

/**
 * Why an eligible SKU was not placed. Observed facts first (price vs the
 * scenario's budget band), then the engine's own score components compared
 * with the weakest placed pick. Never guesses: no signal -> 'unclassified'.
 */
export function lossReason({ pct, components, price, scenario, weakest }) {
  const max = BUDGET_MAX[scenario.budget];
  const c = components || {};
  if (weakest && pct != null && weakest.score != null && pct >= weakest.score) {
    return { reason: 'diversity_tie', detail: `Scored ${pct}%, as high as a placed pick (${weakest.score}%); the shelf's variety and brand rules chose others.` };
  }
  if (max != null && price != null && price > max) {
    return { reason: 'budget', detail: `Price $${price} is above this scenario's $${max} budget band.` };
  }
  if (scenario.format && c.preference != null && c.preference < 0.7) {
    return { reason: 'format', detail: `Not the format this scenario prefers (${scenario.format.toLowerCase()}).` };
  }
  const w = weakest?.components || {};
  if (c.evidence != null && w.evidence != null && c.evidence < w.evidence - 0.05) {
    return { reason: 'evidence', detail: `Evidence signal ${Math.round(c.evidence * 100)} vs ${Math.round(w.evidence * 100)} for the weakest placed pick.` };
  }
  const rel = (x) => (x.health ?? 0) + (x.specificity ?? 0);
  if (c.health != null && w.health != null && rel(c) < rel(w) - 0.05) {
    return { reason: 'relevance', detail: 'Less directly made for this need than the placed picks.' };
  }
  if (pct != null && pct < 50) {
    return { reason: 'below_cutoff', detail: `Scored ${pct}%, below the 50% shelf cutoff.` };
  }
  return { reason: 'unclassified', detail: 'The engine trace does not explain this one.' };
}

/**
 * Run one scenario.
 * @returns {{ scenarioId, label, weight, k, placements, candidates }}
 */
export function runScenario(scenario, universe, { k = K, brandOf = (p) => p.brand || 'Unknown' } = {}) {
  const needId = NEED_ID_BY_OPTION[scenario.need];
  const quiz = quizFor(scenario.intake);
  const up = buildUserProfile(quiz.fullHealthIntake, { catalog: universe });
  const eco = buildEcosystemV2(up, universe);
  const shelf = (eco.shelves || []).find((s) => s.needId === needId);
  const picks = (shelf?.picks || []).slice(0, k);
  const byId = new Map(universe.map((p) => [p.id, p]));
  const placements = picks.map((pk) => ({ sku: pk.productId, name: pk.productName, brand: brandOf(byId.get(pk.productId) || {}), score: pk.score }));
  const placedIds = new Set(placements.map((p) => p.sku));
  const weakestPick = picks.length ? picks.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a)) : null;
  const weakest = weakestPick ? { score: weakestPick.score, components: weakestPick.components || {} } : null;

  const candidates = [];
  for (const p of universe) {
    const pp = buildProductProfile(p);
    if (!pp?.health_need_relevance?.[needId]) continue;
    const base = { sku: p.id, name: p.name, brand: brandOf(p) };
    if (placedIds.has(p.id)) { candidates.push({ ...base, stage: 'selected', pct: placements.find((x) => x.sku === p.id)?.score ?? null }); continue; }
    let d;
    try { d = getProductMatchDetailsForProduct(p, quiz); } catch { d = null; }
    const decision = d ? decideProduct(d) : { status: 'no_fit' };
    const pct = d?.percent ?? null;
    if (decision.status === 'hold') {
      candidates.push({ ...base, stage: 'insufficient_info', pct, detail: (d?.missingProductInfo || []).join(', ') || 'missing information' });
    } else if (decision.status === 'excluded') {
      candidates.push({ ...base, stage: 'excluded', pct, detail: (d?.excludedBecause || [])[0] || decision.reason || 'excluded' });
    } else {
      const r = lossReason({ pct, components: d?.components?.engine, price: priceOf(p), scenario, weakest });
      candidates.push({ ...base, stage: 'eligible_lost', pct, reason: r.reason, detail: r.detail });
    }
  }
  return { scenarioId: scenario.id, set: scenario.set, label: scenario.label, need: scenario.need, budget: scenario.budget, format: scenario.format ?? null, stage: scenario.stage ?? null, sensitivity: scenario.sensitivity ?? null, weight: scenario.weight ?? 1, k, placements, candidates };
}

export function runScenarios(scenarios, universe, opts) {
  return scenarios.map((s) => runScenario(s, universe, opts));
}

/** Fields a counterfactual may change. Safety, ingredients, warnings and evidence never. */
export const SIMULATABLE = new Set(['price']);

/**
 * Counterfactual lab (p.11): clone one SKU, change one permitted attribute,
 * rerun the same scenarios with the same engine and competitor universe.
 */
export function counterfactual({ universe, sku, change, scenarios, opts }) {
  const keys = Object.keys(change || {});
  if (!keys.length || keys.some((key) => !SIMULATABLE.has(key))) {
    throw new Error(`counterfactual: only ${[...SIMULATABLE].join(', ')} can be simulated`);
  }
  const target = universe.find((p) => p.id === sku);
  if (!target) throw new Error(`counterfactual: ${sku} not in universe`);
  const clone = { ...target, ...change };
  const swapped = universe.map((p) => (p.id === sku ? clone : p));
  clearProductProfileCache();
  try {
    return runScenarios(scenarios, swapped, opts);
  } finally {
    clearProductProfileCache();
  }
}
