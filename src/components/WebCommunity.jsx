import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSupabaseClient } from '../utils/supabaseClient';
import { getGuestClient, getGuestId, ensureGuestSession } from '../utils/community/guestClient.js';
import * as community from '../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../utils/community/ranking.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts } from '../utils/community/topics.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../utils/community/imageUpload.js';
import { makePlaylistCoverFile } from '../mobile/components/playlistCoverImage.js';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../utils/naturalLanguageSearch.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import './WebCommunity.css';

// The app's Community, built for the website. Same data and rules (shared
// community store, ranking, topics, guest posting); the layout is a two
// column page with the feed on the left and your profile + actions on the right.

const TABS = [['for-you', 'For you'], ['following', 'Following'], ['question', 'Questions'], ['review', 'Reviews'], ['playlists', 'Playlists']];
const KIND_TITLES = { post: 'New post', question: 'Ask a question', review: 'Write a review', playlist: 'Create a playlist', recommend: 'Recommend a product' };
const COVER_COLORS = ['#1D1A2B', '#B9C2F4', '#F7BADD', '#BDEBD6', '#F7E78E'];
const AUDIENCE = [['public', 'Everyone'], ['friends', 'Friends only'], ['private', 'Only me']];
const timeLabel = (v) => (v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');

function Avatar({ name, path, anonymous = false, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const initials = anonymous ? 'A' : String(name || 'A').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <span className="wc-avatar" style={{ width: size, height: size }} aria-hidden="true">{path && !failed ? <img src={publicMediaUrl(path)} alt="" onError={() => setFailed(true)} /> : initials}</span>;
}

function Mention({ productId, productsById, quizResults, onOpenProduct }) {
  const product = productsById.get(String(productId));
  if (!product) return null;
  const match = quizResults ? getProductMatchDetailsForProduct(product, quizResults) : null;
  const show = match?.matchStatus === 'scored' && Number.isFinite(match.percent);
  return <button type="button" className="wc-mention" onClick={() => onOpenProduct(product)}>
    <span className="wc-mention-photo"><ProductTileImage product={product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></span>
    <span><strong>{product.name}</strong><small>{product.brand || 'ayna product'}</small></span>
    <em>{show ? `${match.percent}% match` : 'View'}</em>
  </button>;
}

function Picker({ products, value, onChange }) {
  const [q, setQ] = useState('');
  const matches = useMemo(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    return products.map((p) => ({ p, s: scoreQueryAgainstProduct(t, buildSearchTextForItem(p, CATEGORY_LABELS), buildIdentityTextForItem(p, CATEGORY_LABELS)) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.p);
  }, [products, q]);
  const selected = products.find((p) => String(p.id) === String(value));
  if (selected) return <div className="wc-picked"><span>{selected.name}</span><button type="button" onClick={() => { onChange(null); setQ(''); }}>Remove</button></div>;
  return <div className="wc-picker">
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mention a product (optional)" aria-label="Find a product" />
    {matches.length > 0 && <div className="wc-results">{matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQ(''); }}>{p.name}<small>{[p.brand, p.category?.replace(/-/g, ' ')].filter(Boolean).join(' · ')}</small></button>)}</div>}
  </div>;
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(<div className="wc-sheet-backdrop" onClick={onClose}><div className="wc-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
    <header><h2>{title}</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></header>{children}
  </div></div>, document.body);
}

export default function WebCommunity({ user, products = [], quizResults = null, onOpenProduct, onRequireAuth, seedKind = null, seedProductId = null }) {
  const supabase = user ? getSupabaseClient() : (getGuestClient() || getSupabaseClient());
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const [tab, setTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSection, setPlaylistSection] = useState('recent');
  const [followingIds, setFollowingIds] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [page, setPage] = useState(null);
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [items, setItems] = useState([]);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [compose, setCompose] = useState(seedKind);
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(seedProductId);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('public');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileById, setProfileById] = useState(new Map());
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [reportPost, setReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notifications, setNotifications] = useState(null);

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = (feature = 'this feature') => onRequireAuth?.(feature);
  const closePage = () => { setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); };
  const openCompose = (kind = 'post') => {
    if (!user && ['review', 'playlist', 'recommend'].includes(kind)) { requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : 'friend recommendations'); return; }
    setCompose(kind); setError('');
  };
  const matchFor = (id) => { const p = productsById.get(String(id)); return p && quizResults ? getProfileMatchPercentForProduct(p, quizResults) : null; };

  useEffect(() => {
    if (!supabase) return undefined;
    const ids = [...new Set([...posts, ...comments, ...(searchResults?.posts || []), ...(page?.type === 'post' && details ? [details] : [])].map((i) => i.author_id).filter(Boolean))];
    if (!ids.length) return undefined;
    let active = true;
    community.getProfilesByIds(supabase, ids).then((m) => { if (active) setProfileById((prev) => new Map([...prev, ...m])); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, posts, comments, searchResults, page, details]);

  useEffect(() => {
    if (!supabase || !user) return;
    community.getMyCommunityProfile(supabase, user.id).then(setProfile).catch(() => {});
    community.listFollowingIds(supabase, user.id).then(setFollowingIds).catch(() => {});
    community.listMyFriendships(supabase).then(async (rows) => {
      setFriendships(rows);
      const ids = community.friendIdsFrom(rows, user.id);
      const m = await community.getProfilesByIds(supabase, ids);
      setFriendProfiles(ids.map((id) => m.get(id)).filter(Boolean));
    }).catch(() => {});
  }, [supabase, user, refresh]);

  useEffect(() => {
    if (!supabase || page || search) return undefined;
    let active = true;
    setLoading(true);
    (async () => {
      if (tab === 'playlists') {
        const rows = await community.listPlaylists(supabase, { section: playlistSection });
        if (active) { setPlaylists(rows); setPosts([]); setCursor(null); }
      } else {
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, { matchFor, followingIds: new Set(followingIds) }) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    })().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizResults, playlistSection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search.trim().length < 2 || !supabase) return undefined;
    let active = true;
    const t = window.setTimeout(async () => {
      try { const r = await community.searchCommunity(supabase, search); if (active) setSearchResults(r); } catch (e) { if (active) notifyError(e); }
    }, 250);
    return () => { active = false; window.clearTimeout(t); };
  }, [search, supabase]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, cursor });
      setPosts((prev) => [...prev, ...(tab === 'for-you' ? rankForYou(rows, { matchFor }) : rows)]);
      setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null);
    } catch (e) { notifyError(e); } finally { setLoading(false); }
  };
  const openPost = async (post) => {
    setPage({ type: 'post', id: post.id }); setDetails(post); setError(''); window.scrollTo(0, 0);
    try { setComments(await community.listComments(supabase, post.id)); } catch (e) { notifyError(e); }
  };
  const openPlaylist = async (pl) => {
    setProductId(null); setPage({ type: 'playlist', id: pl.id }); setDetails(pl); setError(''); window.scrollTo(0, 0);
    setItems((pl.preview_product_ids || []).map((product_id) => ({ product_id })));
    try { setItems(await community.listPlaylistItems(supabase, pl.id)); } catch (e) { if (!pl.preview_product_ids?.length) notifyError(e); }
  };
  const refreshPlaylist = async (id) => {
    const [next, nextItems] = await Promise.all([community.getPlaylist(supabase, id), community.listPlaylistItems(supabase, id)]);
    if (next) setDetails(next);
    setItems(nextItems); setRefresh((v) => v + 1);
  };
  const openProfile = async (username) => {
    if (!username) return;
    setPage({ type: 'profile', id: username }); setDetails(null); setProfilePosts([]); setProfilePlaylists([]); setError(''); window.scrollTo(0, 0);
    try {
      const p = await community.getProfileByUsername(supabase, username);
      setDetails(p);
      if (p?.user_id) {
        const [a, b] = await Promise.allSettled([
          community.listFeedPosts(supabase, { authorIds: [p.user_id], limit: 8 }),
          community.listPlaylists(supabase, { section: p.user_id === user?.id ? 'mine' : 'owner', ownerIds: [p.user_id], limit: 8 }),
        ]);
        if (a.status === 'fulfilled') setProfilePosts(a.value);
        if (b.status === 'fulfilled') setProfilePlaylists(b.value);
      }
    } catch (e) { notifyError(e); }
  };
  const loadNotifications = async () => {
    if (!user) { requireAccount('notifications'); return; }
    try { setNotifications(await community.listNotifications(supabase)); await community.markNotificationsRead(supabase); } catch (e) { notifyError(e); }
  };
  const saveProfile = async () => {
    if (!user || !profileName.trim() || !profileHandle.trim()) return;
    setBusy(true); setError('');
    try { setProfile(await community.upsertCommunityProfile(supabase, user.id, { username: profileHandle, displayName: profileName })); setNotice('Profile saved'); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const submit = async () => {
    if (busy) return;
    if (compose === 'playlist' ? !playlistTitle.trim() : compose !== 'recommend' && !body.trim()) return;
    if (compose === 'review' && !productId) { setError('Choose a product to review.'); return; }
    if (compose === 'recommend' && (!productId || !selectedFriendIds.length)) { setError('Choose a product and at least one friend.'); return; }
    if (user && !profile) { setError('Set up your community profile first.'); return; }
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      if (compose === 'recommend') {
        await community.sendRecommendations(client, userId, productId, selectedFriendIds, body);
        setCompose(null); setBody(''); setProductId(null); setSelectedFriendIds([]); setNotice('Recommendation sent.');
      } else if (compose === 'playlist') {
        let cover;
        try {
          const file = coverPhoto || await makePlaylistCoverFile(playlistTitle, coverColor);
          cover = await uploadCommunityImage(client, file, { folder: 'covers', userId });
          const result = await community.createPlaylist(client, userId, { title: playlistTitle, visibility: playlistVisibility, coverUrl: cover.url });
          if (productId) { try { await community.addToPlaylist(client, result.id, productId); } catch { setNotice('Playlist created, but the product could not be added.'); } }
          setCompose(null); setPlaylistTitle(''); setPlaylistVisibility('public'); setProductId(null); setCoverPhoto(null); setTab('playlists'); setRefresh((v) => v + 1); await openPlaylist(result);
        } catch (e) { if (cover) await deleteCommunityImage(client, cover.path); throw e; }
      } else {
        const product = productsById.get(String(productId));
        const topics = [...new Set([...extractHashtagTopics(body), ...suggestTopicsForProducts(product ? [product] : [])])].slice(0, 5);
        const media = [];
        let result;
        try {
          for (const photo of photos) media.push(await uploadCommunityImage(client, photo, { folder: 'posts' }));
          result = await community.createPost(client, userId, { kind: compose, body, topics, media, isAnonymous: !user || anonymous, productId: compose === 'review' ? productId : null, rating: compose === 'review' ? rating : null, taggedProductIds: compose === 'review' || !productId ? [] : [productId] });
        } catch (e) { await Promise.all(media.map((m) => deleteCommunityImage(client, m.path))); throw e; }
        setCompose(null); setBody(''); setProductId(null); setAnonymous(false); setPhotos([]); setRefresh((v) => v + 1);
        const post = await community.getFeedPost(client, result.id);
        if (post) await openPost(post);
      }
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const submitComment = async () => {
    if (!commentBody.trim() || !details?.id) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      await community.createComment(client, userId, { postId: details.id, parentId: replyTo, body: commentBody, isAnonymous: !user || anonymous, productId });
      setComments(await community.listComments(client, details.id)); setCommentBody(''); setReplyTo(null); setProductId(null);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const togglePost = async (post, kind) => {
    if (!user) { requireAccount(kind === 'save' ? 'saved posts' : 'reactions'); return; }
    try {
      const on = !post[kind === 'save' ? 'viewer_saved' : 'viewer_found_helpful'];
      if (kind === 'save') await community.setSaved(supabase, user.id, post.id, on);
      else await community.setHelpful(supabase, user.id, { postId: post.id }, on);
      setRefresh((v) => v + 1);
      if (page?.type === 'post') setDetails(await community.getFeedPost(supabase, post.id));
    } catch (e) { notifyError(e); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await getGuestId();
      await community.deletePost(client, deleteTarget.id, userId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (page?.type === 'post' && page.id === deleteTarget.id) closePage();
      setDeleteTarget(null); setNotice('Post deleted.'); setRefresh((v) => v + 1);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const submitReport = async () => {
    if (!reportPost) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      await community.fileReport(client, userId, { targetType: 'post', postId: reportPost.id, reason: reportReason });
      setReportPost(null); setNotice('Report sent. Thank you for helping keep Community safe.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const hashtagMatch = body.match(/(?:^|\s)#([A-Za-z][\w-]*)?$/);
  const hashtagSuggestions = hashtagMatch ? suggestHashtags(hashtagMatch[1] || '', 6) : [];

  const renderPost = (post) => {
    const name = post.is_anonymous || !post.author_id ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
    const kind = post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : null;
    return <article className={`wc-post kind-${post.kind}`} key={post.id}>
      <header>
        <Avatar name={name} path={!post.is_anonymous && post.author_id ? profileById.get(post.author_id)?.avatar_url : null} anonymous={post.is_anonymous || !post.author_id} />
        <div>{post.is_anonymous || !post.author_username ? <strong>{name}</strong> : <button type="button" className="wc-name" onClick={() => openProfile(post.author_username)}>{name}</button>}<small>{timeLabel(post.created_at)}{kind ? ` · ${kind}` : ''}</small></div>
        <button type="button" className="wc-more" onClick={() => (post.is_mine ? setDeleteTarget(post) : setReportPost(post))}>{post.is_mine ? 'Delete' : 'Report'}</button>
      </header>
      <button type="button" className="wc-body" onClick={() => openPost(post)}>{post.body}</button>
      {(post.media || []).length > 0 && <div className="wc-photos">{post.media.slice(0, 4).map((m) => <img key={m.path} src={publicMediaUrl(m.path)} alt="" loading="lazy" />)}</div>}
      {post.kind === 'review' && <span className="wc-stars" aria-label={`Rated ${post.rating || 0} out of 5`}>{'★'.repeat(post.rating || 0)}{'☆'.repeat(5 - (post.rating || 0))}</span>}
      {postProductIds(post).slice(0, 1).map((id) => <Mention key={id} productId={id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} />)}
      <footer>
        <button type="button" aria-pressed={Boolean(post.viewer_found_helpful)} onClick={() => togglePost(post, 'helpful')}>{post.kind === 'post' ? 'Like' : 'Helpful'}{post.helpful_count ? ` ${post.helpful_count}` : ''}</button>
        <button type="button" onClick={() => openPost(post)}>Reply{post.comment_count ? ` ${post.comment_count}` : ''}</button>
        <button type="button" aria-pressed={Boolean(post.viewer_saved)} onClick={() => togglePost(post, 'save')}>{post.viewer_saved ? 'Saved' : 'Save'}</button>
      </footer>
    </article>;
  };
  const playlistCard = (p) => <button type="button" className="wc-playlist" key={p.id} onClick={() => openPlaylist(p)}>
    <span className="wc-cover">{p.cover_url ? <img src={publicMediaUrl(p.cover_url)} alt="" loading="lazy" /> : 'ayna'}</span>
    <strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · by {p.owner_display_name || 'ayna community'}</small>
  </button>;

  if (!supabase) return <section className="wc"><div className="wc-empty"><h1>Community isn’t loading</h1><p>Try again later.</p></div></section>;

  let main;
  if (page?.type === 'post' && details) {
    main = <>
      {renderPost(details)}
      <h2 className="wc-h2">Replies</h2>
      {comments.length === 0 && <p className="wc-muted">No replies yet.</p>}
      {comments.map((c) => <div className="wc-comment" key={c.id}>
        <header><Avatar size={30} name={c.author_display_name || c.author_username} path={!c.is_anonymous && c.author_id ? profileById.get(c.author_id)?.avatar_url : null} anonymous={c.is_anonymous || !c.author_id} /><strong>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</strong><small>{timeLabel(c.created_at)}</small></header>
        <p>{c.body}</p>
        {c.product_id && <Mention productId={c.product_id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} />}
        <button type="button" className="wc-link" onClick={() => setReplyTo(c.id)}>Reply</button>
      </div>)}
      <div className="wc-reply">
        {replyTo && <button type="button" className="wc-link" onClick={() => setReplyTo(null)}>Replying to a comment · cancel</button>}
        <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" />
        <Picker products={products} value={productId} onChange={setProductId} />
        {user && <label className="wc-check"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Reply anonymously</label>}
        <button type="button" className="wc-btn" disabled={busy || !commentBody.trim()} onClick={submitComment}>Post reply</button>
      </div>
    </>;
  } else if (page?.type === 'playlist' && details) {
    const mine = user?.id === details.owner_id;
    main = <section className="wc-pl-detail">
      <div className="wc-pl-hero"><span className="wc-cover is-big">{details.cover_url ? <img src={publicMediaUrl(details.cover_url)} alt="" /> : 'ayna'}</span>
        <div><small>{details.item_count ?? items.length} picks</small><h1>{details.title}</h1>{details.description && <p>{details.description}</p>}{mine && <button type="button" className="wc-link is-danger" onClick={async () => { setBusy(true); try { await community.deletePlaylist(supabase, details.id); closePage(); setRefresh((v) => v + 1); setNotice('Playlist deleted.'); } catch (e) { notifyError(e); } finally { setBusy(false); } }}>Delete playlist</button>}</div></div>
      <div className="wc-pl-items">{items.map((it) => <div key={it.product_id} className="wc-pl-item"><Mention productId={it.product_id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} />{mine && <button type="button" className="wc-link" disabled={busy} onClick={async () => { setBusy(true); try { await community.removeFromPlaylist(supabase, details.id, it.product_id); await refreshPlaylist(details.id); } catch (e) { notifyError(e); } finally { setBusy(false); } }}>Remove</button>}</div>)}</div>
      {items.length === 0 && <p className="wc-muted">No products added yet.</p>}
      {mine && <div className="wc-card"><h3>Add a product</h3><Picker products={products.filter((p) => !items.some((s) => String(s.product_id) === String(p.id)))} value={productId} onChange={setProductId} />
        <button type="button" className="wc-btn" disabled={busy || !productId} onClick={async () => { setBusy(true); try { await community.addToPlaylist(supabase, details.id, productId); await refreshPlaylist(details.id); setProductId(null); } catch (e) { notifyError(e); } finally { setBusy(false); } }}>Add to playlist</button></div>}
    </section>;
  } else if (page?.type === 'profile') {
    main = !details ? <p className="wc-muted">Loading…</p> : <section>
      <div className="wc-prof-hero"><Avatar size={72} name={details.display_name} path={details.avatar_url} /><div><h1>{details.display_name}</h1><small>@{details.username}</small>{details.bio && <p>{details.bio}</p>}</div></div>
      {user && details.user_id !== user.id && <div className="wc-row">
        <button type="button" className="wc-btn" onClick={async () => { try { const on = !followingIds.includes(details.user_id); await community.setFollowing(supabase, user.id, details.user_id, on); setFollowingIds((ids) => (on ? [...ids, details.user_id] : ids.filter((id) => id !== details.user_id))); } catch (e) { notifyError(e); } }}>{followingIds.includes(details.user_id) ? 'Following' : 'Follow'}</button>
        <button type="button" className="wc-btn is-ghost" onClick={async () => { try { const st = community.friendshipState(friendships, user.id, details.user_id); if (st.state === 'none') await community.sendFriendRequest(supabase, user.id, details.user_id); else if (st.state === 'incoming') await community.acceptFriendRequest(supabase, st.row.id); else return; setRefresh((v) => v + 1); } catch (e) { notifyError(e); } }}>{({ none: 'Add friend', incoming: 'Accept request', requested: 'Requested', friends: 'Friends' })[community.friendshipState(friendships, user.id, details.user_id).state]}</button>
      </div>}
      {!user && <div className="wc-row"><button type="button" className="wc-btn" onClick={() => requireAccount('following people')}>Follow</button></div>}
      <h2 className="wc-h2">Playlists</h2>
      {profilePlaylists.length ? <div className="wc-pl-grid">{profilePlaylists.map(playlistCard)}</div> : <p className="wc-muted">No playlists shared yet.</p>}
      <h2 className="wc-h2">Posts</h2>
      {profilePosts.length ? profilePosts.map(renderPost) : <p className="wc-muted">No posts shared yet.</p>}
    </section>;
  } else if (search) {
    main = search.trim().length < 2 ? <p className="wc-muted">Type at least two letters to search Community.</p> : !searchResults ? <p className="wc-muted">Searching…</p> : <>
      {searchResults.people.length > 0 && <><h2 className="wc-h2">People</h2><div className="wc-people">{searchResults.people.map((p) => <button type="button" key={p.user_id} onClick={() => openProfile(p.username)}><Avatar name={p.display_name} path={p.avatar_url} /><span>{p.display_name}<small>@{p.username}</small></span></button>)}</div></>}
      {searchResults.posts.length > 0 && <><h2 className="wc-h2">Posts</h2>{searchResults.posts.map(renderPost)}</>}
      {searchResults.playlists.length > 0 && <><h2 className="wc-h2">Playlists</h2><div className="wc-pl-grid">{searchResults.playlists.map(playlistCard)}</div></>}
      {!searchResults.people.length && !searchResults.posts.length && !searchResults.playlists.length && <p className="wc-muted">No results. Try a name, topic, or playlist.</p>}
    </>;
  } else {
    main = <>
      <div className="wc-tabs" role="tablist">{TABS.map(([k, l]) => <button type="button" role="tab" key={k} aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => (k === 'following' && !user ? requireAccount('your following feed') : setTab(k))}>{l}</button>)}</div>
      {tab === 'playlists' ? <>
        <div className="wc-row is-split"><div className="wc-seg">{[['recent', 'Community'], ['friends', 'Friends'], ['mine', 'My playlists']].map(([k, l]) => <button type="button" key={k} aria-pressed={playlistSection === k} onClick={() => (k !== 'recent' && !user ? requireAccount('your playlists') : setPlaylistSection(k))}>{l}</button>)}</div><button type="button" className="wc-btn" onClick={() => openCompose('playlist')}>Create playlist</button></div>
        {playlists.length ? <div className="wc-pl-grid">{playlists.map(playlistCard)}</div> : !loading && <div className="wc-empty"><h2>No playlists yet</h2><p>Collect your favorites.</p></div>}
      </> : <>
        <button type="button" className="wc-share" onClick={() => openCompose(tab === 'question' ? 'question' : tab === 'review' ? 'review' : 'post')}><Avatar name={profile?.display_name || 'You'} path={profile?.avatar_url} /><span>{tab === 'question' ? 'Ask the community a question' : tab === 'review' ? 'Review a product you’ve tried' : 'Share with the community'}</span><b aria-hidden="true">+</b></button>
        {posts.map(renderPost)}
        {!loading && posts.length === 0 && <div className="wc-empty"><h2>{tab === 'question' ? 'No questions yet' : tab === 'review' ? 'No reviews yet' : 'No posts yet'}</h2><p>{tab === 'following' ? 'Follow someone to see their posts.' : 'Be the first.'}</p></div>}
        {cursor && <button type="button" className="wc-btn is-ghost wc-more-btn" disabled={loading} onClick={loadMore}>Show more posts</button>}
      </>}
      {loading && <p className="wc-muted">Loading…</p>}
    </>;
  }

  return <section className="wc">
    <div className="wc-head">
      {page ? <button type="button" className="wc-back" onClick={closePage}>← Community</button> : <h1>Community</h1>}
      <label className="wc-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></svg><input value={search} onChange={(e) => { setSearch(e.target.value); setSearchResults(null); if (page) closePage(); }} placeholder="Search people, posts, playlists" aria-label="Search Community" />{search && <button type="button" aria-label="Clear" onClick={() => { setSearch(''); setSearchResults(null); }}>×</button>}</label>
    </div>
    {error && <p className="wc-error" role="alert">{error}</p>}
    {notice && <p className="wc-notice" role="status">{notice}</p>}
    <div className="wc-layout">
      <div className="wc-main">{main}</div>
      <aside className="wc-side">
        {user && !profile ? <div className="wc-card"><h3>Join Community</h3><p className="wc-muted">Your health answers stay private.</p>
          <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" aria-label="Display name" />
          <input value={profileHandle} onChange={(e) => setProfileHandle(e.target.value.toLowerCase())} placeholder="Username" aria-label="Username" />
          <button type="button" className="wc-btn" disabled={busy} onClick={saveProfile}>Create profile</button></div>
          : <div className="wc-card wc-me"><Avatar size={56} name={profile?.display_name || 'Guest'} path={profile?.avatar_url} /><div><strong>{profile?.display_name || 'Guest'}</strong><small>{profile ? `@${profile.username}` : 'Posting anonymously'}</small></div>{profile && <button type="button" className="wc-link" onClick={() => openProfile(profile.username)}>View profile</button>}</div>}
        <div className="wc-card"><h3>Create</h3><div className="wc-create">{[['post', 'Post'], ['question', 'Question'], ['review', 'Review'], ['playlist', 'Playlist'], ['recommend', 'Recommend']].map(([k, l], i) => <button type="button" key={k} className={`tone-${i % 4}`} onClick={() => openCompose(k)}>{l}</button>)}</div></div>
        <div className="wc-card"><div className="wc-row is-split"><h3>Updates</h3><button type="button" className="wc-link" onClick={loadNotifications}>{notifications ? 'Refresh' : 'Show'}</button></div>
          {notifications && (notifications.length ? <ul className="wc-notes">{notifications.slice(0, 8).map((n) => <li key={n.id}>{n.message || n.body || n.type?.replace(/_/g, ' ')}<small>{timeLabel(n.created_at)}</small></li>)}</ul> : <p className="wc-muted">Nothing new.</p>)}</div>
      </aside>
    </div>

    {compose && <Sheet title={KIND_TITLES[compose]} onClose={() => setCompose(null)}>
      <div className="wc-seg">{Object.keys(KIND_TITLES).map((k) => <button type="button" key={k} aria-pressed={compose === k} onClick={() => openCompose(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      {compose === 'playlist' ? <>
        <input value={playlistTitle} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="Playlist name, e.g. My everyday essentials" aria-label="Playlist name" />
        <div className="wc-seg">{AUDIENCE.map(([v, l]) => <button type="button" key={v} aria-pressed={playlistVisibility === v} onClick={() => setPlaylistVisibility(v)}>{l}</button>)}</div>
        <div className="wc-colors"><span>Cover</span>{COVER_COLORS.map((c) => <button type="button" key={c} aria-label={`Cover colour ${c}`} aria-pressed={!coverPhoto && coverColor === c} style={{ background: c }} onClick={() => { setCoverColor(c); setCoverPhoto(null); }} />)}<label className="wc-link">or upload a photo<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { try { checkImageFile(f); setCoverPhoto(f); } catch (err) { setError(err.message); } } }} /></label>{coverPhoto && <small>{coverPhoto.name}</small>}</div>
      </> : <>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} />
        {hashtagSuggestions.length > 0 && <div className="wc-tags">{hashtagSuggestions.map((t) => <button type="button" key={t.key} onClick={() => setBody((x) => x.replace(/#(?:[A-Za-z][\w-]*)?$/, `${t.tag} `))}>{t.tag}</button>)}</div>}
      </>}
      {compose === 'review' && <div className="wc-rating" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} className={n <= rating ? 'is-on' : ''} onClick={() => setRating(n)}>★</button>)}</div>}
      <Picker products={products} value={productId} onChange={setProductId} />
      {compose !== 'playlist' && compose !== 'recommend' && <label className="wc-link">Add photos (up to {MAX_POST_PHOTOS})<input type="file" accept="image/*" multiple hidden onChange={(e) => { try { const f = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); f.forEach(checkImageFile); setPhotos(f); setError(''); } catch (err) { setError(err.message); } }} />{photos.length > 0 && <small> · {photos.map((f) => f.name).join(', ')}</small>}</label>}
      {compose === 'recommend' && <div className="wc-friends"><strong>Send to friends</strong>{friendProfiles.length ? friendProfiles.map((f) => <label key={f.user_id}><input type="checkbox" checked={selectedFriendIds.includes(f.user_id)} onChange={(e) => setSelectedFriendIds((ids) => (e.target.checked ? [...ids, f.user_id] : ids.filter((id) => id !== f.user_id)))} /> {f.display_name || f.username}</label>) : <p className="wc-muted">Add friends from Community profiles first.</p>}</div>}
      {user && compose !== 'playlist' && compose !== 'recommend' && <label className="wc-check"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously</label>}
      {!user && <p className="wc-muted">You’re not signed in, so this posts anonymously.</p>}
      {error && <p className="wc-error" role="alert">{error}</p>}
      <button type="button" className="wc-btn" disabled={busy} onClick={submit}>{busy ? 'Sharing…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : compose === 'question' ? 'Ask question' : compose === 'review' ? 'Post review' : 'Share post'}</button>
    </Sheet>}
    {deleteTarget && <Sheet title="Delete post?" onClose={() => setDeleteTarget(null)}><p className="wc-muted">This removes your post and its replies.</p><button type="button" className="wc-btn" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting…' : 'Delete post'}</button></Sheet>}
    {reportPost && <Sheet title="Report post" onClose={() => setReportPost(null)}><select value={reportReason} onChange={(e) => setReportReason(e.target.value)} aria-label="Reason"><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="wc-btn" disabled={busy} onClick={submitReport}>Send report</button></Sheet>}
  </section>;
}
