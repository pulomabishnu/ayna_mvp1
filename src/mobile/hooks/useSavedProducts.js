import { useCallback, useEffect, useState } from 'react';

import {
  loadSavedProducts,
  clearSavedProducts,
  persistSavedProducts,
  loadSavedForUser,
  setSavedForUser,
} from '../../utils/savedProductsStore.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';

// Mirrors compactProduct() in savedProductsStore.js (not exported there)
// keeps local writes in the same compact shape used by the website.
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

export function useSavedProducts(user) {
  const [savedMap, setSavedMap] = useState(() => loadSavedProducts());

  // When a user signs in, merge their Supabase-synced saves into anything
  // already saved locally on this device, matching the website behavior.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;

    const supabase = getSupabaseClient();
    if (!supabase) return undefined;

    let cancelled = false;

    loadSavedForUser(supabase, userId)
      .then((remoteSaved) => {
        if (cancelled || !remoteSaved) return;
        setSavedMap((localSaved) => {
          const merged = { ...localSaved, ...remoteSaved };
          persistSavedProducts(merged);
          return merged;
        });
        // Saves made on this phone before she signed in go up to her account,
        // so they follow her to the website and other devices.
        const localOnly = Object.values(loadSavedProducts()).filter((p) => p?.id && !remoteSaved[p.id]);
        for (const product of localOnly) {
          setSavedForUser(supabase, userId, product, true).catch((error) => {
            console.warn('[Ayna] mobile saved-product upload unavailable:', error?.message || error);
          });
        }
      })
      .catch((error) => {
        console.warn('[Ayna] mobile saved-products sync unavailable:', error?.message || error);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isSaved = useCallback(
    (id) => Boolean(id && savedMap[id]),
    [savedMap],
  );

  const toggleSaved = useCallback((product) => {
    if (!product?.id) return;

    const wasSaved = Boolean(savedMap[product.id]);
    const next = { ...savedMap };

    if (wasSaved) {
      delete next[product.id];
    } else {
      const compact = compactProduct(product);
      if (compact) next[product.id] = compact;
    }

    setSavedMap(next);
    persistSavedProducts(next);

    if (user?.id) {
      const supabase = getSupabaseClient();
      if (supabase) {
        setSavedForUser(supabase, user.id, product, !wasSaved)
          .catch((error) => {
            console.warn('[Ayna] mobile saved-product write unavailable:', error?.message || error);
          });
      }
    }
  }, [savedMap, user]);

  // Sign-out: forget this account's saves on the device (they live in her
  // account), so the next person on this phone starts clean.
  const clearLocal = useCallback(() => { clearSavedProducts(); setSavedMap({}); }, []);

  return { savedMap, isSaved, toggleSaved, clearLocal };
}
