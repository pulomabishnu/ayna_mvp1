/**
 * product.verificationLinks.{doctor,scientific,community} has landed in the
 * catalog in three different shapes over time — {links:[...]} (the shape
 * every reader assumed), a bare array [...], and (for many `doctor` entries
 * specifically) a single bare citation object with no wrapper at all. Every
 * component that read `.links` directly silently dropped the entries in the
 * other two shapes — confirmed live 2026-08-25: real scientific citations on
 * ~130+ products, but the "sci lit" row in the product evidence rail was
 * missing for products whose data happened to be in one of the other shapes
 * (a bare-array or single-object `scientific`/`doctor` entry never has a
 * `.links` property, so `?.links?.length` reads as 0/undefined every time).
 *
 * Normalizes any of the three shapes to a plain array of link objects.
 */
export function getVerificationLinks(product, key) {
  const v = product?.verificationLinks?.[key];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.links)) return v.links;
  // A single bare citation object — has its own url/text rather than a `links` wrapper.
  if (typeof v === 'object' && (v.url || v.text)) return [v];
  return [];
}
