import React, { useMemo, useRef, useState } from 'react';
import { useCommunity } from './CommunityContext';
import { Sheet, Stars, Toggle } from './CommunityUI';
import ProductPicker from './ProductPicker';
import { COMMUNITY_TOPICS, suggestTopicsForProducts } from '../../utils/community/topics';
import * as store from '../../utils/community/communityStore';
import { uploadCommunityImage } from '../../utils/community/imageUpload';
import { trackCommunity } from '../../utils/community/analytics';

const KINDS = [
  { key: 'question', label: 'Question' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post' },
  { key: 'playlist', label: 'Playlist' },
];

const PLACEHOLDERS = {
  question: 'ask anything — e.g. “has anything actually helped your hormonal acne?”',
  review: 'how did it go? the good, the bad, the honest',
  post: 'share a tip, a win, a rant…',
};

export default function CommunityComposer({ initialKind = 'question', initialProductId = null, onClose, onCreated }) {
  const { supabase, user, productsById } = useCommunity();
  const [kind, setKind] = useState(initialKind);
  const [body, setBody] = useState('');
  const [topics, setTopics] = useState([]);
  const [productIds, setProductIds] = useState(initialProductId && initialKind !== 'review' ? [initialProductId] : []);
  const [reviewProductId, setReviewProductId] = useState(initialKind === 'review' ? initialProductId : null);
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [showProducts, setShowProducts] = useState(Boolean(initialProductId && initialKind !== 'review'));
  const [showTopics, setShowTopics] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistPublic, setPlaylistPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

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
    try {
      if (kind === 'playlist') {
        const playlist = await store.createPlaylist(supabase, user.id, {
          title: playlistTitle, description: playlistDescription, visibility: playlistPublic ? 'public' : 'private',
        });
        for (const id of productIds) await store.addToPlaylist(supabase, playlist.id, id);
        trackCommunity('playlist_created', { item_count: productIds.length, source: 'composer' });
        onCreated?.({ type: 'playlist', id: playlist.id });
        return;
      }
      let photoUrl = null;
      if (photo) photoUrl = await uploadCommunityImage(supabase, photo, { folder: 'posts' });
      const post = await store.createPost(supabase, user.id, {
        kind,
        body,
        topics,
        isAnonymous: anonymous,
        productId: reviewProductId,
        rating: kind === 'review' ? rating : null,
        wouldRecommend: kind === 'review' ? wouldRecommend : null,
        photoUrl,
        taggedProductIds: productIds,
      });
      const props = { kind, has_product: Boolean(reviewProductId || productIds.length), has_photo: Boolean(photoUrl), is_anonymous: anonymous };
      trackCommunity('community_post_created', props);
      if (kind === 'question') trackCommunity('community_question_created', props);
      if (kind === 'review') trackCommunity('community_review_created', props);
      onCreated?.({ type: 'post', id: post.id });
    } catch (e) {
      setError(e?.message && !e.code && /photo|image/i.test(e.message) ? e.message : store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="cm-composer__foot">
      {error && <p className="cm-error" role="alert">{error}</p>}
      <button type="button" className="btn btn-navy cm-btn-block" disabled={!canSubmit || saving} onClick={submit}>
        {saving ? 'posting…' : kind === 'playlist' ? 'create playlist' : kind === 'question' ? 'ask the community' : kind === 'review' ? 'post review' : 'post'}
      </button>
    </div>
  );

  return (
    <Sheet title="new post" onClose={onClose} footer={footer}>
      <div className="cm-segmented" role="tablist" aria-label="What are you creating?">
        {KINDS.map((k) => (
          <button key={k.key} type="button" role="tab" aria-selected={kind === k.key} className={kind === k.key ? 'is-active' : ''} onClick={() => setKind(k.key)}>
            {k.label}
          </button>
        ))}
      </div>

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

          <label className="cm-field">
            <span className="sr-only">Text</span>
            <textarea
              className="cm-input cm-input--body"
              rows={kind === 'review' ? 4 : 5}
              maxLength={5000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={PLACEHOLDERS[kind]}
              autoFocus={kind !== 'review'}
            />
          </label>

          {photoPreview && (
            <div className="cm-photo-preview">
              <img src={photoPreview} alt="" />
              <button type="button" className="cm-icon-btn" aria-label="Remove photo" onClick={() => setPhoto(null)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
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
            <button type="button" onClick={() => fileRef.current?.click()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></svg>
              Add photo
            </button>
            <button type="button" className={showTopics ? 'is-on' : ''} onClick={() => setShowTopics((v) => !v)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></svg>
              Add topic
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { setPhoto(e.target.files?.[0] || null); e.target.value = ''; }} />
          </div>

          <Toggle checked={anonymous} onChange={setAnonymous} label="Post anonymously" hint="Your name and profile won’t appear on this post." />
        </div>
      )}
    </Sheet>
  );
}
