/**
 * Brand rollups for the Partner Studio API (Phase 1 plan, p.13
 * "brand_rollups / actions"). Pure: takes finished benchmark runs and
 * evidence records, returns only counts, denominators, versions and source
 * references for one brand. No consumer data exists anywhere in the input.
 */
import { recommendationShare, brandRank, lossFunnel, skuBreakdown, sensitivityRange, brandOutcome, rate } from './metrics.js';
import { evidenceMetrics, claimLandscape } from './evidence.js';
import { BUDGETS } from './scenarios.js';

export const REASON_LABEL = {
  budget: 'Budget band',
  format: 'Format preference',
  evidence: 'Evidence signal',
  relevance: 'How directly it fits the need',
  diversity_tie: 'Shelf variety or tie',
  below_cutoff: 'Under the 50% shelf bar',
  unclassified: 'Unclassified',
};

export const REASON_ACTION = {
  budget: 'Test a smaller pack or a lower price point (see the simulation).',
  format: 'Consider whether a second format fits shoppers who prefer it.',
  evidence: 'Check that your published research is linked to this product and this need.',
  relevance: 'Make sure the listing says plainly which need it is made for.',
  diversity_tie: 'Nothing to fix: a near-equal product took the slot under the shelf variety rules.',
  below_cutoff: 'Check the need mapping and published facts for this product.',
  unclassified: 'ayna will review this trace.',
};

const pct = (r) => (r?.value == null ? null : Math.round(r.value * 1000) / 10);

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Slot share for every brand with at least one product in the universe, with
 * the viewing brand marked. Peer brands are anonymized ("Peer 1" is the peer
 * with the most slots), so no tenant sees another brand's named numbers.
 */
export function shelfField(results, brand) {
  const universe = new Set();
  for (const r of results) for (const c of r.candidates) universe.add(c.brand);
  const slots = new Map([...universe].map((b) => [b, 0]));
  let total = 0;
  for (const r of results) for (const p of r.placements) { slots.set(p.brand, (slots.get(p.brand) || 0) + 1); total += 1; }
  const rows = [...slots.entries()]
    .map(([b, n]) => ({ b, n, share: total ? Math.round((n / total) * 1000) / 10 : null }))
    .sort((a, b) => b.n - a.n || String(a.b).localeCompare(String(b.b)));
  let peer = 0;
  // Ties share a rank, matching brandRank().
  const rankOf = (n) => rows.filter((x) => x.n > n).length + 1;
  const out = rows.map((r) => (r.b === brand
    ? { label: 'You', you: true, rank: rankOf(r.n), slots: r.n, share: r.share }
    : { label: `Peer ${++peer}`, you: false, rank: rankOf(r.n), slots: r.n, share: r.share }));
  // Median across peers that won at least one slot: brands with no placement
  // would pull it to 0% in long-tail categories and make every brand look "above".
  const med = median(out.filter((r) => !r.you && r.slots > 0).map((r) => r.share));
  const medAll = median(out.filter((r) => !r.you && r.share != null).map((r) => r.share));
  return {
    rows: out,
    brands: out.length,
    totalSlots: total,
    peerMedian: med == null ? null : Math.round(med * 10) / 10,
    peerMedianAll: medAll == null ? null : Math.round(medAll * 10) / 10,
    placedPeers: out.filter((r) => !r.you && r.slots > 0).length,
    zeroSlotPeers: out.filter((r) => !r.you && r.slots === 0).length,
  };
}

/** Slot share per need × budget band (cells keep their own denominators). */
export function needBudgetGrid(results, brand, needs) {
  const cols = BUDGETS.map((b) => ({ key: b.id, label: b.label }));
  const rows = needs.map((need) => ({
    need,
    cells: cols.map((c) => {
      const rs = results.filter((r) => r.need === need && r.budget === c.key);
      const m = recommendationShare(rs, brand);
      return { key: c.key, scenarios: rs.length, brandSlots: m.brandSlots, slots: m.slots, slotShare: pct(m.slotShare) };
    }),
  }));
  return { cols, rows };
}

function stageCounts(results, brand) {
  const c = { selected: 0, eligible_lost: 0, insufficient_info: 0, excluded: 0, out_of_scope: 0 };
  for (const r of results) c[brandOutcome(r, brand)] += 1;
  return c;
}

/**
 * @param {object} p
 * @param {string} p.brand
 * @param {object[]} p.categories [{ category, baseline, boundary, unknown }]
 * @param {object[]} p.evidence evidence records for every universe SKU, each with .brand and .categories
 * @param {object[]} p.simulations finished simulations for this brand
 * @param {object[]} p.skus this brand's catalog SKUs with scope info
 */
export function brandRollup({ brand, categories, evidence, simulations = [], skus, feed = [] }) {
  const cats = categories
    .filter((c) => c.baseline.some((r) => r.candidates.some((x) => x.brand === brand)))
    .map(({ category, baseline, boundary, unknown }) => {
      const share = recommendationShare(baseline, brand);
      const funnel = lossFunnel(baseline, brand);
      const sens = sensitivityRange(baseline, brand, (r) => r.budget);
      const byNeed = category.needs.map((need) => {
        const rs = baseline.filter((r) => r.need === need);
        const m = recommendationShare(rs, brand);
        return { need, scenarios: rs.length, slotShare: pct(m.slotShare), inclusion: pct(m.inclusion), eligibleToPlaced: pct(m.eligibleToPlaced), brandSlots: m.brandSlots, slots: m.slots };
      });
      return {
        id: category.id,
        label: category.label,
        scenarios: baseline.length,
        k: share.k,
        slots: share.slots,
        brandSlots: share.brandSlots,
        unfilled: share.unfilled,
        slotShare: pct(share.slotShare),
        weightedSlotShare: share.weightedSlotShare == null ? null : Math.round(share.weightedSlotShare * 1000) / 10,
        inclusion: { ...share.inclusion, pct: pct(share.inclusion) },
        eligible: { ...share.eligible, pct: pct(share.eligible) },
        eligibleToPlaced: { ...share.eligibleToPlaced, pct: pct(share.eligibleToPlaced) },
        noResult: { ...share.noResult, pct: pct(share.noResult) },
        rank: brandRank(baseline, brand),
        sensitivity: {
          min: sens.min == null ? null : Math.round(sens.min * 1000) / 10,
          max: sens.max == null ? null : Math.round(sens.max * 1000) / 10,
          rows: sens.rows.map((x) => ({ key: x.key, label: BUDGETS.find((b) => b.id === x.key)?.label || x.key, slotShare: pct(x.slotShare), inclusion: pct(x.inclusion) })),
        },
        byNeed,
        field: shelfField(baseline, brand),
        grid: needBudgetGrid(baseline, brand, category.needs),
        skus: skuBreakdown(baseline, brand),
        funnel: { ...funnel.counts, reasons: Object.entries(funnel.reasons).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, label: REASON_LABEL[id] || id, n, share: funnel.counts.eligible_lost ? Math.round((n / funnel.counts.eligible_lost) * 1000) / 10 : null, action: REASON_ACTION[id] })), sumsToLost: funnel.check, examples: funnel.examples },
        boundary: stageCounts(boundary, brand),
        unknown: stageCounts(unknown, brand),
      };
    });

  const mine = evidence.filter((r) => r.brand === brand);
  const myCats = new Set(mine.flatMap((r) => r.categories));
  const myTypes = new Set(mine.map((r) => r.productCategory));
  const peers = evidence.filter((r) => r.brand !== brand && r.categories.some((c) => myCats.has(c)) && myTypes.has(r.productCategory));
  const evidenceOut = {
    metrics: evidenceMetrics(mine, peers),
    skus: mine.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'brand' && k !== 'categories'))),
    peerSkus: peers.length,
  };
  const landscape = claimLandscape(mine, peers);

  // Competitors: up to three peers per SKU, same product category, closest price.
  const competitors = mine.map((r) => {
    const near = peers
      .filter((p) => p.productCategory === r.productCategory)
      .map((p) => ({ p, d: r.price != null && p.price != null ? Math.abs(Math.log((p.price + 1) / (r.price + 1))) : 9 }))
      .sort((a, b) => a.d - b.d || String(a.p.name).localeCompare(String(b.p.name)))
      .slice(0, 3)
      .map(({ p }) => ({ sku: p.sku, name: p.name, brand: p.brand, price: p.price, completeness: p.completeness, claims: p.claims.length, direct: p.claims.filter((c) => c.status === 'direct').length, themes: [...new Set(p.claims.flatMap((c) => c.themes))], freshness: p.freshness?.state || null, qa: p.qa.label }));
    return { sku: r.sku, name: r.name, price: r.price, completeness: r.completeness, claims: r.claims.length, direct: r.claims.filter((c) => c.status === 'direct').length, themes: [...new Set(r.claims.flatMap((c) => c.themes))], freshness: r.freshness?.state || null, qa: r.qa.label, peers: near };
  });

  const actions = buildActions({ cats, evidenceOut, simulations, feed });

  const totals = (() => {
    const all = cats.reduce((a, c) => ({ slots: a.slots + c.slots, brandSlots: a.brandSlots + c.brandSlots, scen: a.scen + c.scenarios, incl: a.incl + c.inclusion.num, elig: a.elig + c.eligible.num, placed: a.placed + c.eligibleToPlaced.num }), { slots: 0, brandSlots: 0, scen: 0, incl: 0, elig: 0, placed: 0 });
    return {
      slotShare: { ...rate(all.brandSlots, all.slots), pct: pct(rate(all.brandSlots, all.slots)) },
      inclusion: { ...rate(all.incl, all.scen), pct: pct(rate(all.incl, all.scen)) },
      eligibleToPlaced: { ...rate(all.placed, all.elig), pct: pct(rate(all.placed, all.elig)) },
      reviewCoverage: { ...evidenceOut.metrics.reviewCoverage, pct: pct(evidenceOut.metrics.reviewCoverage) },
    };
  })();

  return { brand, skus, totals, categories: cats, evidence: evidenceOut, claims: { ...landscape, differentiation: { ...landscape.differentiation, pct: pct(landscape.differentiation) } }, competitors, simulations, feed, actions };
}

const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const PRIORITY = { safety: 1, evidence: 2, documentation: 3, differentiation: 4 };

/** Prioritized action queue (p.5): safety/regulatory, then evidence, then documentation, then differentiation. */
export function buildActions({ cats, evidenceOut, simulations, feed }) {
  const out = [];
  for (const f of feed) {
    if (f.type === 'qa_correction') out.push({ id: `fix-${f.sku}`, tier: 'safety', title: `Confirm the facts ayna flagged on ${f.name}`, issue: f.detail, trace: 'Passport QA record', affected: null, action: 'Send the official source for the corrected fact.', effort: 'S', confidence: 'Draft, AI-assisted check' });
    if (f.type === 'clinician_review') out.push({ id: `clin-${f.sku}`, tier: 'safety', title: `Clinical review open on ${f.name}`, issue: f.detail, trace: 'Passport QA record', affected: null, action: 'ayna clinical review; send any safety documentation you have.', effort: 'M', confidence: 'Open review' });
  }
  for (const c of cats) {
    if (c.funnel.insufficient_info > 0) {
      out.push({ id: `info-${c.id}`, tier: 'documentation', title: `Missing facts hold you out of ${pl(c.funnel.insufficient_info, `${c.label.toLowerCase()} scenario`)}`, issue: 'The engine needs a fact it can’t find (often allergens or materials) before it can show the product to some shoppers.', trace: `${c.funnel.insufficient_info} of ${c.scenarios} synthetic scenarios`, affected: c.funnel.insufficient_info, action: 'Send the official ingredient or materials list.', effort: 'S', confidence: 'Observed in engine trace' });
    }
    if (c.boundary.insufficient_info > 0) {
      out.push({ id: `info-boundary-${c.id}`, tier: 'safety', title: `Missing facts hold you back for sensitive shoppers in ${c.label.toLowerCase()}`, issue: `${pl(c.boundary.insufficient_info, 'safety boundary scenario')} (pregnancy, breastfeeding, latex allergy, medicines) ${c.boundary.insufficient_info === 1 ? 'is' : 'are'} on hold for a fact ayna can’t find.`, trace: pl(c.boundary.insufficient_info, 'boundary scenario'), affected: c.boundary.insufficient_info, action: 'Send the official ingredient, materials or interaction information. ayna never relaxes the rule itself.', effort: 'S', confidence: 'Observed in engine trace' });
    }
    const top = c.funnel.reasons.find((r) => r.id !== 'diversity_tie' && r.id !== 'unclassified');
    if (top) out.push({ id: `loss-${c.id}-${top.id}`, tier: top.id === 'evidence' ? 'evidence' : 'differentiation', title: `${top.label} explains ${pl(top.n, `lost ${c.label.toLowerCase()} scenario`)}`, issue: `Eligible but not placed in ${c.funnel.eligible_lost} of ${c.eligible.num} eligible scenarios.`, trace: `${top.n} of ${c.funnel.eligible_lost} eligible losses`, affected: top.n, action: top.action, effort: top.id === 'budget' || top.id === 'format' ? 'L' : 'M', confidence: top.id === 'budget' ? 'Observed: price vs budget band' : 'Inferred from engine scores' });
  }
  const m = evidenceOut.metrics;
  if (m.inventoried > 0 && m.reviewCoverage.num < m.inventoried) out.push({ id: 'review', tier: 'evidence', title: `${m.inventoried - m.reviewCoverage.num} of ${pl(m.inventoried, 'claim')} ${m.inventoried - m.reviewCoverage.num === 1 ? 'awaits' : 'await'} human review`, issue: 'Claim statuses are drafts from an AI-assisted research pass.', trace: 'Passport claim ledger', affected: null, action: 'Send the studies behind your claims; ayna’s reviewer signs off each status.', effort: 'M', confidence: 'Draft' });
  if (m.flagged > 0) out.push({ id: 'flags', tier: 'evidence', title: `${m.flagged} claim${m.flagged > 1 ? 's' : ''} flagged for review`, issue: 'Wording or evidence pattern a reviewer should check. Not a violation.', trace: 'Claim ledger review flags', affected: null, action: 'Open Health claims to see each flag.', effort: 'S', confidence: 'Draft' });
  for (const f of feed) if (f.type === 'stale') out.push({ id: `stale-${f.sku}`, tier: 'documentation', title: `Facts on ${f.name} are ${f.days} days past review`, issue: f.detail, trace: 'Passport freshness', affected: null, action: 'Confirm current price and facts.', effort: 'S', confidence: 'Observed' });
  for (const s of simulations) if (s.after.inclusion.num > s.before.inclusion.num) out.push({ id: `sim-${s.sku}`, tier: 'differentiation', title: `Simulation: ${s.name} at ${s.changeLabel}`, issue: `Inclusion ${s.before.inclusion.num} → ${s.after.inclusion.num} of ${s.scenarios} synthetic scenarios.`, trace: 'Counterfactual replay, same engine and universe', affected: s.after.inclusion.num - s.before.inclusion.num, action: 'Consider whether a lower price point or smaller pack is viable.', effort: 'L', confidence: 'Simulation' });
  return out
    .sort((a, b) => PRIORITY[a.tier] - PRIORITY[b.tier] || (b.affected ?? 0) - (a.affected ?? 0))
    .map((a, i) => ({ ...a, rank: i + 1, status: 'open', owner: null }));
}
