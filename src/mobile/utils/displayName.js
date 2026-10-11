/**
 * Product name for display next to a visible brand label.
 * "Neycher Odor Be Gone" + brand "Neycher" → "Odor Be Gone".
 * Leaves the name alone when stripping would leave nothing meaningful,
 * or when the brand isn't a leading prefix. Accessible labels keep the full name.
 */
export function displayName(product) {
  const name = String(product?.name || '').trim();
  const brand = String(product?.brand || '').trim();
  if (!name || !brand) return name;
  const lowerName = name.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  if (!lowerName.startsWith(lowerBrand)) return name;
  const next = name.charAt(brand.length);
  // Must end on a word boundary: "Saalt Cup" yes, "Saaltwater" no.
  if (next && !/[\s:–—\-|,®™'’]/.test(next)) return name;
  const rest = name.slice(brand.length).replace(/^[\s:–—\-|,®™]+/, '').replace(/^['’]s\s+/i, '').trim();
  if (rest.length < 3) return name;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
