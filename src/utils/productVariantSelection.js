export function getVariantSelection(product, selectedId) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const found = variants.find(option => option.id === selectedId) || null;
  // Variant labels arrive from catalog data; ayna copy never shows an em dash.
  const variant = found ? { ...found, label: String(found.label || '').replace(/\s*\u2014\s*/g, ', ') } : null;
  return {
    hasVariants: variants.length > 0,
    variant,
    buyUrl: variant?.url || '',
    // Never reuse a 32-count Regular box for a different selected pack.
    image: variant ? variant.image || '' : product.image || '',
    displayName: variant ? `${product.variantFamilyName || product.name}, ${variant.label}` : product.name,
  };
}
