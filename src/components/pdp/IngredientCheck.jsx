import { AVOID_OPTIONS } from '../explore/avoid.js';
import { buildProductProfile } from '../../matching/productProfile.js';

/**
 * "Rate ingredients" (UCLA focus group 10/1). Not a score: what the label says it is free of,
 * read by the match engine (productProfile safety details, status 'no'). Silence is never
 * "free of", so attributes with nothing on file are named as not on file, never as a pass.
 * Shows nothing for products with no formula (devices, cups) or nothing labeled.
 */
export function ingredientCheck(product) {
  let d = {};
  try { d = buildProductProfile(product)?.safety?.details || {}; } catch { d = {}; }
  const free = AVOID_OPTIONS.filter((o) => d[o.attr]?.status === 'no').map((o) => o.label);
  const contains = AVOID_OPTIONS.filter((o) => d[o.attr]?.status === 'yes').map((o) => o.label);
  const applies = AVOID_OPTIONS.some((o) => d[o.attr]?.status !== 'not_applicable');
  if (!applies || (!free.length && !contains.length)) return null;
  const unknown = AVOID_OPTIONS.filter((o) => !['no', 'yes', 'not_applicable'].includes(d[o.attr]?.status || 'unknown')).map((o) => o.label);
  return { free, contains, unknown };
}

const list = (a) => (a.length <= 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`).toLowerCase();

export default function IngredientCheck({ product }) {
  const c = ingredientCheck(product);
  if (!c) return null;
  return (
    <section className="ay-ingcheck" aria-labelledby="ay-ingcheck-h">
      <h3 id="ay-ingcheck-h">Ingredient check</h3>
      {c.free.length > 0 && <p><b>Labeled free of</b> {list(c.free)}.</p>}
      {/* 'yes' can come from an "avoid if sensitive to" warning, so it is never stated as "contains". */}
      {c.contains.length > 0 && <p><b>Check the label if you react to</b> {list(c.contains)}.</p>}
      {c.unknown.length > 0 && <p className="ay-ingcheck__fine">Not stated on the label we have: {list(c.unknown)}.</p>}
    </section>
  );
}
