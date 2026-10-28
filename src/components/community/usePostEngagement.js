import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPostViewCounts, getLikerPreviews, listPostLikers, recordPostView } from '../../utils/community/postEngagement.js';

// Live data for PostEngagement.jsx: polls while the tab is visible and on
// focus (the project doesn't use Supabase realtime). Everything switches
// itself off when the views/likers functions aren't in the database yet.

const POLL_MS = 30000;
const SHEET_POLL_MS = 15000;
const STACK_MAX = 5;
const VIEW_DWELL_MS = 800;

const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';

/** Re-run `fn` on an interval while the tab is visible, and when she comes back to it. */
function useLiveRefresh(fn, ms, enabled) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; }, [fn]);
  useEffect(() => {
    if (!enabled) return undefined;
    const run = () => { if (visible()) fnRef.current(); };
    const timer = window.setInterval(run, ms);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [ms, enabled]);
}

/**
 * Views and liker previews for the posts on screen.
 *   posts: the post rows being shown (feed, profile, search, the open post)
 *   refreshKey: bump to reload now (after a Helpful tap)
 * Returns { views, likers, viewsOn, likersOn, trackView(postId) -> ref callback }.
 */
export function usePostEngagement({ supabase, posts, userId = null, refreshKey = 0 }) {
  const ids = useMemo(() => [...new Set((posts || []).map((p) => p?.id).filter(Boolean))], [posts]);
  const idsKey = ids.join(',');
  const [views, setViews] = useState(() => new Map());
  const [likers, setLikers] = useState(() => new Map());
  const [viewsOn, setViewsOn] = useState(true);
  const [likersOn, setLikersOn] = useState(true);
  const offRef = useRef({ views: false, likers: false });

  const load = useCallback(async () => {
    if (!supabase || !idsKey) return;
    const list = idsKey.split(',');
    const [v, l] = await Promise.allSettled([
      offRef.current.views ? null : getPostViewCounts(supabase, list),
      offRef.current.likers ? null : getLikerPreviews(supabase, list, STACK_MAX),
    ]);
    if (v.status === 'fulfilled' && v.value) {
      if (!v.value.available) { offRef.current.views = true; setViewsOn(false); }
      else setViews((prev) => { const next = new Map(prev); for (const id of list) { const c = v.value.counts.get(id); if (c) next.set(id, c); } return next; });
    }
    if (l.status === 'fulfilled' && l.value) {
      if (!l.value.available) { offRef.current.likers = true; setLikersOn(false); }
      else setLikers((prev) => { const next = new Map(prev); for (const id of list) next.set(id, l.value.likers.get(id) || { total: 0, rows: [] }); return next; });
    }
  }, [supabase, idsKey]);

  useEffect(() => { const t = window.setTimeout(load, 0); return () => window.clearTimeout(t); }, [load, refreshKey, userId]);
  useLiveRefresh(load, POLL_MS, Boolean(supabase && idsKey) && (viewsOn || likersOn));

  // A view counts when at least half the post stays on screen for a moment.
  const observerRef = useRef(null);
  const timers = useRef(new Map());
  const nodes = useRef(new Map());
  const callbacks = useRef(new Map());
  const send = useCallback(async (postId) => {
    if (offRef.current.views || !supabase) return;
    try {
      const res = await recordPostView(supabase, postId, { userId });
      if (!res.available) { offRef.current.views = true; setViewsOn(false); return; }
      if (res.count !== null) setViews((prev) => { const next = new Map(prev); next.set(postId, { ...(prev.get(postId) || { today: null }), views: Math.max(res.count, prev.get(postId)?.views || 0) }); return next; });
    } catch { /* a view that didn't send is fine */ }
  }, [supabase, userId]);
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; }, [send]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const pending = timers.current;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const postId = entry.target.getAttribute('data-view-id');
        if (!postId) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!pending.has(postId)) pending.set(postId, window.setTimeout(() => { pending.delete(postId); if (visible()) sendRef.current(postId); }, VIEW_DWELL_MS));
        } else if (pending.has(postId)) { window.clearTimeout(pending.get(postId)); pending.delete(postId); }
      }
    }, { threshold: [0, 0.5, 1] });
    observerRef.current = io;
    for (const node of nodes.current.values()) io.observe(node);
    return () => { io.disconnect(); observerRef.current = null; for (const t of pending.values()) window.clearTimeout(t); pending.clear(); };
  }, []);
  const trackView = useCallback((postId) => {
    if (!postId) return undefined;
    if (!callbacks.current.has(postId)) {
      callbacks.current.set(postId, (node) => {
        const prev = nodes.current.get(postId);
        if (prev && prev !== node) observerRef.current?.unobserve(prev);
        if (node) {
          node.setAttribute('data-view-id', postId);
          nodes.current.set(postId, node);
          if (observerRef.current) observerRef.current.observe(node);
          else if (typeof IntersectionObserver === 'undefined') sendRef.current(postId);
        } else nodes.current.delete(postId);
      });
    }
    return callbacks.current.get(postId);
  }, []);

  return { views, likers, viewsOn, likersOn, trackView, reload: load };
}

/** Live list of everyone who found the post helpful: { loading, available, total, rows }. */
export function usePostLikers(supabase, postId, refreshKey = 0) {
  const [state, setState] = useState({ postId: null, loading: true, available: true, total: 0, rows: [] });
  const load = useCallback(async () => {
    if (!supabase || !postId) return;
    try {
      const res = await listPostLikers(supabase, postId, { limit: 200 });
      setState({ postId, loading: false, ...res });
    } catch { setState((s) => ({ ...s, postId, loading: false })); }
  }, [supabase, postId]);
  useEffect(() => { const t = window.setTimeout(load, 0); return () => window.clearTimeout(t); }, [load, refreshKey]);
  useLiveRefresh(load, SHEET_POLL_MS, Boolean(supabase && postId));
  // A different post shows "Loading" until its own list arrives.
  return state.postId === postId ? state : { postId, loading: true, available: true, total: 0, rows: [] };
}

