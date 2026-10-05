import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCommunity } from './CommunityContext';
import CommunityPostCard from './CommunityPostCard';
import { EmptyState, FeedSkeleton, CommunityProductPreview, UserAvatar } from './CommunityUI';
import { PlaylistDiscovery } from './Playlists';
import * as store from '../../utils/community/communityStore';
import { rankForYou } from '../../utils/community/ranking';
import { trackCommunity } from '../../utils/community/analytics';

const REVIEW_SORTS = [
  { key: 'for-you', label: 'for you' },
  { key: 'friends', label: 'friends' },
  { key: 'recent', label: 'newest' },
  { key: 'helpful', label: 'most helpful' },
];

const FEED_FILTERS = [
  { key: 'for-you', label: 'for you' },
  { key: 'following', label: 'following' },
  { key: 'questions', label: 'q&a' },
  { key: 'reviews', label: 'reviews' },
  { key: 'playlists', label: 'playlists' },
];

/** Same chip row styling Browse uses for its categories. */
export function CommunityFilters({ value, onChange, options = FEED_FILTERS, label = 'Community filters', small = false }) {
  return (
    <div className={small ? 'cm-subfilters' : 'cm-tabs'} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.key} type="button" role="tab" aria-selected={value === o.key} className={value === o.key ? 'is-active' : ''} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function usePostFeed(queryKey, fetchPage, transform) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | more | done | error
  const genRef = useRef(0);

  const loadPage = useCallback(async (reset) => {
    const gen = reset ? ++genRef.current : genRef.current;
    setStatus(reset ? 'loading' : 'more');
    try {
      const { rows, next } = await fetchPage(reset ? null : cursor);
      if (gen !== genRef.current) return;
      const page = transform ? transform(rows) : rows;
      setPosts((prev) => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map((p) => p.id));
        return [...base, ...page.filter((p) => !seen.has(p.id))];
      });
      setCursor(next);
      setStatus(rows.length < store.PAGE_SIZE ? 'done' : 'ready');
    } catch {
      if (gen === genRef.current) setStatus('error');
    }
  }, [fetchPage, transform, cursor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPosts([]); setCursor(null); loadPage(true); }, [queryKey]);

  return { posts, setPosts, status, loadMore: () => loadPage(false), reload: () => loadPage(true) };
}

function InfiniteSentinel({ onVisible, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (disabled || !ref.current || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) onVisible(); }, { rootMargin: '600px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [onVisible, disabled]);
  return <div ref={ref} aria-hidden="true" style={{ height: 1 }} />;
}

export default function CommunityFeed({ tab, productFilter, onTabChange, onCompose, refreshKey }) {
  const ctx = useCommunity();
  const { supabase, social, matchFor, interest, ownedProductIds, user, productsById } = ctx;
  const [reviewSort, setReviewSort] = useState('for-you');
  const friendIds = useMemo(() => store.friendIdsFrom(social.friendships, user.id), [social.friendships, user.id]);
  const followingList = useMemo(() => [...new Set([...social.followingIds, ...friendIds])], [social.followingIds, friendIds]);

  const signals = useMemo(() => ({
    interest: interest?.tags,
    lifeStage: interest?.lifeStage,
    matchFor: interest?.hasProfile ? matchFor : null,
    followingIds: social.followingIds,
    friendIds: new Set(friendIds),
    ownedProductIds,
  }), [interest, matchFor, social.followingIds, friendIds, ownedProductIds]);

  const signalsRef = useRef(signals);
  useEffect(() => { signalsRef.current = signals; }, [signals]);

  const spec = useMemo(() => {
    if (tab === 'playlists') return null;
    if (tab === 'following') return { authorIds: followingList, rank: false };
    if (tab === 'questions') return { kind: 'question', rank: true };
    if (tab === 'reviews') {
      if (reviewSort === 'friends') return { kind: 'review', authorIds: friendIds, rank: false };
      if (reviewSort === 'helpful') return { kind: 'review', sort: 'helpful', rank: false };
      if (reviewSort === 'recent') return { kind: 'review', rank: false };
      return { kind: 'review', rank: true };
    }
    return { rank: true };
  }, [tab, reviewSort, followingList, friendIds]);

  // Re-rank when the viewer's profile finishes loading (it arrives after the
  // first paint on a cold load).
  const interestKey = interest?.hasProfile ? interest.tags.length : 0;
  const queryKey = JSON.stringify([tab, reviewSort, productFilter || null, spec?.authorIds?.length ?? null, refreshKey, interestKey]);

  const fetchPage = useCallback(async (cursor) => {
    if (!spec) return { rows: [], next: null };
    const opts = { kind: spec.kind || null, authorIds: spec.authorIds || null, sort: spec.sort || 'recent', productId: productFilter || null, cursor };
    const rows = await store.listFeedPosts(supabase, opts);
    return { rows, next: store.nextCursor(rows, opts.sort, cursor) };
  }, [supabase, spec, productFilter]);

  // For You ranks each server page locally, so posts already on screen never
  // jump around when the next page arrives.
  const transform = useCallback((rows) => (spec?.rank ? rankForYou(rows, signalsRef.current) : rows), [spec]);

  const { posts, setPosts, status, loadMore, reload } = usePostFeed(queryKey, fetchPage, transform);

  useEffect(() => { trackCommunity('community_filter_selected', { filter: tab }); }, [tab]);

  const productForFilter = productFilter ? productsById.get(productFilter) : null;

  return (
    <div className="cm-feed">
      <CommunityFilters value={tab} onChange={onTabChange} />

      {tab !== 'playlists' && !productFilter && (
        <button type="button" className="cm-prompt" onClick={() => onCompose(tab === 'reviews' ? 'review' : 'question')}>
          <UserAvatar name={ctx.me?.display_name || ''} url={ctx.me?.avatar_url} size={34} />
          <span>{tab === 'reviews' ? 'tried something? rate it' : 'what’s on your mind?'}</span>
          <span className="cm-prompt__cta">{tab === 'reviews' ? 'review' : 'ask'}</span>
        </button>
      )}

      {productForFilter && (
        <div className="cm-feed__product-filter">
          <p className="cm-hint">Posts mentioning</p>
          <CommunityProductPreview product={productForFilter} />
          <button type="button" className="cm-link" onClick={() => onTabChange(tab, { clearProduct: true })}>Show all posts</button>
        </div>
      )}

      {tab === 'reviews' && (
        <CommunityFilters value={reviewSort} onChange={setReviewSort} options={REVIEW_SORTS} label="Sort reviews" small />
      )}

      {tab === 'playlists' ? (
        <PlaylistDiscovery friendIds={friendIds} onCreate={() => onCompose('playlist')} />
      ) : status === 'loading' ? (
        <FeedSkeleton />
      ) : status === 'error' && posts.length === 0 ? (
        <EmptyState title="Couldn’t load the feed" action={<button type="button" className="btn btn-navy" onClick={reload}>Try again</button>}>
          Check your connection.
        </EmptyState>
      ) : posts.length === 0 ? (
        tab === 'following' && followingList.length === 0 ? (
          <EmptyState title="Follow people to see their reviews, questions, and playlists here." />
        ) : tab === 'reviews' && reviewSort === 'friends' && friendIds.length === 0 ? (
          <EmptyState title="Add friends to see what they’re using." />
        ) : (
          <EmptyState
            title={tab === 'questions' ? 'No questions yet.' : tab === 'reviews' ? 'No reviews yet.' : 'Nothing here yet. Try another topic.'}
            action={<button type="button" className="btn btn-navy" onClick={() => onCompose(tab === 'reviews' ? 'review' : 'question')}>{tab === 'reviews' ? 'Write a review' : 'Ask a question'}</button>}
          />
        )
      ) : (
        <>
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onChange={(next) => setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
              onRemove={(gone) => setPosts((prev) => prev.filter((p) => p.id !== gone.id))}
            />
          ))}
          {status === 'ready' && <InfiniteSentinel onVisible={loadMore} disabled={status !== 'ready'} />}
          {status === 'ready' && <button type="button" className="cm-load-more" onClick={loadMore}>Load more</button>}
          {status === 'more' && <FeedSkeleton count={1} />}
          {status === 'done' && posts.length > 4 && <p className="cm-hint cm-feed__end">You’re all caught up.</p>}
        </>
      )}
    </div>
  );
}
