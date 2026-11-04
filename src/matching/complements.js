import { COMPLEMENTS } from '../data/complements.js';
import { isSafetyHold, isBleedingEvaluation } from '../utils/matchDisplay.js';

/** She owns it: she added it, swapped it in, or tracks it. Never a pick ayna generated. */
export function ownsProduct(p) {
  return Boolean(p && (p.userAdded || p._userSwapped || p.isTracked || p.tracked));
}

/**
 * Complements for what she owns. Pure.
 * @param {object} o
 *   owned: product objects she has; byId(id) -> catalog product; exclude: Set of ids
 *   (owned, saved, said no to); details(product) -> match details from the one engine.
 * A complement is never shown while a safety rule holds it, or after menopause
 * bleeding care (the same gates as everything else); the accessory rule that
 * keeps accessories off her matches is the only one it skips, because she asked
 * for things that go with what she owns.
 */
export function complementsFor({ owned = [], byId, exclude = new Set(), details = () => null, list = COMPLEMENTS } = {}) {
  const ownedIds = new Set(owned.filter(ownsProduct).map((p) => p.id));
  const out = [];
  for (const c of list) {
    const parentId = c.for.find((id) => ownedIds.has(id));
    if (!parentId || ownedIds.has(c.product) || exclude.has(c.product)) continue;
    const product = byId?.(c.product);
    const parent = owned.find((p) => p.id === parentId) || byId?.(parentId);
    if (!product || product.hidden || !parent) continue;
    let d = null;
    try { d = details(product); } catch { d = null; }
    if (d && (isSafetyHold(d) || isBleedingEvaluation(d))) continue;
    out.push({ product, parent, line: c.line, note: c.note, sources: c.sources });
  }
  return out;
}
