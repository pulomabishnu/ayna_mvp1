import { useCallback, useState } from 'react';
import { loadSavedProducts, persistSavedProducts } from '../../utils/savedProductsStore.js';

// Mirrors compactProduct() in savedProductsStore.js (not exported there) —
// keeps our writes in the exact same shape the real store already persists
// under the same localStorage key (ayna_saved_for_later_v1), so this stays
// consistent with the real website if the same browser/webview opens both.
// Uses only the local-storage half of the real store — Supabase sync
// requires a signed-in user, which is deferred to the auth step.
const COMPACT_KEYS = [
  'id', 'name', 'brand', 'category', 'type', 'price', 'priceDisplay', 'stage',
  'image', 'imageUrl', 'images', 'summary', 'description', 'url', 'website',
  'buyUrl', 'purchaseUrl', 'affiliateUrl', 'aynaMatch', 'aynaMatchPercent',
  'matchPercent', 'matchPercentage',
];

function compactProduct(product) {
  if (!product?.id) return null;
  const out = {};
  for (const key of COMPACT_KEYS) {
    const value = product[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out;
}

export function useSavedProducts() {
  const [savedMap, setSavedMap] = useState(() => loadSavedProducts());

  const isSaved = useCallback((id) => Boolean(id && savedMap[id]), [savedMap]);

  const toggleSaved = useCallback((product) => {
    if (!product?.id) return;
    setSavedMap((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        const compact = compactProduct(product);
        if (compact) next[product.id] = compact;
      }
      persistSavedProducts(next);
      return next;
    });
  }, []);

  return { savedMap, isSaved, toggleSaved };
}
