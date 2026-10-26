import { useState } from 'react';
import { publicMediaUrl } from '../../utils/community/imageUpload.js';
import { viewsLabel, moreLabel } from '../../utils/community/postEngagement.js';
import { usePostLikers } from './usePostEngagement.js';
import { friendshipState } from '../../utils/community/communityStore.js';
import './post-engagement.css';

// Post views ("128 views") and the latest people who found a post helpful,
// shared by the website (WebCommunity) and the app (CommunityScreen).
// Views are counts only: there is no list of who viewed, anywhere.
// Everything hides itself until supabase/community_views_likes_2026-10-21.sql runs.

const STACK_MAX = 5;

function EyeIcon({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>;
}

export function LikerAvatar({ liker, size = 22 }) {
  const [failed, setFailed] = useState(false);
  const initials = liker.isAnonymous ? 'A' : String(liker.isMe ? 'You' : liker.name || 'A').replace(/^@/, '').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, size < 30 ? 1 : 2).join('').toUpperCase();
  return <span className={`ay-liker-avatar${liker.isAnonymous ? ' is-anon' : ''}`} style={{ width: size, height: size, fontSize: Math.max(13, Math.round(size * 0.4)) }} aria-hidden="true">
    {liker.avatarPath && !failed ? <img src={publicMediaUrl(liker.avatarPath)} alt="" onError={() => setFailed(true)} /> : initials}
  </span>;
}

/**
 * The quiet line under a post: up to five liker avatars and "+N more" (opens
 * the full list), and the view count. Renders nothing when there's nothing to show.
 */
export function PostStats({ post, engagement, likeNoun = 'found this helpful', onOpenLikers, variant = 'web' }) {
  if (!post?.id || !engagement) return null;
  const helpful = Number(post.helpful_count) || 0;
  const preview = engagement.likersOn ? engagement.likers.get(post.id) : null;
  const total = Math.max(helpful, preview?.total || 0);
  const shown = (preview?.rows || []).slice(0, STACK_MAX);
  const v = engagement.viewsOn ? engagement.views.get(post.id) : null;
  const showLikers = Boolean(preview && total > 0 && shown.length);
  const showViews = Boolean(v && v.views > 0);
  if (!showLikers && !showViews) return null;
  const names = shown.map((l) => l.name);
  const summary = `${names.slice(0, 2).join(', ')}${total > 2 ? ` and ${total - Math.min(2, names.length)} more` : ''} ${likeNoun}`;
  return <div className={`ay-post-stats is-${variant}`}>
    {showLikers && <button type="button" className="ay-likers-stack" onClick={() => onOpenLikers?.(post)} aria-label={`${summary}. See everyone`}>
      <span className="ay-likers-faces">{shown.map((l) => <LikerAvatar key={l.key} liker={l} size={26} />)}</span>
      {moreLabel(total, shown.length) && <span className="ay-likers-more">{moreLabel(total, shown.length)}</span>}
    </button>}
    {showViews && <span className="ay-post-views" title="Views are counted once a day per person. Who viewed is never shown.">
      <EyeIcon />
      <span>{viewsLabel(v.views)}{v.today ? <span className="ay-post-views-today"> · {v.today} new today</span> : null}</span>
    </span>}
  </div>;
}

/**
 * The rows inside the likers sheet. Friend actions reuse the existing
 * friend-request flow (community_friend_requests), passed in by the screen.
 */
export function LikersList({ supabase, post, user, friendships = [], refreshKey = 0, onAddFriend, onAcceptFriend, onOpenProfile, onRequireAuth, variant = 'web' }) {
  const { loading, available, total, rows } = usePostLikers(supabase, post?.id, refreshKey);
  const [sent, setSent] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  if (!available) return <p className="ay-likers-empty">This list isn’t available yet.</p>;
  if (loading && !rows.length) return <p className="ay-likers-empty" role="status">Loading…</p>;
  if (!rows.length) return <p className="ay-likers-empty">No one yet.</p>;
  const act = async (liker, fn) => {
    if (!fn || busyId) return;
    setBusyId(liker.userId);
    try { await fn(liker); setSent((s) => new Set(s).add(liker.userId)); } catch { /* the screen shows the error */ } finally { setBusyId(null); }
  };
  return <div className={`ay-likers is-${variant}`}>
    <p className="ay-likers-count" aria-live="polite">{total === 1 ? '1 person' : `${total} people`}</p>
    <ul className="ay-likers-list">{rows.map((l) => {
      const canOpen = !l.isAnonymous && l.username && onOpenProfile;
      const who = <><LikerAvatar liker={l} size={40} /><span className="ay-likers-who"><strong>{l.name}</strong>{!l.isAnonymous && l.username && <small>@{l.username}</small>}</span></>;
      let action = null;
      if (!l.isAnonymous && !l.isMe && l.userId) {
        if (!user) action = <button type="button" className="ay-likers-btn" onClick={() => onRequireAuth?.('friends')}>Add friend</button>;
        else {
          const fs = friendshipState(friendships, user.id, l.userId).state;
          const state = sent.has(l.userId) && fs === 'none' ? 'requested' : fs;
          if (state === 'none') action = <button type="button" className="ay-likers-btn" disabled={busyId === l.userId} onClick={() => act(l, onAddFriend)}>Add friend</button>;
          else if (state === 'incoming') action = <button type="button" className="ay-likers-btn" disabled={busyId === l.userId} onClick={() => act(l, onAcceptFriend)}>Accept</button>;
          else action = <span className="ay-likers-state">{state === 'friends' ? 'Friends' : 'Requested'}</span>;
        }
      }
      return <li key={l.key}>
        {canOpen ? <button type="button" className="ay-likers-open" onClick={() => onOpenProfile(l.username)}>{who}</button> : <span className="ay-likers-open">{who}</span>}
        {action}
      </li>;
    })}</ul>
  </div>;
}
