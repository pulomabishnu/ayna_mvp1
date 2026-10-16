import { useEffect, useMemo, useState } from 'react';

/**
 * Research the team approved in /admin/research, shown on the product page.
 * Same rule as the built-in research (withResearch in data/products.js):
 * it only FILLS an empty section. Anything the team wrote always wins.
 */
export function mergeApprovedResearch(product, sections) {
  if (!product || !sections || typeof sections !== 'object') return product;
  const out = { ...product };
  const s = sections;
  if (!(out.whoItsFor || []).length && (s.who?.whoItsFor || []).length) out.whoItsFor = s.who.whoItsFor;
  if (!(out.howToUse?.steps || []).length && !String(out.howToUse?.intro || '').trim() && (s.how?.howToUse?.steps || []).length) out.howToUse = s.how.howToUse;
  const addNew = (have, more) => [...(have || []), ...more.filter((x) => x?.url && !(have || []).some((y) => y.url === x.url))];
  if ((s.clinical?.clinicalSources || []).length) out.researchClinicalSources = addNew(out.researchClinicalSources, s.clinical.clinicalSources);
  if ((s.science?.scienceSources || []).length) out.researchScienceSources = addNew(out.researchScienceSources, s.science.scienceSources);
  if (!out.communityReview && s.reviews?.communityReview) {
    out.communityReview = s.reviews.communityReview;
    const src = (s.reviews.sources || [])[0];
    if (src && !out.communityReviewSourceUrl) { out.communityReviewSourceUrl = src.url; out.communityReviewSourceLabel = src.label; }
  }
  return out;
}

const cache = new Map();

/** Fetches approved research for one product; returns the product with gaps filled. */
export function useApprovedResearch(product) {
  const id = product?.id || '';
  const [loaded, setLoaded] = useState({ id: '', sections: null });
  useEffect(() => {
    if (!id || cache.has(id)) return undefined;
    let live = true;
    fetch(`/api/research-product?product=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(8000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const v = j?.sections || {}; cache.set(id, v); if (live) setLoaded({ id, sections: v }); })
      .catch(() => {});
    return () => { live = false; };
  }, [id]);
  const sections = cache.get(id) || (loaded.id === id ? loaded.sections : null);
  return useMemo(() => (sections && Object.keys(sections).length ? mergeApprovedResearch(product, sections) : product), [product, sections]);
}
