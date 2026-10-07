import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getProfileMatchPercentForProduct } from '../../data/products';
import { loadProductCatalog, getLoadedCatalog } from '../../utils/productCatalog';

export const CommunityContext = createContext(null);

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used inside <CommunityContext.Provider>');
  return ctx;
}

/** The live ayna catalog keyed by id — the only products the community can reference. */
export function useCatalogById() {
  const [products, setProducts] = useState(() => getLoadedCatalog());
  useEffect(() => {
    let active = true;
    loadProductCatalog().then(({ products: list }) => { if (active && list?.length) setProducts(list); });
    return () => { active = false; };
  }, []);
  return useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => { if (p?.id && !p.internal) map.set(p.id, p); });
    return map;
  }, [products]);
}

/**
 * The viewer's own % match for any product, from the SAME engine Browse and
 * the product page use (getProfileMatchPercentForProduct). Computed locally
 * from the viewer's own profile; never stored or sent anywhere. Returns null
 * when the viewer has no profile yet.
 */
export function useViewerMatch(quizResults, healthProfile, productsById) {
  const cache = useRef(new Map());
  useEffect(() => { cache.current = new Map(); }, [quizResults, healthProfile, productsById]);
  return useCallback((productOrId) => {
    if (!quizResults) return null;
    const product = typeof productOrId === 'string' ? productsById.get(productOrId) : productOrId;
    if (!product?.id) return null;
    if (cache.current.has(product.id)) return cache.current.get(product.id);
    let pct = null;
    try {
      const raw = getProfileMatchPercentForProduct(product, quizResults, healthProfile);
      pct = Number.isFinite(raw) ? Math.round(raw) : null;
    } catch {
      pct = null;
    }
    cache.current.set(product.id, pct);
    return pct;
  }, [quizResults, healthProfile, productsById]);
}

export function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(d > 300 ? { year: 'numeric' } : {}) });
}

export async function shareLink(path, title) {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
