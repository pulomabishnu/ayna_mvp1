import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCommunity } from './CommunityContext';
import CommunityPostCard, { AuthorLine } from './CommunityPostCard';
import { CommunityProductPreview, EmptyState, FeedSkeleton, OverflowMenu, Toggle } from './CommunityUI';
import ProductPicker from './ProductPicker';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';

function CommentItem({ comment, reaction = 'helpful', onReply, onChange, onRemove }) {
  const { supabase, user, requireProfile, toast, openReport, confirmBlock } = useCommunity();
  const isLike = reaction === 'like';
  const toggleHelpful = async () => {
    if (comment.is_mine || !requireProfile(null, isLike ? 'like comments' : 'mark answers helpful')) return;
    const next = !comment.viewer_found_helpful;
    onChange({ ...comment, viewer_found_helpful: next, helpful_count: Math.max(0, comment.helpful_count + (next ? 1 : -1)) });
    try {
      await store.setHelpful(supabase, user.id, { commentId: comment.id }, next);
    } catch (e) {
      onChange(comment);
      toast(store.friendlyError(e));
    }
  };
  const menu = [
    comment.is_mine && {
      label: 'Delete',
      danger: true,
      onClick: async () => {
        if (!window.confirm('Delete this comment?')) return;
        try { await store.deleteComment(supabase, comment.id); onRemove(comment); } catch (e) { toast(store.friendlyError(e)); }
      },
    },
    !comment.is_mine && { label: 'Report comment', onClick: () => openReport({ targetType: 'comment', commentId: comment.id }) },
    !comment.is_mine && comment.author_id && {
      label: `Block ${comment.author_display_name || 'user'}`,
      danger: true,
      onClick: () => confirmBlock({ userId: comment.author_id, name: comment.author_display_name }),
    },
  ];
  return (
    <div className="cm-comment">
      <div className="cm-comment__head">
        <AuthorLine item={comment} />
        <OverflowMenu items={menu} />
      </div>
      <p className="cm-text cm-comment__body">{comment.body}</p>
      {comment.product_id && (
        <CommunityProductPreview productId={comment.product_id} onOpened={() => trackCommunity('community_product_opened', { source: 'comment' })} />
      )}
      <div className="cm-actions cm-actions--small">
        {comment.is_mine ? (
          <span className="cm-action cm-action--static">
            <span>{comment.helpful_count ? (isLike ? `${comment.helpful_count} like${comment.helpful_count > 1 ? 's' : ''}` : `${comment.helpful_count} found this helpful`) : 'Your reply'}</span>
          </span>
        ) : (
          <button type="button" className={`cm-action${comment.viewer_found_helpful ? ' is-on' : ''}`} aria-pressed={!!comment.viewer_found_helpful} onClick={toggleHelpful}>
            <span>{isLike ? (comment.viewer_found_helpful ? 'Liked' : 'Like') : 'Helpful'}{comment.helpful_count ? ` · ${comment.helpful_count}` : ''}</span>
          </button>
        )}
        {onReply && <button type="button" className="cm-action" onClick={() => onReply(comment)}><span>Reply</span></button>}
      </div>
    </div>
  );
}

function ReplyBox({ post, replyTo, onCancelReply, onPosted }) {
  const { supabase, user, isGuest, resolveActor, toast } = useCommunity();
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  // Answering in your own anonymous thread defaults to anonymous, so a reply
  // can't accidentally put your name next to an anonymous question.
  const [anonymousChoice, setAnonymous] = useState(Boolean(post.is_mine && post.is_anonymous));
  const anonymous = isGuest || anonymousChoice; // guests always reply as Anonymous
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || saving) return;
    setSaving(true);
    try {
      const actorId = await resolveActor();
      if (!actorId) return;
      await store.createComment(supabase, actorId, { postId: post.id, parentId: replyTo?.id || null, body, productId, isAnonymous: anonymous });
      trackCommunity('community_comment_created', { kind: post.kind, has_product: Boolean(productId), is_anonymous: anonymous });
      setBody('');
      setProductId(null);
      setShowPicker(false);
      onPosted();
    } catch (err) {
      toast(store.friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="cm-reply" onSubmit={submit}>
      {replyTo && (
        <div className="cm-reply__to">
          Replying to {replyTo.is_anonymous || !replyTo.author_id ? 'Anonymous' : replyTo.author_display_name}
          <button type="button" className="cm-link" onClick={onCancelReply}>Cancel</button>
        </div>
      )}
      <textarea
        className="cm-input"
        rows={2}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={post.kind === 'question' ? 'Share what worked for you' : 'Add a comment'}
        aria-label="Your reply"
      />
      {showPicker && (
        <ProductPicker selected={productId ? [productId] : []} onToggle={(id) => setProductId(productId === id ? null : id)} max={1} autoFocus />
      )}
      <div className="cm-reply__bar">
        <button type="button" className={`cm-chip-btn${showPicker || productId ? ' is-on' : ''}`} onClick={() => setShowPicker((v) => !v)}>
          {productId ? '1 product' : 'Add product'}
        </button>
        {user ? <Toggle checked={anonymous} onChange={setAnonymous} label="Anonymous" /> : <span className="cm-reply__as">replying as Anonymous</span>}
        <button type="submit" className="btn btn-navy cm-btn-sm" disabled={!body.trim() || saving}>{saving ? '…' : 'Reply'}</button>
      </div>
    </form>
  );
}

export default function PostThread({ postId }) {
  const { supabase, navigate } = useCommunity();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [state, setState] = useState('loading');
  const [replyTo, setReplyTo] = useState(null);

  const load = useCallback(() => (
    Promise.all([store.getFeedPost(supabase, postId), store.listComments(supabase, postId)])
      .then(([p, c]) => {
        setPost(p);
        setComments(c);
        setState(p ? 'ready' : 'missing');
      })
      .catch(() => setState('error'))
  ), [supabase, postId]);

  useEffect(() => { load(); }, [load]);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top = [];
    const map = new Map();
    comments.forEach((c) => {
      if (c.parent_id) {
        if (!map.has(c.parent_id)) map.set(c.parent_id, []);
        map.get(c.parent_id).push(c);
      } else top.push(c);
    });
    return { topLevel: top, repliesByParent: map };
  }, [comments]);

  const updateComment = (next) => setComments((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  const removeComment = (gone) => setComments((prev) => prev.filter((c) => c.id !== gone.id && c.parent_id !== gone.id));

  if (state === 'loading') return <FeedSkeleton count={2} />;
  if (state !== 'ready') {
    return (
      <EmptyState title="This post isn’t available" action={<button type="button" className="btn btn-navy" onClick={() => navigate({ name: 'feed' })}>Back to Community</button>}>
        It may have been deleted.
      </EmptyState>
    );
  }

  return (
    <div className="cm-thread">
      <CommunityPostCard post={post} expanded onChange={setPost} onRemove={() => navigate({ name: 'feed' }, { replace: true })} />
      <p className="cm-disclaimer">Community posts share personal experience, not medical advice.</p>

      <section className="cm-comments" aria-label={post.kind === 'question' ? 'Answers' : 'Comments'}>
        <h3 className="cm-section-title">{post.kind === 'question' ? 'Answers' : 'Comments'}{post.comment_count ? ` (${post.comment_count})` : ''}</h3>
        {topLevel.length === 0 && <p className="cm-hint">{post.kind === 'question' ? 'No answers yet. Know something that helped?' : 'No comments yet.'}</p>}
        {topLevel.map((c) => (
          <div key={c.id} className="cm-comment-group">
            <CommentItem comment={c} reaction={post.kind === 'post' ? 'like' : 'helpful'} onReply={setReplyTo} onChange={updateComment} onRemove={removeComment} />
            {(repliesByParent.get(c.id) || []).length > 0 && (
              <div className="cm-replies">
                {repliesByParent.get(c.id).map((r) => (
                  <CommentItem key={r.id} comment={r} reaction={post.kind === 'post' ? 'like' : 'helpful'} onReply={() => setReplyTo(c)} onChange={updateComment} onRemove={removeComment} />
                ))}
              </div>
            )}
          </div>
        ))}
        <ReplyBox post={post} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onPosted={() => { setReplyTo(null); load(); }} />
      </section>
    </div>
  );
}
