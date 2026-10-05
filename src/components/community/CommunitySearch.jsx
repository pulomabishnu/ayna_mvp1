import React, { useEffect, useRef, useState } from 'react';
import { useCommunity } from './CommunityContext';
import CommunityPostCard from './CommunityPostCard';
import { PlaylistCard } from './Playlists';
import { FollowButton } from './Profile';
import { EmptyState, FeedSkeleton, UserAvatar } from './CommunityUI';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';

export default function CommunitySearch({ initialQuery = '', onQueryChange }) {
  const { supabase, navigate, user } = useCommunity();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) { setResults(null); return undefined; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await store.searchCommunity(supabase, q);
        setResults(r);
        onQueryChange?.(q);
        trackCommunity('community_search', { result_count: r.people.length + r.posts.length + r.playlists.length });
      } catch {
        setResults({ people: [], posts: [], playlists: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = results ? results.people.length + results.posts.length + results.playlists.length : 0;

  return (
    <div className="cm-search">
      <form className="cm-search-form" onSubmit={(e) => e.preventDefault()} role="search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="People, questions, reviews, playlists" aria-label="Search the community" autoFocus />
      </form>
      <p className="cm-hint">Looking for a product? <button type="button" className="cm-link" onClick={() => navigate({ name: 'browse', q: query.trim() })}>Search the ayna catalog</button></p>

      {loading && !results && <FeedSkeleton count={2} />}
      {results && total === 0 && !loading && <EmptyState title={`Nothing found for “${query.trim()}”`} />}
      {results && results.people.length > 0 && (
        <section className="cm-search__section">
          <h3 className="cm-section-title">People</h3>
          <ul className="cm-people">
            {results.people.map((p) => (
              <li key={p.user_id}>
                <button type="button" className="cm-person" onClick={() => navigate({ name: 'profile', username: p.username })}>
                  <UserAvatar name={p.display_name} url={p.avatar_url} size={40} />
                  <span>{p.display_name}<small>@{p.username}</small></span>
                </button>
                {p.user_id !== user.id && <FollowButton targetId={p.user_id} compact />}
              </li>
            ))}
          </ul>
        </section>
      )}
      {results && results.playlists.length > 0 && (
        <section className="cm-search__section">
          <h3 className="cm-section-title">Playlists</h3>
          <div className="cm-grid-playlists">{results.playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)}</div>
        </section>
      )}
      {results && results.posts.length > 0 && (
        <section className="cm-search__section">
          <h3 className="cm-section-title">Questions &amp; reviews</h3>
          {results.posts.map((p) => (
            <CommunityPostCard
              key={p.id}
              post={p}
              onChange={(next) => setResults((r) => ({ ...r, posts: r.posts.map((x) => (x.id === next.id ? next : x)) }))}
              onRemove={(gone) => setResults((r) => ({ ...r, posts: r.posts.filter((x) => x.id !== gone.id) }))}
            />
          ))}
        </section>
      )}
    </div>
  );
}
