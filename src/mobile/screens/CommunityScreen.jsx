import { useCallback, useEffect, useMemo, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { getGuestClient, ensureGuestSession } from '../../utils/community/guestClient.js';
import * as community from '../../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../../utils/community/ranking.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts } from '../../utils/community/topics.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../../utils/community/imageUpload.js';
import { getProfileMatchPercentForProduct } from '../../data/products.js';
import './community-mobile.css';

const TABS = [ ['for-you', 'For you'], ['following', 'Following'], ['question', 'Q&A'], ['review', 'Reviews'], ['playlists', 'Playlists'] ];
const timeLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

function ProductMention({ productId, productsById, quizAnswers, onOpenProduct }) {
  const product = productsById.get(String(productId));
  if (!product) return null;
  const match = quizAnswers ? getProfileMatchPercentForProduct(product, quizAnswers) : null;
  return <button type="button" className="am-product" onClick={() => onOpenProduct(product)}>
    {product.image && <img src={product.image} alt="" loading="lazy" />}
    <span><strong>{product.name}</strong><small>{product.brand || 'ayna product'}</small></span>
    <em>{Number.isFinite(match) ? `${match}% for you` : 'View'}</em>
  </button>;
}

function ProductPicker({ products, value, onChange }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter((p) => `${p.name} ${p.brand || ''}`.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);
  const selected = products.find((p) => String(p.id) === String(value));
  return <div className="am-picker">
    <label htmlFor="am-product-query">Tag an ayna product</label>
    {selected ? <div className="am-picked"><span>{selected.name}</span><button type="button" onClick={() => { onChange(null); setQuery(''); }}>Remove</button></div> : <>
      <input id="am-product-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
      {matches.length > 0 && <div className="am-results">{matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQuery(''); }}>{p.name}<small>{p.brand || ''}</small></button>)}</div>}
    </>}
  </div>;
}

export default function CommunityScreen({ authUser, products = [], quizAnswers, headerInitial, onOpenProduct, onGoBrowse, onGoEco, onOpenSaved, onOpenProfile, onRequireAuth, seedKind, seedProductId }) {
  const supabase = getSupabaseClient();
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const [tab, setTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [page, setPage] = useState(null); // { type: 'post' | 'playlist' | 'profile' | 'notifications', id }
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [items, setItems] = useState([]);
  const [compose, setCompose] = useState(seedKind || null); // 'post' | 'question' | 'review' | 'playlist'
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(seedProductId || null);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [playlistTitle, setPlaylistTitle] = useState('');
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
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [reportPost, setReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const hashtagPartial = body.match(/#([A-Za-z][\w-]*)$/)?.[1];
  const hashtagSuggestions = hashtagPartial ? suggestHashtags(hashtagPartial, 5) : [];

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = () => { setNotice('Create an account to use this feature.'); onRequireAuth?.(); };
  const closePage = () => { setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); };

  useEffect(() => {
    if (!supabase || !authUser) return;
    community.getMyCommunityProfile(supabase, authUser.id).then(setProfile).catch(() => {});
    community.listFollowingIds(supabase, authUser.id).then(setFollowingIds).catch(() => {});
    community.listMyFriendships(supabase).then(async (rows) => {
      setFriendships(rows);
      const ids = community.friendIdsFrom(rows, authUser.id);
      const profiles = await community.getProfilesByIds(supabase, ids);
      setFriendProfiles(ids.map((id) => profiles.get(id)).filter(Boolean));
    }).catch(() => {});
  }, [supabase, authUser, refresh]);

  useEffect(() => {
    if (!supabase || page || search) return;
    let active = true;
    setLoading(true);
    const run = async () => {
      if (tab === 'playlists') {
        const rows = await community.listPlaylists(supabase, { section: 'recent' });
        if (active) { setPlaylists(rows); setPosts([]); setCursor(null); }
      } else {
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, { matchFor: (id) => { const p = productsById.get(String(id)); return p && quizAnswers ? getProfileMatchPercentForProduct(p, quizAnswers) : null; }, followingIds: new Set(followingIds) }) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    };
    run().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizAnswers]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, cursor });
      setPosts((prev) => [...prev, ...(tab === 'for-you' ? rankForYou(rows, { matchFor: (id) => { const p = productsById.get(String(id)); return p && quizAnswers ? getProfileMatchPercentForProduct(p, quizAnswers) : null; } }) : rows)]);
      setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null);
    } catch (e) { notifyError(e); } finally { setLoading(false); }
  };

  const openPost = async (post) => {
    setPage({ type: 'post', id: post.id }); setDetails(post); setError('');
    try { setComments(await community.listComments(supabase, post.id)); } catch (e) { notifyError(e); }
  };
  const openPlaylist = async (playlist) => {
    setPage({ type: 'playlist', id: playlist.id }); setDetails(playlist); setError('');
    try { setItems(await community.listPlaylistItems(supabase, playlist.id)); } catch (e) { notifyError(e); }
  };
  const openProfile = async (username) => {
    if (!username) return;
    setPage({ type: 'profile', id: username }); setError('');
    try { setDetails(await community.getProfileByUsername(supabase, username)); } catch (e) { notifyError(e); }
  };
  const openNotifications = async () => {
    if (!authUser) { requireAccount(); return; }
    setPage({ type: 'notifications' }); setError('');
    try { const rows = await community.listNotifications(supabase); setDetails(rows); await community.markNotificationsRead(supabase); } catch (e) { notifyError(e); }
  };

  const saveProfile = async () => {
    if (!authUser || !profileName.trim() || !profileHandle.trim()) return;
    setBusy(true); setError('');
    try {
      const next = await community.upsertCommunityProfile(supabase, authUser.id, { username: profileHandle, displayName: profileName });
      setProfile(next); setNotice('Profile saved');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const submit = async () => {
    if (busy) return;
    if (compose === 'playlist' ? !playlistTitle.trim() : compose !== 'recommend' && !body.trim()) return;
    if (compose === 'review' && !productId) { setError('Choose a product to review.'); return; }
    if (compose === 'recommend' && (!productId || !selectedFriendIds.length)) { setError('Choose a product and at least one friend.'); return; }
    if (!authUser && (compose === 'review' || compose === 'playlist' || compose === 'recommend')) { requireAccount(); return; }
    if (authUser && !profile) { setError('Set up your community profile first.'); return; }
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      if (compose === 'recommend') {
        await community.sendRecommendations(client, userId, productId, selectedFriendIds, body);
        setCompose(null); setBody(''); setProductId(null); setSelectedFriendIds([]); setNotice('Recommendation sent to your friend.');
      } else if (compose === 'playlist') {
        const result = await community.createPlaylist(client, userId, { title: playlistTitle });
        if (productId) await community.addToPlaylist(client, result.id, productId);
        setCompose(null); setPlaylistTitle(''); setProductId(null); setTab('playlists'); setRefresh((v) => v + 1); await openPlaylist(result);
      } else {
        const product = productsById.get(String(productId));
        const topics = [...new Set([...extractHashtagTopics(body), ...suggestTopicsForProducts(product ? [product] : [])])].slice(0, 5);
        const media = [];
        let result;
        try {
          for (const photo of photos) media.push(await uploadCommunityImage(client, photo, { folder: 'posts' }));
          result = await community.createPost(client, userId, { kind: compose, body, topics, media, isAnonymous: !authUser || anonymous, productId: compose === 'review' ? productId : null, rating: compose === 'review' ? rating : null, taggedProductIds: compose === 'review' || !productId ? [] : [productId] });
        } catch (e) {
          await Promise.all(media.map((item) => deleteCommunityImage(client, item.path)));
          throw e;
        }
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
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      await community.createComment(client, userId, { postId: details.id, parentId: replyTo, body: commentBody, isAnonymous: !authUser || anonymous, productId });
      setComments(await community.listComments(client, details.id)); setCommentBody(''); setReplyTo(null); setProductId(null);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const togglePost = async (post, kind) => {
    if (!authUser) { requireAccount(); return; }
    try {
      const on = !post[kind === 'save' ? 'viewer_saved' : 'viewer_found_helpful'];
      if (kind === 'save') await community.setSaved(supabase, authUser.id, post.id, on);
      else await community.setHelpful(supabase, authUser.id, { postId: post.id }, on);
      setRefresh((v) => v + 1);
      if (page?.type === 'post') setDetails(await community.getFeedPost(supabase, post.id));
    } catch (e) { notifyError(e); }
  };

  const submitReport = async () => {
    if (!reportPost) return;
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      await community.fileReport(client, userId, { targetType: 'post', postId: reportPost.id, reason: reportReason });
      setReportPost(null); setNotice('Report sent. Thank you for helping keep Community safe.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const runSearch = useCallback(async (value) => {
    setSearch(value); setSearchResults(null);
    if (value.trim().length < 2 || !supabase) return;
    try { setSearchResults(await community.searchCommunity(supabase, value)); } catch (e) { notifyError(e); }
  }, [supabase]);

  const renderPost = (post) => <article className="am-card" key={post.id}>
    <div className="am-meta"><button type="button" onClick={() => openProfile(post.author_username)}>{post.is_anonymous || !post.author_id ? 'Anonymous' : post.author_display_name || post.author_username}</button><span>{timeLabel(post.created_at)}</span></div>
    <button type="button" className="am-postbody" onClick={() => openPost(post)}>{post.body}</button>
    {(post.media || []).length > 0 && <div className="am-photo-grid">{post.media.slice(0, 4).map((photo) => <img key={photo.path} src={publicMediaUrl(photo.path)} alt="" loading="lazy" />)}</div>}
    {post.kind !== 'post' && <small className="am-kind">{post.kind === 'question' ? 'question' : 'review'}{post.kind === 'review' ? ` · ${'★'.repeat(post.rating || 0)}` : ''}</small>}
    {postProductIds(post).slice(0, 1).map((id) => <ProductMention key={id} productId={id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />)}
    <div className="am-actions"><button type="button" onClick={() => togglePost(post, 'helpful')}>{post.kind === 'post' ? '♡' : 'Helpful'} {post.helpful_count || ''}</button><button type="button" onClick={() => openPost(post)}>Reply {post.comment_count || ''}</button><button type="button" onClick={() => togglePost(post, 'save')}>{post.viewer_saved ? 'Saved' : 'Save'}</button>{!post.is_mine && <button type="button" aria-label="Report post" onClick={() => setReportPost(post)}>⋯</button>}</div>
  </article>;

  if (!supabase) return <div className="am-screen"><MobileHeader activeTab="community" onBack={onGoEco} onGoBrowse={onGoBrowse} onGoEco={onGoEco} /><p className="am-empty">Community is unavailable right now.</p></div>;
  return <div className="am-screen">
    <MobileHeader activeTab="community" initial={headerInitial} onBack={onGoEco} onGoBrowse={onGoBrowse} onGoEco={onGoEco} onGoCommunity={() => {}} onOpenSaved={onOpenSaved} onOpenProfile={onOpenProfile} />
    <div className="am-scroll">
      <div className="am-top"><div><small>THE AYNA COMMUNITY</small><h1>{page ? (page.type === 'notifications' ? 'Notifications' : page.type === 'playlist' ? 'Playlist' : page.type === 'profile' ? 'Profile' : 'Conversation') : 'Community'}</h1></div><div className="am-top-actions"><button type="button" onClick={openNotifications} aria-label="Notifications">♧</button><button type="button" onClick={() => { closePage(); setCompose('post'); }} aria-label="Create">＋</button></div></div>
      {error && <p className="am-error" role="alert">{error}</p>}{notice && <p className="am-notice" role="status">{notice}</p>}
      {page ? <>
        <button type="button" className="am-back" onClick={closePage}>← Community</button>
        {page.type === 'post' && details && <>{renderPost(details)}<h2 className="am-section">Replies</h2>{comments.map((c) => <div className="am-comment" key={c.id}><div className="am-meta"><span>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</span><span>{timeLabel(c.created_at)}</span></div><p>{c.body}</p>{c.product_id && <ProductMention productId={c.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />}<button type="button" onClick={() => setReplyTo(c.id)}>Reply</button></div>)}<div className="am-compose-inline">{replyTo && <button type="button" onClick={() => setReplyTo(null)}>Replying · cancel</button>}<textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" /><ProductPicker products={products} value={productId} onChange={setProductId} /><button type="button" className="am-primary" disabled={busy || !commentBody.trim()} onClick={submitComment}>Post reply</button></div></>}
        {page.type === 'playlist' && details && <><h2 className="am-detail-title">{details.title}</h2><p className="am-detail-copy">{details.description || ''}</p>{items.map((item) => <ProductMention key={item.product_id} productId={item.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />)}{items.length === 0 && <p className="am-empty">No products added yet.</p>}</>}
        {page.type === 'profile' && details && <><h2 className="am-detail-title">{details.display_name}</h2><p className="am-detail-copy">@{details.username}</p>{details.bio && <p>{details.bio}</p>}{authUser && details.user_id !== authUser.id && <div className="am-profile-actions"><button type="button" className="am-primary" onClick={async () => { try { const on = !followingIds.includes(details.user_id); await community.setFollowing(supabase, authUser.id, details.user_id, on); setFollowingIds((ids) => on ? [...ids, details.user_id] : ids.filter((id) => id !== details.user_id)); } catch (e) { notifyError(e); } }}>{followingIds.includes(details.user_id) ? 'Following' : 'Follow'}</button><button type="button" className="am-secondary" onClick={async () => { try { const state = community.friendshipState(friendships, authUser.id, details.user_id); if (state.state === 'none') await community.sendFriendRequest(supabase, authUser.id, details.user_id); else if (state.state === 'incoming') await community.acceptFriendRequest(supabase, state.row.id); else return; setRefresh((v) => v + 1); } catch (e) { notifyError(e); } }}>{({ none: 'Add friend', incoming: 'Accept request', requested: 'Requested', friends: 'Friends' })[community.friendshipState(friendships, authUser.id, details.user_id).state]}</button></div>}</>}
        {page.type === 'notifications' && (details || []).map((n) => <div className="am-card" key={n.id}><p>{n.message || n.body || n.type?.replace(/_/g, ' ')}</p><small>{timeLabel(n.created_at)}</small></div>)}
      </> : <>
        {authUser && !profile && <div className="am-card am-profile-setup"><strong>Make your community profile</strong><p>Your health profile stays private.</p><input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" /><input value={profileHandle} onChange={(e) => setProfileHandle(e.target.value)} placeholder="Username" /><button type="button" disabled={busy} onClick={saveProfile}>Save profile</button></div>}
        <div className="am-search"><input value={search} onChange={(e) => runSearch(e.target.value)} placeholder="Search people, posts, playlists" aria-label="Search Community" />{search && <button type="button" onClick={() => { setSearch(''); setSearchResults(null); }}>×</button>}</div>
        {search ? <>{searchResults?.people?.map((p) => <button type="button" className="am-list-row" key={p.user_id} onClick={() => openProfile(p.username)}>{p.display_name}<small>@{p.username}</small></button>)}{searchResults?.posts?.map(renderPost)}{searchResults?.playlists?.map((p) => <button type="button" className="am-list-row" key={p.id} onClick={() => openPlaylist(p)}>{p.title}<small>{p.item_count} products</small></button>)}{searchResults && !searchResults.people.length && !searchResults.posts.length && !searchResults.playlists.length && <p className="am-empty">Nothing found.</p>}</> : <>
          <div className="am-tabs">{TABS.map(([key, label]) => <button type="button" key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>
          {tab === 'playlists' ? <>{playlists.map((p) => <button type="button" className="am-playlist" key={p.id} onClick={() => openPlaylist(p)}><span className="am-cover">♫</span><span><strong>{p.title}</strong><small>{p.item_count || 0} products · {p.owner_display_name || 'ayna community'}</small></span><b>›</b></button>)}{!loading && playlists.length === 0 && <p className="am-empty">No playlists yet. Start one with products you love.</p>}</> : <>{posts.map(renderPost)}{!loading && posts.length === 0 && <p className="am-empty">{tab === 'following' ? 'Follow people to see their posts here.' : 'Nothing here yet.'}</p>}{cursor && <button type="button" className="am-more" disabled={loading} onClick={loadMore}>Show more</button>}</>}
          {loading && <p className="am-empty">Loading…</p>}
        </>}
      </>}
    </div>
    {reportPost && <div className="am-sheet-backdrop" onClick={() => setReportPost(null)}><div className="am-sheet" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Report post</h2><button type="button" onClick={() => setReportPost(null)}>×</button></div><p className="am-detail-copy">Tell us what needs review.</p><select value={reportReason} onChange={(e) => setReportReason(e.target.value)}><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="am-primary" disabled={busy} onClick={submitReport}>Send report</button></div></div>}
    {compose && <div className="am-sheet-backdrop" onClick={() => setCompose(null)}><div className="am-sheet" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Create</h2><button type="button" onClick={() => setCompose(null)}>×</button></div><div className="am-type-row">{[['post','Post'],['question','Question'],['review','Review'],['playlist','Playlist'],['recommend','Recommend']].map(([kind,label]) => <button type="button" key={kind} className={compose === kind ? 'is-active' : ''} onClick={() => { setCompose(kind); setError(''); }}>{label}</button>)}</div>{compose === 'playlist' ? <input value={playlistTitle} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="Playlist name" /> : <><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} />{hashtagSuggestions.length > 0 && <div className="am-hashtags">{hashtagSuggestions.map((tag) => <button type="button" key={tag.key} onClick={() => setBody((text) => text.replace(/#[A-Za-z][\w-]*$/, `${tag.tag} `))}>{tag.tag}</button>)}</div>}</>}{compose === 'review' && <div className="am-rating">Rating <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></div>}<ProductPicker products={products} value={productId} onChange={setProductId} />{compose !== 'playlist' && compose !== 'recommend' && <label className="am-photo-input">Add photos (up to 4)<input type="file" accept="image/*" multiple onChange={(e) => { try { const files = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); files.forEach(checkImageFile); setPhotos(files); setError(''); } catch (error) { setError(error.message); } }} />{photos.length > 0 && <small>{photos.map((file) => file.name).join(', ')}</small>}</label>}{compose === 'recommend' && <div className="am-friends"><strong>Send to friends</strong>{friendProfiles.length ? friendProfiles.map((friend) => <label key={friend.user_id}><input type="checkbox" checked={selectedFriendIds.includes(friend.user_id)} onChange={(e) => setSelectedFriendIds((ids) => e.target.checked ? [...ids, friend.user_id] : ids.filter((id) => id !== friend.user_id))} /> {friend.display_name || friend.username}</label>) : <p>Add friends in Community profiles first.</p>}</div>}{authUser && compose !== 'playlist' && compose !== 'recommend' && <label className="am-anon"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously</label>}{error && <p className="am-error" role="alert">{error}</p>}<button type="button" className="am-primary" disabled={busy} onClick={submit}>{busy ? 'Posting…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : 'Post'}</button></div></div>}
  </div>;
}
