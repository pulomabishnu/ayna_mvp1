import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { listProductMentions } from '../../utils/community/communityStore.js';
import { REVIEWS_CHANGED_EVENT } from '../../utils/community/reviewRatings.js';

/** Community posts (not reviews) that tag one product, for "From the community". */
export function useProductMentions(productId, client = getSupabaseClient()) {
  const [state, setState] = useState({ productId: null, rows: [] });
  useEffect(() => {
    if (!productId || !client) return undefined;
    let active = true;
    const load = () => {
      listProductMentions(client, productId)
        .then((rows) => { if (active) setState({ productId, rows }); })
        .catch(() => { if (active) setState({ productId, rows: [] }); });
    };
    load();
    // A post edited or deleted in Community announces it; re-read then too.
    window.addEventListener(REVIEWS_CHANGED_EVENT, load);
    return () => { active = false; window.removeEventListener(REVIEWS_CHANGED_EVENT, load); };
  }, [productId, client]);
  return state.productId === productId ? state.rows : [];
}
