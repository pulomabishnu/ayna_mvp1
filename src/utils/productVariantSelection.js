export function getVariantSelection(product, selectedId) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variants.find(option => option.id === selectedId) || null;
  return {
    hasVariants: variants.length > 0,
    variant,
    buyUrl: variant?.url || '',
    // Never reuse a 32-count Regular box for a different selected pack.
    image: variant ? variant.image || '' : product.image || '',
    displayName: variant ? `${product.variantFamilyName || product.name} — ${variant.label}` : product.name,
  };
}
