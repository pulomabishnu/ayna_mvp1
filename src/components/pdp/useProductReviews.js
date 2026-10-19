import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { listProductReviews } from '../../utils/community/communityStore.js';
import { REVIEWS_CHANGED_EVENT } from '../../utils/community/reviewRatings.js';

/** Live community reviews of one product, re-read after a review is posted, edited or deleted. */
export function useProductReviews(productId, client = getSupabaseClient()) {
  const [state, setState] = useState({ productId: null, rows: [] });
  useEffect(() => {
    if (!productId || !client) return undefined;
    let active = true;
    const load = () => {
      listProductReviews(client, productId)
        .then((rows) => { if (active) setState({ productId, rows }); })
        .catch(() => { if (active) setState({ productId, rows: [] }); });
    };
    load();
    window.addEventListener(REVIEWS_CHANGED_EVENT, load);
    return () => { active = false; window.removeEventListener(REVIEWS_CHANGED_EVENT, load); };
  }, [productId, client]);
  return state.productId === productId ? state.rows : [];
}
