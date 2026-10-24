import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { listFeedPosts } from '../utils/community/communityStore.js';

/**
 * Community posts she saved (the Save button on a post), for You > Saved on
 * the website and the app. Signed in only: saved posts live on her account.
 * Quiet on failure (an empty list, never an error banner in You).
 */
export function useSavedPosts(userId, limit = 6) {
  const [state, setState] = useState({ userId: null, posts: [], loaded: false });
  useEffect(() => {
    if (!userId) return undefined;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    let live = true;
    listFeedPosts(supabase, { savedOnly: true, limit })
      .then((rows) => { if (live) setState({ userId, posts: rows || [], loaded: true }); })
      .catch(() => { if (live) setState({ userId, posts: [], loaded: true }); });
    return () => { live = false; };
  }, [userId, limit]);
  return state.userId === userId ? state : { userId, posts: [], loaded: !userId };
}

/** One line for a post in a list: its kind and the start of what it says. */
export function postLine(post, max = 120) {
  const body = String(post?.body || '').replace(/\s+/g, ' ').trim();
  return { kind: post?.kind === 'question' ? 'Question' : post?.kind === 'review' ? 'Review' : 'Post', text: body.length > max ? `${body.slice(0, max)}…` : body };
}
