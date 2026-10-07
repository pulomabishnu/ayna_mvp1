import React, { useEffect, useState } from 'react';
import './profileProgress.css';
import { getSupabaseClient } from '../utils/supabaseClient';

const KIND = { question: 'question', review: 'review', post: 'discussion' };

function ago(iso) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

/**
 * Home-page peek at real Community posts (read through the masking view, so
 * anonymous authors stay anonymous). Shows nothing invented: with no posts it
 * invites the first question instead.
 */
export default function CommunityPeek({ onOpenCommunity }) {
  const [posts, setPosts] = useState(null);
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    let alive = true;
    supabase.from('community_feed_posts')
      .select('id, kind, body, is_anonymous, author_display_name, comment_count, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => { if (alive) setPosts(error ? [] : data || []); });
    return () => { alive = false; };
  }, []);

  if (posts === null) return null;

  return (
    <section className="cp-peek" aria-label="From the community">
      <div className="cp-peek__head">
        <div>
          <span className="pp-eyebrow">from the community</span>
          <h2>real people, <em>real answers.</em></h2>
        </div>
        <button type="button" className="cp-peek__all" onClick={() => onOpenCommunity?.('/community')}>see all →</button>
      </div>
      {posts.length === 0 ? (
        <button type="button" className="cp-peek__empty" onClick={() => onOpenCommunity?.('/community')}>
          <strong>be the first to ask something.</strong>
          <span>post anonymously — no account needed.</span>
        </button>
      ) : (
        <ul className="cp-peek__list">
          {posts.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onOpenCommunity?.(`/community/post/${p.id}`)}>
                <span className="cp-peek__meta">
                  <b>{p.is_anonymous || !p.author_display_name ? 'Anonymous' : p.author_display_name}</b>
                  <i>{KIND[p.kind] || 'post'} · {ago(p.created_at)}</i>
                </span>
                <span className="cp-peek__body">{p.body}</span>
                {p.comment_count > 0 && <small>{p.comment_count} {p.kind === 'question' ? 'answer' : 'comment'}{p.comment_count === 1 ? '' : 's'}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
