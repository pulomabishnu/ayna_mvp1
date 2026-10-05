import React, { useState } from 'react';
import { useCommunity, relativeTime, shareLink } from './CommunityContext';
import { UserAvatar, Stars, CommunityProductPreview, ClampedText, OverflowMenu } from './CommunityUI';
import { topicLabel } from '../../utils/community/topics';
import { postProductIds } from '../../utils/community/ranking';
import { communityHref } from '../../utils/community/route';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';

const KIND_LABEL = { question: 'Question', review: 'Review', post: 'Post' };

export function AuthorLine({ item, time }) {
  const { navigate } = useCommunity();
  const anonymous = item.is_anonymous || !item.author_id;
  const name = anonymous ? 'Anonymous' : item.author_display_name;
  const openProfile = (e) => {
    e.stopPropagation();
    if (!anonymous && item.author_username) navigate({ name: 'profile', username: item.author_username });
  };
  const badges = (
    <>
      {item.is_post_author && <span className="cm-badge">OP</span>}
      {item.is_mine && anonymous && <span className="cm-badge cm-badge--muted">you</span>}
    </>
  );
  return (
    <div className="cm-author">
      {anonymous ? (
        <span className="cm-author__avatar"><UserAvatar name={name} anonymous /></span>
      ) : (
        <button type="button" className="cm-author__avatar" onClick={openProfile} aria-label={`${name}'s profile`}>
          <UserAvatar name={name} url={item.author_avatar_url} />
        </button>
      )}
      <div className="cm-author__text">
        {anonymous ? (
          <span className="cm-author__name">{name}{badges}</span>
        ) : (
          <button type="button" className="cm-author__name" onClick={openProfile}>{name}{badges}</button>
        )}
        <span className="cm-author__meta">
          {!anonymous && item.author_username ? `@${item.author_username} · ` : ''}{relativeTime(time || item.created_at)}{item.edited_at ? ' · edited' : ''}
        </span>
      </div>
    </div>
  );
}

export default function CommunityPostCard({ post, onChange, onRemove, expanded = false, onOpenThread }) {
  const ctx = useCommunity();
  const { supabase, user, navigate, requireProfile, toast, openReport, confirmBlock } = ctx;
  const [busy, setBusy] = useState(false);
  const productIds = postProductIds(post);
  const taggedOnly = (post.tagged_product_ids || []).filter((id) => id !== post.product_id);
  const openThread = () => {
    if (expanded) return;
    if (onOpenThread) onOpenThread(post);
    else navigate({ name: 'post', id: post.id });
  };

  const toggle = async (field, fn) => {
    if (!requireProfile()) return;
    if (busy) return;
    const next = !post[field];
    const countField = field === 'viewer_found_helpful' ? 'helpful_count' : null;
    const optimistic = { ...post, [field]: next, ...(countField ? { [countField]: Math.max(0, (post[countField] || 0) + (next ? 1 : -1)) } : {}) };
    onChange?.(optimistic);
    setBusy(true);
    try {
      await fn(next);
    } catch (e) {
      onChange?.(post);
      toast(store.friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const menu = [
    post.is_mine && {
      label: 'Delete post',
      danger: true,
      onClick: async () => {
        if (!window.confirm('Delete this post? This can’t be undone.')) return;
        try { await store.deletePost(supabase, post.id); onRemove?.(post); toast('Post deleted'); } catch (e) { toast(store.friendlyError(e)); }
      },
    },
    !post.is_mine && { label: 'Report post', onClick: () => openReport({ targetType: 'post', postId: post.id }) },
    !post.is_mine && {
      label: 'Hide post',
      onClick: async () => {
        try { await store.hidePost(supabase, user.id, post.id); onRemove?.(post); toast('Hidden from your feed'); } catch (e) { toast(store.friendlyError(e)); }
      },
    },
    !post.is_mine && post.author_id && {
      label: `Block ${post.author_display_name || 'user'}`,
      danger: true,
      onClick: () => confirmBlock({ userId: post.author_id, name: post.author_display_name }),
    },
  ];

  return (
    <article
      className={`cm-post cm-post--${post.kind}${expanded ? ' cm-post--expanded' : ''}`}
      onClick={openThread}
      role={expanded ? undefined : 'link'}
      tabIndex={expanded ? undefined : 0}
      onKeyDown={(e) => { if (!expanded && (e.key === 'Enter') && e.target === e.currentTarget) openThread(); }}
      aria-label={expanded ? undefined : `${KIND_LABEL[post.kind]}: ${String(post.body).slice(0, 80)}`}
    >
      <div className="cm-post__head">
        <AuthorLine item={post} />
        <span className="cm-post__kind">{KIND_LABEL[post.kind]}</span>
        <OverflowMenu items={menu} />
      </div>

      {post.kind === 'review' && (
        <div className="cm-review">
          <div className="cm-review__rating">
            <Stars value={post.rating} />
            {post.would_recommend === true && <span className="cm-review__rec">Would recommend</span>}
            {post.would_recommend === false && <span className="cm-review__rec cm-review__rec--no">Wouldn’t recommend</span>}
          </div>
        </div>
      )}

      {expanded
        ? <p className={`cm-text${post.kind === 'question' ? ' cm-text--question' : ''}`}>{post.body}</p>
        : <ClampedText text={post.body} className={post.kind === 'question' ? 'cm-text--question-wrap' : ''} />}

      {post.photo_url && (
        <img className="cm-post__photo" src={post.photo_url} alt="" loading="lazy" decoding="async" />
      )}

      {productIds.length > 0 && (
        <div className="cm-post__products" onClick={(e) => e.stopPropagation()}>
          {post.kind === 'review' && post.product_id && (
            <CommunityProductPreview productId={post.product_id} onOpened={() => trackCommunity('community_product_opened', { source: 'review' })} />
          )}
          {(expanded ? taggedOnly : taggedOnly.slice(0, 2)).map((id) => (
            <CommunityProductPreview key={id} productId={id} onOpened={() => trackCommunity('community_product_opened', { source: post.kind })} />
          ))}
          {!expanded && taggedOnly.length > 2 && (
            <button type="button" className="cm-link" onClick={openThread}>+{taggedOnly.length - 2} more</button>
          )}
        </div>
      )}

      {post.topics?.length > 0 && (
        <div className="cm-topics">
          {post.topics.map((t) => <span key={t} className="cm-topic">{topicLabel(t)}</span>)}
        </div>
      )}

      <div className="cm-actions" onClick={(e) => e.stopPropagation()}>
        {post.is_mine ? (
          <span className="cm-action cm-action--static">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21V10l4.5-7c1.4 0 2.3 1.2 2 2.6L12.8 10H19a2 2 0 0 1 2 2.3l-1.2 6.8a2 2 0 0 1-2 1.7H7Zm0 0H4V10h3" /></svg>
            <span>{post.helpful_count ? `${post.helpful_count} found this helpful` : 'Helpful'}</span>
          </span>
        ) : (
          <button
            type="button"
            className={`cm-action${post.viewer_found_helpful ? ' is-on' : ''}`}
            aria-pressed={!!post.viewer_found_helpful}
            onClick={() => toggle('viewer_found_helpful', (on) => store.setHelpful(supabase, user.id, { postId: post.id }, on))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21V10l4.5-7c1.4 0 2.3 1.2 2 2.6L12.8 10H19a2 2 0 0 1 2 2.3l-1.2 6.8a2 2 0 0 1-2 1.7H7Zm0 0H4V10h3" /></svg>
            <span>Helpful{post.helpful_count ? ` · ${post.helpful_count}` : ''}</span>
          </button>
        )}
        <button type="button" className="cm-action" onClick={openThread}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" /></svg>
          <span>{post.kind === 'question' ? 'Answer' : 'Comment'}{post.comment_count ? ` · ${post.comment_count}` : ''}</span>
        </button>
        <button
          type="button"
          className={`cm-action${post.viewer_saved ? ' is-on' : ''}`}
          aria-pressed={!!post.viewer_saved}
          aria-label={post.viewer_saved ? 'Saved' : 'Save'}
          onClick={() => toggle('viewer_saved', (on) => store.setSaved(supabase, user.id, post.id, on))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
        </button>
        <button
          type="button"
          className="cm-action"
          aria-label="Share"
          onClick={async () => {
            const r = await shareLink(communityHref({ name: 'post', id: post.id }), 'ayna community');
            if (r === 'copied') toast('Link copied');
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
        </button>
      </div>
    </article>
  );
}
