import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCommunity } from './CommunityContext';
import { Sheet, Stars, Toggle, UserAvatar } from './CommunityUI';
import ProductPicker from './ProductPicker';
import HashtagTextarea from './HashtagTextarea';
import { COMMUNITY_TOPICS, suggestTopicsForProducts, extractHashtagTopics } from '../../utils/community/topics';
import * as store from '../../utils/community/communityStore';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS } from '../../utils/community/imageUpload';
import { trackCommunity } from '../../utils/community/analytics';

const TITLES = {
  post: 'start a discussion',
  question: 'ask a question',
  review: 'review a product',
  playlist: 'new playlist',
};

/** Who the post is from. Accounts choose; guests are always Anonymous. */
function PostAs({ me, anonymous, onChange }) {
  return (
    <div className="cm-postas" role="radiogroup" aria-label="Post as">
      <span className="cm-postas__label">post as</span>
      <button type="button" role="radio" aria-checked={!anonymous} className={!anonymous ? 'is-on' : ''} onClick={() => onChange(false)}>
        <UserAvatar name={me?.display_name} url={me?.avatar_url} size={28} />
        <span className="cm-postas__who">
          <strong>{me?.display_name}</strong>
          <small>@{me?.username}</small>
        </span>
      </button>
      <button type="button" role="radio" aria-checked={anonymous} className={anonymous ? 'is-on' : ''} onClick={() => onChange(true)}>
        <UserAvatar anonymous size={28} />
        <span className="cm-postas__who">
          <strong>Anonymous</strong>
          <small>no name or profile shown</small>
        </span>
      </button>
    </div>
  );
}

const PLACEHOLDERS = {
  question: 'ask anything — e.g. “has anything actually helped your hormonal acne?”',
  review: 'how did it go? the good, the bad, the honest',
  post: 'share a tip, a win, a rant, a thought…',
};

export default function CommunityComposer({ initialKind = 'question', initialProductId = null, onClose, onCreated }) {
  const { supabase, user, me, isGuest, resolveActor, productsById } = useCommunity();
  const kind = initialKind;
  const [body, setBody] = useState('');
  const [topics, setTopics] = useState([]);
  const [productIds, setProductIds] = useState(initialProductId && initialKind !== 'review' ? [initialProductId] : []);
  const [reviewProductId, setReviewProductId] = useState(initialKind === 'review' ? initialProductId : null);
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [anonymousChoice, setAnonymous] = useState(false);
  const anonymous = isGuest || anonymousChoice;
  const [photos, setPhotos] = useState([]); // File[]
  const [progress, setProgress] = useState('');
  const [showProducts, setShowProducts] = useState(Boolean(initialProductId && initialKind !== 'review'));
  const [showTopics, setShowTopics] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistPublic, setPlaylistPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addPhotos = (files) => {
    const list = [...(files || [])];
    try {
      list.forEach(checkImageFile);
      setPhotos((prev) => [...prev, ...list].slice(0, MAX_POST_PHOTOS));
      if (photos.length + list.length > MAX_POST_PHOTOS) setError(`Up to ${MAX_POST_PHOTOS} photos per post.`);
      else setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const suggestedTopics = useMemo(() => {
    const products = [...productIds, reviewProductId].filter(Boolean).map((id) => productsById.get(id));
    return suggestTopicsForProducts(products).filter((t) => !topics.includes(t));
  }, [productIds, reviewProductId, productsById, topics]);

  const toggleTopic = (key) => setTopics((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : prev.length >= 5 ? prev : [...prev, key]));
  const toggleProduct = (id) => setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 3)));

  const canSubmit = kind === 'playlist'
    ? playlistTitle.trim().length > 0
    : body.trim().length > 0 && (kind !== 'review' || (reviewProductId && rating > 0));

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError('');
    const media = [];
    try {
      if (kind === 'playlist') {
        if (!user) return;
        const playlist = await store.createPlaylist(supabase, user.id, {
          title: playlistTitle, description: playlistDescription, visibility: playlistPublic ? 'public' : 'private',
        });
        for (const id of productIds) await store.addToPlaylist(supabase, playlist.id, id);
        trackCommunity('playlist_created', { item_count: productIds.length, source: 'composer' });
        onCreated?.({ type: 'playlist', id: playlist.id });
        return;
      }
      // Guests: the anonymous guest session is created here, on first post.
      const actorId = await resolveActor();
      if (!actorId) return;
      for (let i = 0; i < photos.length; i += 1) {
        setProgress(photos.length > 1 ? `uploading photo ${i + 1} of ${photos.length}…` : 'uploading photo…');
        media.push(await uploadCommunityImage(supabase, photos[i], { folder: 'posts' }));
      }
      setProgress('');
      const post = await store.createPost(supabase, actorId, {
        kind,
        body,
        // Topics picked from chips plus any known #hashtags typed in the text.
        topics: [...new Set([...topics, ...extractHashtagTopics(body)])].slice(0, 5),
        isAnonymous: anonymous,
        productId: reviewProductId,
        rating: kind === 'review' ? rating : null,
        wouldRecommend: kind === 'review' ? wouldRecommend : null,
        taggedProductIds: productIds,
        media,
      });
      const props = { kind, has_product: Boolean(reviewProductId || productIds.length), has_photo: media.length > 0, is_anonymous: anonymous, item_count: media.length };
      trackCommunity('community_post_created', props);
      if (anonymous) trackCommunity('community_anonymous_post_created', props);
      if (isGuest) trackCommunity('community_guest_post_created', props);
      if (kind === 'question') trackCommunity('community_question_created', props);
      if (kind === 'review') trackCommunity('community_review_created', props);
      onCreated?.({ type: 'post', id: post.id });
    } catch (e) {
      media.forEach((m) => deleteCommunityImage(supabase, m.path)); // don't orphan uploads
      setError(e?.message && !e.code && /photo|image/i.test(e.message) ? e.message : store.friendlyError(e));
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const footer = (
    <div className="cm-composer__foot">
      {error && <p className="cm-error" role="alert">{error}</p>}
      <button type="button" className="btn btn-navy cm-btn-block" disabled={!canSubmit || saving} onClick={submit}>
        {saving ? (progress || 'posting…') : kind === 'playlist' ? 'create playlist' : kind === 'question' ? 'ask the community' : kind === 'review' ? 'post review' : 'post'}
      </button>
    </div>
  );

  return (
    <Sheet title={TITLES[kind] || 'new post'} onClose={onClose} footer={footer}>

      {kind === 'playlist' ? (
        <div className="cm-form">
          <label className="cm-field">
            <span>Name</span>
            <input className="cm-input" value={playlistTitle} maxLength={80} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="e.g. travel period kit ✈️" />
          </label>
          <label className="cm-field">
            <span>Description <em>optional</em></span>
            <textarea className="cm-input" rows={2} maxLength={300} value={playlistDescription} onChange={(e) => setPlaylistDescription(e.target.value)} />
          </label>
          <div className="cm-field">
            <span>Products</span>
            <ProductPicker selected={productIds} onToggle={toggleProduct} max={50} placeholder="add ayna products" />
          </div>
          <Toggle checked={playlistPublic} onChange={setPlaylistPublic} label="Public" hint="Anyone on ayna can find it. Turn off to keep it to yourself." />
          <p className="cm-hint">✦ anyone who opens it sees each product’s match for <em>them</em> — not yours.</p>
        </div>
      ) : (
        <div className="cm-form">
          {kind === 'review' && (
            <>
              <div className="cm-field">
                <span>Product</span>
                {reviewProductId ? (
                  <div className="cm-chip-selected cm-chip-selected--lg">
                    {productsById.get(reviewProductId)?.name || 'Product'}
                    <button type="button" aria-label="Change product" onClick={() => setReviewProductId(null)}>×</button>
                  </div>
                ) : (
                  <ProductPicker selected={[]} onToggle={(id) => setReviewProductId(id)} max={1} placeholder="Which ayna product?" />
                )}
              </div>
              <div className="cm-field cm-field--row">
                <span>Rating</span>
                <Stars value={rating} onChange={setRating} size="lg" />
              </div>
              <div className="cm-field cm-field--row">
                <span>Would you recommend it?</span>
                <div className="cm-yesno">
                  <button type="button" className={wouldRecommend === true ? 'is-active' : ''} onClick={() => setWouldRecommend(wouldRecommend === true ? null : true)}>Yes</button>
                  <button type="button" className={wouldRecommend === false ? 'is-active' : ''} onClick={() => setWouldRecommend(wouldRecommend === false ? null : false)}>No</button>
                </div>
              </div>
            </>
          )}

          <div className="cm-field">
            <HashtagTextarea
              className="cm-input cm-input--body"
              rows={kind === 'review' ? 4 : 5}
              maxLength={5000}
              value={body}
              onChange={setBody}
              onPickTopic={(key) => setTopics((prev) => (prev.includes(key) || prev.length >= 5 ? prev : [...prev, key]))}
              placeholder={PLACEHOLDERS[kind]}
              aria-label="Text"
              autoFocus={kind !== 'review'}
            />
            <p className="cm-hashtag-hint">type # to tag a topic</p>
          </div>

          {previews.length > 0 && (
            <div className="cm-photo-strip">
              {previews.map((src, i) => (
                <div key={src} className="cm-photo-preview">
                  <img src={src} alt="" />
                  <button type="button" className="cm-icon-btn" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {showProducts && (
            <div className="cm-field">
              <span>{kind === 'review' ? 'Also mention' : 'Products'}</span>
              <ProductPicker selected={productIds} onToggle={toggleProduct} autoFocus />
            </div>
          )}

          {showTopics && (
            <div className="cm-field">
              <span>Topics</span>
              <div className="cm-topic-picker">
                {COMMUNITY_TOPICS.map((t) => (
                  <button key={t.key} type="button" className={topics.includes(t.key) ? 'is-active' : ''} aria-pressed={topics.includes(t.key)} onClick={() => toggleTopic(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showTopics && suggestedTopics.length > 0 && (
            <div className="cm-suggest">
              <span>Suggested:</span>
              {suggestedTopics.map((t) => (
                <button key={t} type="button" className="cm-topic cm-topic--btn" onClick={() => toggleTopic(t)}>+ {COMMUNITY_TOPICS.find((x) => x.key === t)?.label}</button>
              ))}
            </div>
          )}
          {!showTopics && topics.length > 0 && (
            <div className="cm-topics">{topics.map((t) => <span key={t} className="cm-topic">{COMMUNITY_TOPICS.find((x) => x.key === t)?.label || t}</span>)}</div>
          )}

          <div className="cm-attach">
            <button type="button" className={showProducts ? 'is-on' : ''} onClick={() => setShowProducts((v) => !v)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Zm4 0V6a3 3 0 0 1 6 0v2" /></svg>
              Add product
            </button>
            <button type="button" disabled={photos.length >= MAX_POST_PHOTOS} onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></svg>
              {photos.length ? `Photos ${photos.length}/${MAX_POST_PHOTOS}` : 'Add photos'}
            </button>
            <button type="button" className={showTopics ? 'is-on' : ''} onClick={() => setShowTopics((v) => !v)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></svg>
              Add topic
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
          </div>

          {isGuest ? (
            <div className="cm-postas cm-postas--guest">
              <UserAvatar anonymous size={28} />
              <span className="cm-postas__who">
                <strong>Posting as Anonymous</strong>
                <small>No account needed. You can edit or delete it from this device.</small>
              </span>
            </div>
          ) : (
            <PostAs me={me} anonymous={anonymous} onChange={setAnonymous} />
          )}
        </div>
      )}
    </Sheet>
  );
}
