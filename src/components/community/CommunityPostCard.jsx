import React, { useState } from 'react';
import { useCommunity, relativeTime, shareLink } from './CommunityContext';
import { UserAvatar, Stars, CommunityProductPreview, ClampedText, OverflowMenu } from './CommunityUI';
import { topicLabel } from '../../utils/community/topics';
import { postProductIds } from '../../utils/community/ranking';
import { communityHref } from '../../utils/community/route';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';
import { publicMediaUrl } from '../../utils/community/imageUpload';

const KIND_LABEL = { question: 'question', review: 'review', post: 'discussion' };

/** Photos: one full-width, or a tidy grid of 2–4. Paths only — no author info. */
export function PostMedia({ media, legacyUrl }) {
  const items = (Array.isArray(media) ? media : []).map((m) => ({ ...m, src: publicMediaUrl(m.path) })).filter((m) => m.src);
  if (!items.length && legacyUrl) items.push({ src: legacyUrl });
  if (!items.length) return null;
  return (
    <div className={`cm-media cm-media--${Math.min(items.length, 4)}`}>
      {items.slice(0, 4).map((m) => (
        <img key={m.src} src={m.src} alt="" loading="lazy" decoding="async" width={m.width || undefined} height={m.height || undefined} />
      ))}
    </div>
  );
}

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
        <span className="cm-author__avatar"><UserAvatar name={name} anonymous size={34} /></span>
      ) : (
        <button type="button" className="cm-author__avatar" onClick={openProfile} aria-label={`${name}'s profile`}>
          <UserAvatar name={name} url={item.author_avatar_url} size={34} />
        </button>
      )}
      <div className="cm-author__text">
        {anonymous ? (
          <span className="cm-author__name">{name}{badges}</span>
        ) : (
          <button type="button" className="cm-author__name" onClick={openProfile}>{name}{badges}</button>
        )}
        <span className="cm-author__meta">{relativeTime(time || item.created_at)}{item.edited_at ? ' · edited' : ''}</span>
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

  const isLike = post.kind === 'post'; // discussions get "like"; questions/reviews get "helpful"
  const toggle = async (field, fn) => {
    const reason = field === 'viewer_saved' ? 'save posts' : isLike ? 'like posts' : 'mark posts helpful';
    if (!requireProfile(null, reason)) return;
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
        // supabase is the client that owns it: the account client, or this device's guest session.
        try { await store.deletePost(supabase, post.id); onRemove?.(post); toast('Post deleted'); } catch (e) { toast(store.friendlyError(e)); }
      },
    },
    {
      label: 'Share',
      onClick: async () => {
        const r = await shareLink(communityHref({ name: 'post', id: post.id }), 'ayna community');
        if (r === 'copied') toast('link copied');
      },
    },
    !post.is_mine && { label: 'Report post', onClick: () => openReport({ targetType: 'post', postId: post.id }) },
    !post.is_mine && {
      label: 'Hide post',
      onClick: async () => {
        if (!requireProfile(null, 'hide posts')) return;
        try { await store.hidePost(supabase, user.id, post.id); onRemove?.(post); toast('Hidden from your feed'); } catch (e) { toast(store.friendlyError(e)); }
      },
    },
    !post.is_mine && post.author_id && {
      label: `Block ${post.author_display_name || 'user'}`,
      danger: true,
      onClick: () => confirmBlock({ userId: post.author_id, name: post.author_display_name }),
    },
  ];

  const visibleTopics = (post.topics || []).slice(0, 3);
  const icon = {
    helpful: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21V10l4.5-7c1.4 0 2.3 1.2 2 2.6L12.8 10H19a2 2 0 0 1 2 2.3l-1.2 6.8a2 2 0 0 1-2 1.7H7Zm0 0H4V10h3" /></svg>,
    like: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>,
    comment: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" /></svg>,
    save: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>,
    share: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>,
  };

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
        <span className={`cm-kind cm-kind--${post.kind}`}>{KIND_LABEL[post.kind]}</span>
        <OverflowMenu items={menu} />
      </div>

      {post.kind === 'review' && (
        <div className="cm-review__rating">
          <Stars value={post.rating} />
          {post.would_recommend === true && <span className="cm-rec-pill">would rec ✓</span>}
          {post.would_recommend === false && <span className="cm-rec-pill cm-rec-pill--no">wouldn’t rec</span>}
        </div>
      )}

      {expanded
        ? <p className={`cm-text${post.kind === 'question' ? ' cm-text--question' : ''}`}>{post.body}</p>
        : <ClampedText text={post.body} lines={4} className={post.kind === 'question' ? 'cm-text--question-wrap' : ''} />}

      <PostMedia media={post.media} legacyUrl={post.photo_url} />

      {productIds.length > 0 && (
        <div className="cm-post__products" onClick={(e) => e.stopPropagation()}>
          {post.kind === 'review' && post.product_id && (
            <CommunityProductPreview productId={post.product_id} onOpened={() => trackCommunity('community_product_opened', { source: 'review' })} />
          )}
          {(expanded ? taggedOnly : taggedOnly.slice(0, 1)).map((id) => (
            <CommunityProductPreview key={id} productId={id} onOpened={() => trackCommunity('community_product_opened', { source: post.kind })} />
          ))}
          {!expanded && taggedOnly.length > 1 && (
            <button type="button" className="cm-more" onClick={openThread}>+{taggedOnly.length - 1} more product{taggedOnly.length > 2 ? 's' : ''}</button>
          )}
        </div>
      )}

      <div className="cm-post__foot" onClick={(e) => e.stopPropagation()}>
        {expanded && visibleTopics.length > 0 && (
          <div className="cm-tags">
            {visibleTopics.map((t) => <span key={t} className="cm-tag" title={topicLabel(t)}>#{t.replace(/-/g, '')}</span>)}
          </div>
        )}
        <div className="cm-actions">
          {post.is_mine ? (
            <span className="cm-action cm-action--static" title={isLike ? "likes" : "helpful votes"}>
              {isLike ? icon.like : icon.helpful}<span>{post.helpful_count || ''}</span>
            </span>
          ) : (
            <button
              type="button"
              className={`cm-action${post.viewer_found_helpful ? ' is-on' : ''}`}
              aria-pressed={!!post.viewer_found_helpful}
              aria-label={`${isLike ? 'Like' : 'Helpful'}${post.helpful_count ? ` (${post.helpful_count})` : ''}`}
              onClick={() => toggle('viewer_found_helpful', (on) => store.setHelpful(supabase, user.id, { postId: post.id }, on))}
            >
              {isLike ? icon.like : icon.helpful}<span>{post.helpful_count || ''}</span>
            </button>
          )}
          <button type="button" className="cm-action" aria-label={`${post.kind === 'question' ? 'Answers' : 'Comments'}${post.comment_count ? ` (${post.comment_count})` : ''}`} onClick={openThread}>
            {icon.comment}<span>{post.comment_count || ''}</span>
          </button>
          <button
            type="button"
            className={`cm-action${post.viewer_saved ? ' is-on' : ''}`}
            aria-pressed={!!post.viewer_saved}
            aria-label={post.viewer_saved ? 'Saved' : 'Save'}
            onClick={() => toggle('viewer_saved', (on) => store.setSaved(supabase, user.id, post.id, on))}
          >
            {icon.save}
          </button>
        </div>
      </div>
    </article>
  );
}
