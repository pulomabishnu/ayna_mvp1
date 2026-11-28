/* Product readiness for ayna's matching engine: which listing facts are on file
   and which ones the engine was missing in the simulation. Pure. */

/** A product is scored only when ayna could run at least this many checks (price alone isn't a readiness score). */
export const MIN_CHECKS = 3;

export const CHECKS = [
  { key: 'price', short: 'Price', label: 'Price on file', fix: 'Send the current price and pack size.' },
  { key: 'materials', short: 'Ingredients', label: 'Ingredients or materials listed', fix: 'Send the full ingredient or materials list from the label.' },
  { key: 'instructions', short: 'Instructions', label: 'Use instructions', fix: 'Send the use instructions from the label or your site.' },
  { key: 'fresh', short: 'Up to date', label: 'Facts not past their review date', fix: 'Confirm the facts are still current so ayna can mark them verified.' },
  { key: 'engine', short: 'Engine had facts', label: 'Matching engine had every fact it needed', fix: 'Send the attribute the engine was missing (usually ingredients or materials).' },
  { key: 'need', short: 'Matched to a need', label: 'Listed for a shopper need in the simulation', fix: 'Tell ayna which need the product is made for so it can be matched.' },
];

/**
 * @param {object} b brand rollup (skus, competitors, categories)
 * @returns {{ products: object[], score: number|null, gaps: object[] }}
 */
export function readinessFor(b) {
  const cards = Object.fromEntries((b?.competitors || []).map((c) => [c.sku, c]));
  const engine = {};
  for (const c of b?.categories || []) for (const s of c.skus || []) {
    const e = engine[s.sku] || { missing: 0, inScope: 0 };
    e.missing += s.insufficient_info || 0;
    e.inScope += (s.selected || 0) + (s.eligible_lost || 0) + (s.insufficient_info || 0) + (s.excluded || 0);
    engine[s.sku] = e;
  }
  const products = (b?.skus || []).map((s) => {
    const card = cards[s.id];
    const eng = engine[s.id];
    const checks = {
      price: s.price != null || card?.price != null,
      materials: card ? card.materials === 'complete' : null,
      instructions: card ? card.instructions === 'present' : null,
      fresh: card ? card.freshness === 'current' : null,
      engine: eng ? eng.missing === 0 : null,
      need: s.inScope ? Boolean(eng && eng.inScope > 0) : null,
    };
    const known = Object.values(checks).filter((v) => v != null);
    const passed = known.filter(Boolean).length;
    return {
      id: s.id,
      name: s.name,
      price: s.price ?? card?.price ?? null,
      completeness: card?.completeness ?? null,
      regulatory: card?.regulatory || null,
      lastVerified: card?.lastVerified || null,
      inScope: Boolean(s.inScope),
      scopeNote: s.scopeNote || null,
      checks,
      passed,
      checked: known.length,
      partial: known.length < MIN_CHECKS,
      score: known.length >= MIN_CHECKS ? Math.round((passed / known.length) * 100) : null,
    };
  });
  const gaps = CHECKS.map((c) => ({ ...c, products: products.filter((p) => p.checks[c.key] === false).map((p) => p.name) })).filter((g) => g.products.length);
  const scored = products.filter((p) => p.score != null);
  const score = scored.length ? Math.round(scored.reduce((a, p) => a + p.score, 0) / scored.length) : null;
  return { products, score, gaps };
}
