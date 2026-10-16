import { useEffect, useMemo, useState } from 'react';
import { withResearch } from './products';

/* The gap-filling research (productResearch.js, about 700KB) is only needed on
   a product page, so it loads there on demand instead of with the site. It is
   page reading only: matching and scores never see it. */
let pending = null;
let loaded = null;
export function loadResearch() {
  if (loaded) return Promise.resolve(loaded);
  if (!pending) {
    pending = import('./productResearch.js')
      .then((m) => { loaded = m.PRODUCT_RESEARCH || {}; return loaded; })
      .catch(() => { pending = null; return {}; });
  }
  return pending;
}

/** The product with research filled in once it has loaded (the team's text always wins). */
export function useResearch(product) {
  const [research, setResearch] = useState(loaded);
  useEffect(() => {
    if (research) return undefined;
    let live = true;
    loadResearch().then((r) => { if (live) setResearch(r); });
    return () => { live = false; };
  }, [research]);
  return useMemo(() => (research && product ? withResearch(product, research) : product), [product, research]);
}
