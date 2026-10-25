/**
 * The few widgets that read the server, fetched only while one of them is
 * on Home or the Customize sheet is open: Community posts (trending, or the
 * landing page's most helpful as "Popular"), her playlists, new posts in
 * her topics, and the trending products count (an aggregate that exists
 * only once supabase/product_popularity_2026-10-25.sql has run; until then
 * the widget is not offered). Everything fails quietly to an empty state.
 */
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { listFeedPosts, listPlaylists } from '../utils/community/communityStore.js';
import { pickRundownPosts } from '../mobile/hooks/useRundownCommunity.js';
import { rankCommunityPosts } from './widgets/widgetData.js';

/** Counts per product, at least 5 people each (the SQL enforces it too). */
export async function loadTrendingProducts(supabase) {
  try {
    const { data, error } = await supabase.rpc('product_popularity_30d', { p_limit: 6 });
    if (error || !Array.isArray(data)) return null;
    return data.filter((r) => r?.product_id && Number(r.saves) >= 5);
  } catch { return null; }
}

/** View counts, when the views migration ran; posts unchanged otherwise. */
async function withViews(supabase, posts) {
  if (!posts.length) return posts;
  try {
    const { data, error } = await supabase.rpc('community_post_view_counts', { p_post_ids: posts.map((p) => p.id) });
    if (error || !Array.isArray(data)) return posts;
    const by = new Map(data.map((r) => [r.post_id, r.view_count]));
    return posts.map((p) => ({ ...p, view_count: by.get(p.id) ?? null }));
  } catch { return posts; }
}

export function useHomeRemote({ ids = [], open = false, userId = null, topics = [], hasNewPosts = false }) {
  const want = (id) => open || ids.includes(id);
  const needPosts = want('community_posts');
  const needPlaylists = Boolean(userId) && want('my_playlists');
  const needNew = !hasNewPosts && want('new_in_community') && topics.length > 0;
  const needProducts = want('trending_products');
  const topicsKey = topics.join(',');
  const [state, setState] = useState({ posts: null, playlists: null, newPosts: null, trendingProducts: null, loading: false });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !(needPosts || needPlaylists || needNew || needProducts)) return undefined;
    let live = true;
    const set = (patch) => { if (live) setState((s) => ({ ...s, ...patch })); };
    set({ loading: true });
    const jobs = [];
    if (needPosts) {
      jobs.push((async () => {
        const [recent, popular] = await Promise.all([
          listFeedPosts(supabase, { limit: 40 }).catch(() => []),
          listFeedPosts(supabase, { limit: 12, sort: 'helpful' }).catch(() => []),
        ]);
        set({ posts: rankCommunityPosts(await withViews(supabase, recent || []), popular || []) });
      })());
    }
    if (needPlaylists) jobs.push(listPlaylists(supabase, { section: 'mine', limit: 6 }).then((rows) => set({ playlists: rows || [] })).catch(() => set({ playlists: [] })));
    if (needNew) jobs.push(listFeedPosts(supabase, { topics: topicsKey.split(','), limit: 12 }).then((rows) => set({ newPosts: pickRundownPosts(rows || []) })).catch(() => set({ newPosts: [] })));
    if (needProducts) jobs.push(loadTrendingProducts(supabase).then((rows) => set({ trendingProducts: rows })));
    Promise.allSettled(jobs).then(() => set({ loading: false }));
    return () => { live = false; };
  }, [needPosts, needPlaylists, needNew, needProducts, userId, topicsKey]);

  return state;
}
