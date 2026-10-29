import { useEffect, useState } from 'react';
import { listReceivedRecommendations, markRecommendationSeen, getProfilesByIds } from '../../utils/community/communityStoreCore.js';
import './friend-recs.css';

/**
 * "Recommended to you" (founder, Oct 29: when someone recommends a product to
 * a friend it has to actually reach them). The rows in
 * community_product_recommendations addressed to her: who sent it, the
 * product, their note. Opening one marks it seen. Shown in Community's
 * Updates on the website and the app.
 */
export default function FriendRecs({ supabase, userId, productsById, onOpenProduct, onCount }) {
  const [rows, setRows] = useState(null);
  const [people, setPeople] = useState(new Map());
  useEffect(() => {
    let live = true;
    if (!supabase || !userId) { setRows([]); return undefined; }
    listReceivedRecommendations(supabase, userId, 20)
      .then(async (list) => {
        if (!live) return;
        const r = (list || []).filter((x) => productsById?.get(String(x.product_id)));
        setRows(r);
        onCount?.(r.filter((x) => !x.seen_at).length);
        try { const m = await getProfilesByIds(supabase, r.map((x) => x.sender_id)); if (live) setPeople(m); } catch { /* names optional */ }
      })
      .catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [supabase, userId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows || !rows.length) return null;
  const open = (r, product) => {
    if (!r.seen_at) { markRecommendationSeen(supabase, r.id).catch(() => {}); setRows((list) => list.map((x) => (x.id === r.id ? { ...x, seen_at: new Date().toISOString() } : x))); }
    onOpenProduct?.(product);
  };
  return (
    <section className="ay-frecs" aria-labelledby="ay-frecs-h">
      <h3 id="ay-frecs-h" className="ay-frecs__h">Recommended to you</h3>
      <ul className="ay-frecs__list">
        {rows.map((r) => {
          const product = productsById.get(String(r.product_id));
          const p = people.get(r.sender_id);
          const who = p?.display_name || (p?.username ? `@${p.username}` : 'A friend');
          return (
            <li key={r.id} className={r.seen_at ? '' : 'is-new'}>
              <button type="button" className="ay-frecs__item" onClick={() => open(r, product)}>
                <span className="ay-frecs__who"><b>{who}</b> recommended <b>{product.name}</b></span>
                {r.note && <span className="ay-frecs__note">“{r.note}”</span>}
                <span className="ay-frecs__go">See the product →</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
